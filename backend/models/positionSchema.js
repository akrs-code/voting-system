import mongoose from "mongoose";
const positionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  department: {
    type: String,
    enum: ["DIS", "DCS"],
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