import mongoose from "mongoose";

const ballotSchema = new mongoose.Schema({
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Election",
    required: true
  },

  votes: [
    {
      position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Position",
        required: true
      },

      candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Candidate",
        required: true
      }
    }
  ],

  submitted: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("Ballot", ballotSchema);