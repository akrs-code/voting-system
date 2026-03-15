import mongoose from "mongoose";
const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    profilePicture: String,

    department: {
        type: String,
        enum: ["DIS", "DCS"]
    },

    yearLevel: {
        type: Number,
        enum: [1, 2, 3, 4],
        required: false
    },

    partylist: String,

    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Position"
    }
});

export default mongoose.model("Candidate", candidateSchema);