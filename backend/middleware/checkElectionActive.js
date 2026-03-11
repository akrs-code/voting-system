import Election from "../models/electionSchema.js";

export const checkElectionActive = async (req, res, next) => {
  try {
    const election = await Election.findOne({ isActive: true });

    if (!election) {
      return res.status(400).json({
        error: "No active election"
      });
    }

    const now = new Date();

    if (now < election.startDate || now > election.endDate) {
      return res.status(400).json({
        error: "Election is not currently active"
      });
    }

    req.election = election;

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};