import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Position",
        required: true,
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Candidate",
        required: true,
    }
});

const ballotSchema = new mongoose.Schema({
    voter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    election: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Election",
        required: true,
    },
    votes: [voteSchema], 
    submitted: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Ballot = mongoose.model("Ballot", ballotSchema);

export default Ballot;