import User from "../models/userSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendStatusEmail } from "../utils/emailHelper.js";

export const login = async (req, res) => {
    try {
        const { studentId, password } = req.body;

        if (!studentId || !password) {
            return res.status(400).json({ message: "Student ID and password are required" });
        }

        const normalizedId = studentId.trim();
        const user = await User.findOne({ studentId: normalizedId });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (user.role === "voter" && user.isVerified === "pending") {
            return res.status(403).json({ 
                message: "Your account is still pending admin approval. Please wait or visit the BYTES office." 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.json({
            token,
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
        res.status(500).json({ message: "Server error during login" });
    }
};

export const signup = async (req, res) => {
    try {
        const { name, studentId, password, department, yearLevel, email, role } = req.body;

        if (!name || !studentId || !password || !department || !yearLevel || !email) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        const normalizedId = studentId.trim();
        const existingUser = await User.findOne({ studentId: normalizedId });

        if (existingUser) {
            return res.status(400).json({ message: "User with this Student ID already exists" });
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
        return res.status(500).json({ message: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, studentId, password, department, yearLevel, role, email } = req.body;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (studentId) {
            const normalizedId = studentId.trim()
            if (normalizedId !== user.studentId) {
                const existingUser = await User.findOne({ studentId: normalizedId });
                if (existingUser) return res.status(400).json({ message: "New Student ID already in use" });
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
        res.status(500).json({ message: "Failed to update user" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "voter", isVerified: "approved" }) 
            .select("-password")
            .sort({ name: 1 });

        const usersWithStatus = users.map(user => {
            const userObj = user.toObject();
            return {
                ...userObj,
                hasVoted: userObj.votedElections.length > 0
            };
        });

        res.json(usersWithStatus);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete user" });
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
        res.status(500).json({ message: "Bulk signup failed", details: error.message });
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
                    ? `Student ID ${normalizedId} is already registered.` 
                    : "This email address is already in use."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name: name.trim(),
            studentId: normalizedId,
            password: hashedPassword,
            department: department.toUpperCase(),
            yearLevel,
            email: normalizedEmail,
            role: "voter",
            isVerified: "pending"
        });

        res.status(201).json({ message: "Application submitted successfully." });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Duplicate registration data detected." });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

export const manageApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; 
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "Application not found" });
        }

        if (status === "approved") {
            user.isVerified = "approved";
            await user.save();

            try {
                await sendStatusEmail(user.email, user.name, "approved");
            } catch (emailErr) {
                console.error("Email message:", emailErr);
            }
            
            return res.json({ message: "User approved and notified." });
        } 
        
        if (status === "rejected") {
            const { email, name } = user;

            await User.findByIdAndDelete(id);

            try {
                await sendStatusEmail(email, name, "rejected");
            } catch (emailErr) {
                console.error("Email message:", emailErr);
            }
            
            return res.json({ message: "Application rejected and user notified." });
        }

        res.status(400).json({ message: "Invalid status" });
    } catch (error) {
        res.status(500).json({ message: "Management action failed" });
    }
};

export const getPendingApplications = async (req, res) => {
    try {
        const applications = await User.find({ 
            role: "voter", 
            isVerified: "pending" 
        }).sort({ createdAt: -1 });

        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch pending applications" });
    }
};