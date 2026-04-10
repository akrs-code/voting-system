import mongoose from "mongoose";
import Ballot from "../models/ballotSchema.js";
import User from "../models/userSchema.js";
import Position from "../models/positionSchema.js";
import Candidate from "../models/candidateSchema.js";
import Election from "../models/electionSchema.js";
import { sendVoteEmail } from "../utils/emailHelper.js";

export const getActiveElection = async (req, res) => {
    try {
        const election = await Election.findOne({ isActive: true });
        if (!election) return res.status(200).json(null);
        res.json(election);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const castBallot = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { electionId, votes } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId).session(session);
        if (!user) throw new Error("User does not exist.");

        const election = await Election.findById(electionId).session(session);
        if (!election || !election.isActive) throw new Error("This election is not active.");

        if (user.votedElections.includes(electionId)) {
            throw new Error("You have already cast your vote in this election.");
        }

        const positionIds = votes.map(v => v.positionId);
        const candidateIds = votes.map(v => v.candidateId);

        const [dbPositions, dbCandidates] = await Promise.all([
            Position.find({ _id: { $in: positionIds } }).session(session),
            Candidate.find({ _id: { $in: candidateIds } }).session(session)
        ]);

        for (const vote of votes) {
            const position = dbPositions.find(p => p._id.toString() === vote.positionId);
            const candidate = dbCandidates.find(c => c._id.toString() === vote.candidateId);

            if (!position || !candidate) throw new Error("Invalid selection: Item not found.");

            const isDeptValid = position.department === "ALL" || position.department === user.department;
            const isYearValid = !position.yearLevel || position.yearLevel === user.yearLevel;

            if (!isDeptValid || isYearValid === false) {
                throw new Error(`Restricted: You cannot vote for ${position.name}`);
            }
        }

        const voteCountsByPosition = votes.reduce((acc, vote) => {
            acc[vote.positionId] = (acc[vote.positionId] || 0) + 1;
            return acc;
        }, {});

        for (const [posId, count] of Object.entries(voteCountsByPosition)) {
            const pos = dbPositions.find(p => p._id.toString() === posId);
            if (count > pos.maxVote) throw new Error(`Too many votes for ${pos.name}.`);
        }

        user.votedElections.push(electionId);
        await user.save({ session });

        const ballot = await Ballot.create([{
            election: electionId,
            votes: votes.map(v => ({ position: v.positionId, candidate: v.candidateId })),
            submitted: true
        }], { session });

        await session.commitTransaction();

        const votedDetails = votes.map(v => {
            const p = dbPositions.find(pos => pos._id.toString() === v.positionId);
            const c = dbCandidates.find(cand => cand._id.toString() === v.candidateId);
            return { positionName: p.name, candidateName: c.name };
        });

        sendVoteEmail(user.email, user.name, election.title, votedDetails)
            .catch(err => console.error("Email Error:", err));

        req.app.get('io')?.emit('newVoteCast', { electionId, votes });

        res.status(201).json({ message: "Ballot cast successfully", ballotId: ballot[0]._id });

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
        const eId = new mongoose.Types.ObjectId(electionId);
        const positions = await Position.find({ election: eId });

        const resultsByPosition = await Promise.all(
            positions.map(async (pos) => {
                const candidates = await Candidate.find({
                    position: pos._id,
                    election: eId
                }).select("name department yearLevel");

                const voteCounts = await Ballot.aggregate([
                    { $match: { election: eId } },
                    { $unwind: "$votes" },
                    { $match: { "votes.position": pos._id } },
                    {
                        $group: {
                            _id: "$votes.candidate",
                            totalVotes: { $sum: 1 }
                        }
                    }
                ]);

                const candidatesWithVotes = candidates.map(cand => {
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
            })
        );
        res.json(resultsByPosition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const getElectionStats = async (req, res) => {
    try {
        const { electionId } = req.params;
        const { dept } = req.query;

        const userFilter = { 
            role: 'voter'
        };
        
        const candidateFilter = { election: electionId };

        if (dept && dept !== 'ALL') {
            userFilter.department = dept;
            candidateFilter.department = dept;
        }

        const totalVoters = await User.countDocuments(userFilter);
        
        const totalCandidates = await Candidate.countDocuments(candidateFilter);
  
        const votedCount = await User.countDocuments({
            ...userFilter,
            votedElections: electionId 
        });

        const turnoutPercentage = totalVoters > 0 
            ? ((votedCount / totalVoters) * 100).toFixed(2) 
            : "0.00";

        res.json({
            totalVoters,
            votedCount,
            totalCandidates,
            turnoutPercentage
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getBallot = async (req, res) => {
    try {
        const { electionId } = req.params;
        const eId = new mongoose.Types.ObjectId(electionId);
        
       
        const userDept = req.user.department; 
        const userYear = req.user.yearLevel; 

        const positions = await Position.find({ 
            election: eId,
            department: { $in: [userDept, "ALL"] },
            $or: [
                { yearLevel: userYear },
                { yearLevel: null }
            ]
        });

        const ballotData = await Promise.all(
            positions.map(async (pos) => {
                const candidates = await Candidate.find({
                    position: pos._id,
                    election: eId,
                    department: { $in: [userDept, "ALL"] },
                    $or: [
                        { yearLevel: userYear },
                        { yearLevel: null }
                    ]
                }).select("name profilePicture partylist department yearLevel");

                return {
                    positionId: pos._id,
                    positionName: pos.name,
                    maxVote: pos.maxVote || 1,
                    candidates: candidates.map(cand => ({
                        candidateId: cand._id,
                        name: cand.name,
                        profileImage: cand.profilePicture,
                        department: cand.department,
                        yearLevel: cand.yearLevel,
                        partylist: cand.partylist
                    }))
                };
            })
        );

        const filteredBallot = ballotData.filter(p => p.candidates.length > 0);

        res.json(filteredBallot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};