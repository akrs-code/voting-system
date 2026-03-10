import User from "../models/userSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
    try {
        const { studentId, password } = req.body;

        if (!studentId || !password)
            return res.status(400).json({ error: "All fields are required" });

        const student = await User.findOne({ studentId });

        if (!student)
            return res.status(401).json({ error: "Account doesn't exist" });

        const isMatch = await bcrypt.compare(password, student.password);

        if (!isMatch)
            return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { userId: student._id, role: student.role },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.json({
            token,
            student: {
                _id: student._id,
                name: student.name,
                department: student.department,
                yearLevel: student.yearLevel,
                role: student.role,
                hasVoted: student.hasVoted,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const signup = async (req, res) => {
    try {
        const { name, studentId, password, department, yearLevel, role } = req.body;

        if (!name || !studentId || !password || !department || !yearLevel || !role)
            return res.status(400).json({ error: "All fields are required" });

        let student = await User.findOne({ studentId });

        if (student) {
            const token = jwt.sign(
                { userId: student._id, role: student.role },
                process.env.JWT_SECRET,
                { expiresIn: "2h" }
            );

            return res.status(200).json({
                message: "User reconnected",
                token,
                student: {
                    _id: student._id,
                    name: student.name,
                    department: student.department,
                    yearLevel: student.yearLevel,
                    role: student.role,
                    hasVoted: student.hasVoted,
                },
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        student = await User.create({
            name,
            studentId,
            password: hashedPassword,
            department,
            yearLevel,
            role,
        });

        res.status(201).json({
            message: "User registered successfully",
            student,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const bulkSignup = async (req, res) => {
    try {
        const users = req.body;

        const hashedUsers = await Promise.all(
            users.map(async (user) => ({
                ...user,
                password: await bcrypt.hash(user.password, 10),
            }))
        );

        const result = await User.insertMany(hashedUsers);

        res.status(201).json({
            message: "Users added successfully",
            count: result.length
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};