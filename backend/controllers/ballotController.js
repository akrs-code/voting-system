import mongoose from "mongoose";
import Ballot from "../models/ballotSchema.js";
import User from "../models/userSchema.js";
import Position from "../models/positionSchema.js";
import Candidate from "../models/candidateSchema.js";

export const castBallot = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { electionId, votes } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId).session(session);
        if (!user) throw new Error("User does not exist");
        if (user.hasVoted) throw new Error("User has already voted");

        user.hasVoted = true;
        await user.save({ session });

        const ballotVotes = votes.map(v => ({
            position: mongoose.Types.ObjectId.isValid(v.positionId) ? new mongoose.Types.ObjectId(v.positionId) : v.positionId,
            candidate: mongoose.Types.ObjectId.isValid(v.candidateId) ? new mongoose.Types.ObjectId(v.candidateId) : v.candidateId
        }));

        const [ballot] = await Ballot.create([{
            voter: user._id,
            election: mongoose.Types.ObjectId.isValid(electionId) ? new mongoose.Types.ObjectId(electionId) : electionId,
            votes: ballotVotes,
            submitted: true
        }], { session });

        await session.commitTransaction();

        const votedDetails = await Promise.all(
            votes.map(async (vote) => {
                const candidate = await Candidate.findById(vote.candidateId).select("name");
                const position = await Position.findById(vote.positionId).select("name");
                return {
                    position: position?.name,
                    candidate: candidate?.name
                };
            })
        );

        req.app.get('io')?.emit('newVoteCast', { message: "A new ballot has been submitted" });

        res.status(201).json({
            message: "Ballot cast successfully",
            voted: votedDetails,
            ballotId: ballot._id
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

export const getElectionResultsByPosition = async (req, res) => {
    try {
        const { electionId } = req.params;
        const positions = await Position.find();

        const resultsByPosition = await Promise.all(
            positions.map(async (pos) => {
                const matchStage = { election: mongoose.Types.ObjectId.isValid(electionId) ? new mongoose.Types.ObjectId(electionId) : electionId };

                if (pos.department !== "ALL") {
                    const deptUsers = await User.find({ department: pos.department }).select("_id");
                    matchStage.voter = { $in: deptUsers.map(u => u._id) };
                }

                const candidateVotes = await Ballot.aggregate([
                    { $match: matchStage },
                    { $unwind: "$votes" },
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    { $toString: "$votes.position" },
                                    pos._id.toString()
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: { $toString: "$votes.candidate" },
                            totalVotes: { $sum: 1 }
                        }
                    },
                    {
                        $lookup: {
                            from: "candidates",
                            let: { candidateId: "$_id" },
                            pipeline: [
                                { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$candidateId"] } } },
                                { $project: { _id: 1, name: 1, department: 1, yearLevel: 1 } }
                            ],
                            as: "candidate"
                        }
                    },
                    { $unwind: "$candidate" },
                    {
                        $project: {
                            _id: 0,
                            candidateId: "$candidate._id",
                            name: "$candidate.name",
                            department: "$candidate.department",
                            yearLevel: "$candidate.yearLevel",
                            totalVotes: 1
                        }
                    }
                ]);

                const totalVotes = candidateVotes.reduce((acc, c) => acc + c.totalVotes, 0);
                const candidatesWithPercent = candidateVotes.map(c => ({
                    ...c,
                    percentage: totalVotes > 0 ? ((c.totalVotes / totalVotes) * 100).toFixed(2) : "0.00"
                }));

                return {
                    positionId: pos._id,
                    positionName: pos.name,
                    department: pos.department,
                    maxVote: pos.maxVote,
                    totalVotes,
                    candidates: candidatesWithPercent
                };
            })
        );

        res.json(resultsByPosition);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};