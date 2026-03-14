import User from "../models/userSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
    try {
        const { studentId, password } = req.body;

        if (!studentId || !password) {
            return res.status(400).json({ error: "Student ID and password are required" });
        }

        const user = await User.findOne({ studentId });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
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
                name: user.name,
                department: user.department,
                yearLevel: user.yearLevel,
                role: user.role,
                hasVoted: user.hasVoted,
            },
        });
    } catch (error) {
        res.status(500).json({ error: "Server error during login" });
    }
};

export const signup = async (req, res) => {
    try {
        const { name, studentId, password, department, yearLevel, role } = req.body;

        if (!name || !studentId || !password || !department || !yearLevel) {
            return res.status(400).json({ error: "All required fields must be filled" });
        }

        const existingUser = await User.findOne({ studentId });
        if (existingUser) {
            return res.status(400).json({ error: "User with this Student ID already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            studentId,
            password: hashedPassword,
            department,
            yearLevel,
            role: role || "voter",
        });

        res.status(201).json({
            message: "User registered successfully",
            studentId: newUser.studentId
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const bulkSignup = async (req, res) => {
    try {
        const users = req.body;

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ error: "Payload must be a non-empty array of users" });
        }

        const studentIds = users.map((u) => u.studentId);

        const existingUsers = await User.find({
            studentId: { $in: studentIds }
        }).select("studentId");

        const existingIdSet = new Set(existingUsers.map((u) => u.studentId));

        const skipped = [];

        const toInsert = await Promise.all(
            users.map(async (user) => {
                if (!user.studentId || !user.password || !user.name) {
                    skipped.push({
                        studentId: user.studentId || "Unknown",
                        reason: "Missing required fields"
                    });
                    return null;
                }

                if (existingIdSet.has(user.studentId)) {
                    skipped.push({
                        studentId: user.studentId,
                        reason: "Already exists"
                    });
                    return null;
                }

                const hashedPassword = await bcrypt.hash(user.password, 10);

                return {
                    name: user.name,
                    studentId: user.studentId,
                    password: hashedPassword,
                    department: user.department,
                    yearLevel: user.yearLevel,
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
        res.status(500).json({
            error: "Bulk signup failed",
            details: error.message
        });
    }
};