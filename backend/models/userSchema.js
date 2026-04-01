import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
    },

    studentId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
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

    votedElections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Election"
    }]
}, { timestamps: true });

export default mongoose.model("User", userSchema);