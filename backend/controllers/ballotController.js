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

        if (user.votedElections.includes(electionId)) {
            throw new Error("You have already cast your vote in this election.");
        }

        for (const vote of votes) {
            const [position, candidate] = await Promise.all([
                Position.findById(vote.positionId).session(session),
                Candidate.findById(vote.candidateId).session(session)
            ]);

            if (!position || !candidate) throw new Error("Invalid selection: Position or Candidate not found.");

            const isPosDeptValid = position.department === "ALL" || position.department === user.department;
            const isPosYearValid = position.yearLevel === null || position.yearLevel === user.yearLevel;

            if (!isPosDeptValid || !isPosYearValid) {
                throw new Error(`Restricted: You cannot vote for the position: ${position.name}`);
            }

            const isCandDeptValid = candidate.department === "ALL" || candidate.department === user.department;
            const isCandYearValid = candidate.yearLevel === null || candidate.yearLevel === user.yearLevel;

            if (!isCandDeptValid || !isCandYearValid) {
                throw new Error(`Restricted: Candidate ${candidate.name} is not in your department/year level.`);
            }
        }

        const voteCountsByPosition = votes.reduce((acc, vote) => {
            acc[vote.positionId] = (acc[vote.positionId] || 0) + 1;
            return acc;
        }, {});

        for (const [positionId, count] of Object.entries(voteCountsByPosition)) {
            const position = await Position.findById(positionId).session(session);
            if (count > position.maxVote) {
                throw new Error(`Exceeded max votes for ${position.name}. Allowed: ${position.maxVote}`);
            }
        }

        user.votedElections.push(electionId);
        await user.save({ session });

        const ballotVotes = votes.map(v => ({
            position: new mongoose.Types.ObjectId(v.positionId),
            candidate: new mongoose.Types.ObjectId(v.candidateId)
        }));

        const [ballot] = await Ballot.create([{
            voter: userId,
            election: new mongoose.Types.ObjectId(electionId),
            votes: ballotVotes,
            submitted: true
        }], { session });

        await session.commitTransaction();

        const election = await Election.findById(electionId);
        
        const votedDetails = await Promise.all(
            votes.map(async (vote) => {
                const [cand, pos] = await Promise.all([
                    Candidate.findById(vote.candidateId).select("name"),
                    Position.findById(vote.positionId).select("name")
                ]);
                return {
                    positionName: pos?.name || "Unknown",
                    candidateName: cand?.name || "Unknown"
                };
            })
        );

        sendVoteEmail(
            user.email,
            user.name || "Voter",
            election?.title || "MSU CICS Election",
            votedDetails
        ).catch(err => console.error("Email Receipt Error:", err));

        req.app.get('io')?.emit('newVoteCast', {
            electionId,
            votes: votes.map(v => ({ positionId: v.positionId, candidateId: v.candidateId }))
        });

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

// backend/controllers/ballotController.js

export const getElectionStats = async (req, res) => {
    try {
        const { electionId } = req.params;
        const { dept } = req.query;

        // 1. Define the base filter for all potential voters
        const userFilter = { 
            role: 'voter'
        };
        
        const candidateFilter = { election: electionId };

        // 2. Apply department filter if not 'ALL'
        if (dept && dept !== 'ALL') {
            userFilter.department = dept;
            candidateFilter.department = dept;
        }

        // 3. Get counts
        // totalVoters = Everyone eligible to vote (Role: voter + Dept filter)
        const totalVoters = await User.countDocuments(userFilter);
        
        const totalCandidates = await Candidate.countDocuments(candidateFilter);
        
        // 4. votedCount = Users from the same group who have the ID in their votedElections
        const votedCount = await User.countDocuments({
            ...userFilter,
            votedElections: electionId 
        });

        // 5. Calculate percentage safely
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