import mongoose from "mongoose";
const positionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  maxVote: {
    type: Number,
    default: 1
  },

  department: {
    type: String,
    enum: ["DIS", "DCS", "ALL"]
  },
  
  yearLevel: {
    type: Number,
    enum: [1, 2, 3, 4, null],
    default: null
  },
  election: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  }
});

export default mongoose.model("Position", positionSchema);