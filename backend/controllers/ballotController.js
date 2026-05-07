import mongoose from "mongoose";
import Ballot from "../models/ballotSchema.js";
import User from "../models/userSchema.js";
import Position from "../models/positionSchema.js";
import Candidate from "../models/candidateSchema.js";
import Election from "../models/electionSchema.js";
import { sendVoteEmail } from "../utils/emailHelper.js";

export const getActiveElection = async (req, res) => {
    try {
        const election = await Election.findOne({ isActive: true }).lean();
        if (!election) return res.status(200).json(null);
        res.json(election);
    } catch (error) {
        res.status(500).json({ message: "Unable to retrieve the active election cycle. " + error.message });
    }
};

export const castBallot = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { electionId, votes } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId).session(session);
        const election = await Election.findById(electionId).session(session);

        if (!user || !election?.isActive) throw new Error("The election is either closed or you are not authorized to vote.");

        if (!election.eligibleVoters.some(voterId => voterId.equals(userId))) {
            throw new Error("You are not registered as an eligible voter for this election.");
        }

        if (user.votedElections.some(eId => eId.equals(electionId))) throw new Error("You have already cast your vote in this election cycle.");

        const ballotEntries = [];
        const selectedCandidateIds = [];

        votes.forEach(v => {
            v.candidateIds.forEach(cId => {
                ballotEntries.push({ position: v.positionId, candidate: cId });
                selectedCandidateIds.push(cId);
            });
        });

        await Ballot.create([{
            voter: userId,
            election: electionId,
            votes: ballotEntries,
            submitted: true
        }], { session });

        user.votedElections.push(electionId);
        await user.save({ session });

        await session.commitTransaction();

        res.status(201).json({ message: "Ballot cast successfully" });

        const voterChoices = await Candidate.find({ _id: { $in: selectedCandidateIds } })
            .populate('position', 'name')
            .lean();

        const emailVoteSummary = voterChoices.map(c => ({
            positionName: c.position?.name || "Position",
            candidateName: c.name
        }));

        req.app.get('socketio')?.emit('newVoteCast', { electionId });

        sendVoteEmail(user.email, user.name, election.title, emailVoteSummary).catch(console.error);

    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        res.status(400).json({ message: "Ballot submission failed: " + error.message });
    } finally {
        session.endSession();
    }
};

export const getElectionResultsByPosition = async (req, res) => {
    try {
        const { electionId } = req.params;
        const eId = new mongoose.Types.ObjectId(electionId);

        const [positions, candidates, voteCounts] = await Promise.all([
            Position.find({ election: eId }).lean(),
            Candidate.find({ election: eId }).select("name department yearLevel position").lean(),
            Ballot.aggregate([
                { $match: { election: eId } },
                { $unwind: "$votes" },
                {
                    $group: {
                        _id: "$votes.candidate",
                        totalVotes: { $sum: 1 }
                    }
                }
            ])
        ]);

        const resultsByPosition = positions.map(pos => {
            const posCandidates = candidates.filter(c => c.position.toString() === pos._id.toString());

            const candidatesWithVotes = posCandidates.map(cand => {
                const voteData = voteCounts.find(v => v._id.toString() === cand._id.toString());
                return {
                    candidateId: cand._id,
                    name: cand.name,
                    department: cand.department,
                    yearLevel: cand.yearLevel,
                    totalVotes: voteData ? voteData.totalVotes : 0
                };
            });

            const totalVotesForPosition = candidatesWithVotes.reduce((acc, c) => acc + c.totalVotes, 0);

            return {
                positionId: pos._id,
                positionName: pos.name,
                department: pos.department,
                totalVotes: totalVotesForPosition,
                candidates: candidatesWithVotes.map(c => ({
                    ...c,
                    percentage: totalVotesForPosition > 0
                        ? ((c.totalVotes / totalVotesForPosition) * 100).toFixed(2)
                        : "0.00"
                })).sort((a, b) => b.totalVotes - a.totalVotes)
            };
        });

        res.json(resultsByPosition);
    } catch (error) {
        res.status(500).json({ message: "Failed to compile the election results per position. " + error.message });
    }
};

export const getElectionStats = async (req, res) => {
    try {
        const { electionId } = req.params;
        const { dept } = req.query;

        const election = await Election.findById(electionId).select("eligibleVoters");
        if (!election) return res.status(404).json({ message: "Election not found" });

        const voterIds = election.eligibleVoters || [];

        const userFilter = {
            _id: { $in: voterIds },
            role: 'voter',
            isVerified: 'approved'
        };
        const candidateFilter = { election: electionId };

        if (dept && dept !== 'ALL') {
            userFilter.department = dept;
            candidateFilter.department = dept;
        }

        const [totalVoters, totalCandidates, votedCount] = await Promise.all([
            User.countDocuments(userFilter),
            Candidate.countDocuments(candidateFilter),
            User.countDocuments({ ...userFilter, votedElections: electionId })
        ]);

        const turnoutPercentage = totalVoters > 0
            ? ((votedCount / totalVoters) * 100).toFixed(2)
            : "0.00";

        res.json({ totalVoters, votedCount, totalCandidates, turnoutPercentage });
    } catch (error) {
        res.status(500).json({ message: "Error calculating turnout and candidate statistics. " + error.message });
    }
};

export const getBallot = async (req, res) => {
    try {
        const { electionId } = req.params;
        const eId = new mongoose.Types.ObjectId(electionId);
        const userId = req.user._id;
        const { department: userDept, yearLevel: userYear } = req.user;

        const election = await Election.findById(eId).select("eligibleVoters isActive");
        if (!election || !election.isActive) {
            return res.status(404).json({ message: "No active election found with this ID." });
        }

        if (!election.eligibleVoters.some(voterId => voterId.equals(userId))) {
            return res.status(403).json({ message: "You are not authorized to vote in this election." });
        }

        const [positions, candidates] = await Promise.all([
            Position.find({
                election: eId,
                department: { $in: [userDept, "ALL"] },
                $or: [{ yearLevel: userYear }, { yearLevel: null }]
            }).lean(),
            Candidate.find({ election: eId }).select("name profilePicture partylist department yearLevel position").lean()
        ]);

        const ballotData = positions.map(pos => {
            const posCandidates = candidates.filter(cand =>
                cand.position.toString() === pos._id.toString() &&
                (cand.department === "ALL" || cand.department === userDept)
            );

            return {
                positionId: pos._id,
                positionName: pos.name,
                maxVote: pos.maxVote || 1,
                candidates: posCandidates.map(cand => ({
                    candidateId: cand._id,
                    name: cand.name,
                    profileImage: cand.profilePicture,
                    department: cand.department,
                    yearLevel: cand.yearLevel,
                    partylist: cand.partylist
                }))
            };
        }).filter(p => p.candidates.length > 0);

        res.json(ballotData);
    } catch (error) {
        res.status(500).json({ message: "Could not generate your personalized voting ballot. " + error.message });
    }
};