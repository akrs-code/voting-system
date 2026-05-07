import User from "../models/userSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Election from "../models/electionSchema.js";
import { sendStatusEmail } from "../utils/emailHelper.js";
import { handleMongoError } from "../utils/errorHandler.js";
import Ballot from "../models/ballotSchema.js";

export const login = async (req, res) => {
    try {
        const { studentId, password } = req.body;

        if (!studentId || !password) {
            return res.status(400).json({ message: "Please provide both your Student ID and password to log in." });
        }

        const normalizedId = studentId.trim();
        const user = await User.findOne({ studentId: normalizedId });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials. Please double-check your Student ID and password." });
        }

        if (user.role === "voter" && user.isVerified === "pending") {
            return res.status(403).json({
                message: "Your account is still pending admin approval. Please wait or visit the BYTES office."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials. Please double-check your Student ID and password." });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 2 * 60 * 60 * 1000,
        });

        res.json({
            user: {
                _id: user._id,
                studentId: user.studentId,
                name: user.name,
                department: user.department,
                yearLevel: user.yearLevel,
                role: user.role,
                email: user.email,
                votedElections: user.votedElections
            },
        });
    } catch (error) {
        res.status(500).json({ message: handleMongoError(error) });
    }
};

export const signup = async (req, res) => {
    try {
        const { name, studentId, password, department, yearLevel, email, role } = req.body;

        if (!name || !studentId || !password || !department || !yearLevel || !email) {
            return res.status(400).json({ message: "Registration failed. All fields (Name, ID, Password, Department, Year, and Email) are required." });
        }

        const normalizedId = studentId.trim();
        const existingUser = await User.findOne({ studentId: normalizedId });

        if (existingUser) {
            return res.status(400).json({ message: `An account with Student ID ${normalizedId} already exists.` });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name: name.trim(),
            studentId: normalizedId,
            password: hashedPassword,
            department: department.toUpperCase(),
            yearLevel,
            email,
            role: role || "voter",
            isVerified: "approved"
        });

        res.status(201).json({
            message: "User registered successfully",
            studentId: newUser.studentId
        });
    } catch (error) {
        return res.status(500).json({ message: handleMongoError(error) });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, studentId, password, department, yearLevel, role, email } = req.body;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User account not found." });

        if (studentId) {
            const normalizedId = studentId.trim().toLowerCase();
            if (normalizedId !== user.studentId) {
                const existingUser = await User.findOne({ studentId: normalizedId });
                if (existingUser) return res.status(400).json({ message: `Student ID ${normalizedId} is already assigned to another user.` });
                user.studentId = normalizedId;
            }
        }

        if (name) user.name = name.trim();
        if (department) user.department = department;
        if (yearLevel) user.yearLevel = yearLevel;
        if (role) user.role = role;
        if (email) user.email = email;

        if (password && typeof password === 'string' && password.trim() !== "") {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();
        res.json({ message: "User updated successfully" });
    } catch (error) {
        res.status(500).json({ message: handleMongoError(error) });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "voter", isVerified: "approved" })
            .select("-password")
            .sort({ name: 1 });

        const activeElection = await Election.findOne({ isActive: true });
        let ballotMap = new Map();

        if (activeElection) {
            const ballots = await Ballot.find({ election: activeElection._id });
            ballots.forEach(b => {
                if (b.voter) {
                    ballotMap.set(b.voter.toString(), b.votes.length);
                }
            });
        }

        const usersWithStatus = users.map(user => {
            const userObj = user.toObject();
            return {
                ...userObj,
                hasVoted: userObj.votedElections.length > 0,
                voteCount: ballotMap.get(user._id.toString()) || 0
            };
        });

        res.json(usersWithStatus);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to retrieve user list. Please check your connection." });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ message: "The user account you are trying to delete does not exist." });
        }

        res.json({ message: "User account and all associated voting footprints removed successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user account: " + error.message });
    }
};

export const bulkSignup = async (req, res) => {
    try {
        const users = req.body;

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ message: "Payload must be a non-empty array of users" });
        }

        const studentIds = users.map((u) => u.studentId?.trim().toLowerCase());
        const existingUsers = await User.find({ studentId: { $in: studentIds } }).select("studentId");
        const existingIdSet = new Set(existingUsers.map((u) => u.studentId));

        const skipped = [];
        const toInsert = await Promise.all(
            users.map(async (user) => {
                const normalizedId = user.studentId?.trim().toLowerCase();
                if (!normalizedId || !user.password || !user.name) {
                    skipped.push({ studentId: normalizedId || "Unknown", reason: "Missing required fields" });
                    return null;
                }

                if (existingIdSet.has(normalizedId)) {
                    skipped.push({ studentId: normalizedId, reason: "Already exists" });
                    return null;
                }

                const hashedPassword = await bcrypt.hash(user.password, 10);

                return {
                    name: user.name.trim(),
                    studentId: normalizedId,
                    password: hashedPassword,
                    department: user.department,
                    yearLevel: user.yearLevel,
                    email: user.email,
                    role: user.role || "voter"
                };
            })
        );

        const filteredUsers = toInsert.filter(Boolean);
        let result = [];
        if (filteredUsers.length > 0) {
            result = await User.insertMany(filteredUsers, { ordered: false });
        }

        res.status(201).json({
            message: "Bulk processing completed",
            summary: {
                totalReceived: users.length,
                successfullyInserted: result.length,
                skippedCount: skipped.length
            },
            skippedDetails: skipped
        });
    } catch (error) {
        res.status(500).json({ message: "Bulk registration process encountered an error.", details: error.message });
    }
};

export const submitApplication = async (req, res) => {
    try {
        const { name, studentId, password, yearLevel, email, department } = req.body;

        if (!name || !studentId || !password || !yearLevel || !email || !department) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const normalizedId = studentId.trim();
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            $or: [{ studentId: normalizedId }, { email: normalizedEmail }]
        });

        if (existingUser) {
            const isIdDup = existingUser.studentId === normalizedId;
            return res.status(409).json({
                message: isIdDup
                    ? `Institutional ID ${normalizedId} is already registered.`
                    : `The email address ${normalizedEmail} is already in use.`
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const application = await User.create({
            name: name.trim(),
            studentId: normalizedId,
            password: hashedPassword,
            department: department.toUpperCase(),
            yearLevel,
            email: normalizedEmail,
            role: "voter",
            isVerified: "pending"
        });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('newApplication', application);
        }

        res.status(201).json({ message: "Application submitted successfully." });
    } catch (error) {
        res.status(500).json({ message: handleMongoError(error) });
    }
};

export const manageApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "The specified application could not be found." });
        }

        if (status === "approved") {
            user.isVerified = "approved";
            await user.save();

            const activeElection = await Election.findOne({ isActive: true });
            if (activeElection) {
                if (!activeElection.eligibleVoters.some(voterId => voterId.equals(user._id))) {
                    activeElection.eligibleVoters.push(user._id);
                    await activeElection.save();
                }
            }

            const io = req.app.get('socketio');
            if (io) {
                io.emit('applicationManaged', { id, status: 'approved' });
            }

            sendStatusEmail(user.email, user.name, "approved").catch(err => 
                console.error("Approval Email Error:", err)
            );

            return res.json({ message: "User approved successfully." });
        }

        if (status === "rejected") {
            const { email, name } = user;

            await User.findByIdAndDelete(id);

            const io = req.app.get('socketio');
            if (io) {
                io.emit('applicationManaged', { id, status: 'rejected' });
            }

            sendStatusEmail(email, name, "rejected").catch(err => 
                console.error("Rejection Email Error:", err)
            );

            return res.json({ message: "Application rejected and removed." });
        }

        res.status(400).json({ message: "Invalid status" });
    } catch (error) {
        res.status(500).json({ message: "An error occurred while processing the application status." });
    }
};

export const getPendingApplications = async (req, res) => {
    try {
        const applications = await User.find({
            role: "voter",
            isVerified: "pending"
        }).select("-password").sort({ createdAt: -1 });

        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: "Failed to load pending applications." });
    }
};

export const logout = async (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
