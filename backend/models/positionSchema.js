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
  }
});

export default mongoose.model("Position", positionSchema);