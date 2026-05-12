import mongoose from "mongoose";
const positionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  department: {
    type: String,
    enum: ["DIS", "DCS", "ALL"],
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
  },
  maxVote: { type: Number, default: 1 },

});

positionSchema.index({ election: 1, department: 1 });

positionSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const mongoose = await import('mongoose');

    const candidates = await mongoose.default.model('Candidate').find({ position: doc._id });
    for (const cand of candidates) {
      await mongoose.default.model('Candidate').findByIdAndDelete(cand._id);
    }
  }
});

export default mongoose.model("Position", positionSchema);