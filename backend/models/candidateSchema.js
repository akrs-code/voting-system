import mongoose from "mongoose";
const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    profilePicture: String,

    department: {
        type: String,
        enum: ["DIS", "DCS", "ALL"]
    },

    yearLevel: {
        type: Number,
        enum: [1, 2, 3, 4, null],
        required: false
    },

    partylist: String,

    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Position"
    },
    election: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Election",
        required: true
    }
});

export default mongoose.model("Candidate", candidateSchema);