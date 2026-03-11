import mongoose from "mongoose";
const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  startDate: Date,

  endDate: Date,

  isActive: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model("Election", electionSchema);