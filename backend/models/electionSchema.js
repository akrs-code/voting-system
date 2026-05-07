import mongoose from "mongoose";

const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: true
  },
  eligibleVoters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
}, { timestamps: true });

electionSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const mongoose = await import('mongoose');

    await mongoose.default.model('Ballot').deleteMany({ election: doc._id });

    const candidates = await mongoose.default.model('Candidate').find({ election: doc._id });
    for (const cand of candidates) {
      await mongoose.default.model('Candidate').findByIdAndDelete(cand._id);
    }

    await mongoose.default.model('Position').deleteMany({ election: doc._id });

    await mongoose.default.model('User').updateMany(
      { votedElections: doc._id },
      { $pull: { votedElections: doc._id } }
    );
  }
});

export default mongoose.model("Election", electionSchema);