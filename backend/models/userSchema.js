import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    studentId: {
        type: String,
        required: true,
        unique: true
    },

    department: {
        type: String,
        enum: ["DIS", "DCS"],
        required: true
    },

    yearLevel: {
        type: Number,
        enum: [1, 2, 3, 4],
        required: true
    },

    role: {
        type: String,
        enum: ["admin", "voter"],
        default: "voter"
    },

    hasVoted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.model("User", userSchema);