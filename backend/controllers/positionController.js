import Position from "../models/positionSchema.js";
import Candidate from "../models/candidateSchema.js";
import Election from "../models/electionSchema.js";

export const createPosition = async (req, res) => {
    try {
        const { name, maxVote, department, yearLevel, electionId } = req.body;

        if (!electionId) {
            return res.status(400).json({ error: "electionId is required" });
        }

        const position = await Position.create({ 
            name, 
            maxVote, 
            department, 
            yearLevel, 
            election: electionId 
        });

        res.status(201).json(position);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPositionsByDepartment = async (req, res) => {
    try {
        const { department } = req.params;
        const { electionId } = req.query; 
        
        const query = {
            $or: [{ department: department }, { department: "ALL" }]
        };
        
        if (electionId) query.election = electionId;

        const positions = await Position.find(query);
        res.status(200).json(positions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const getVotingForm = async (req, res) => {
    try {
        const { department, yearLevel } = req.user; 

        const activeElection = await Election.findOne({ isActive: true });
        if (!activeElection) {
            return res.status(404).json({ error: "No active election found" });
        }

        const positions = await Position.find({
            election: activeElection._id,
            $or: [
                { department: department }, 
                { department: "ALL" }
            ],
            $or: [
                { yearLevel: yearLevel },
                { yearLevel: null } 
            ]
        });

    
        const formWithCandidates = await Promise.all(
            positions.map(async (pos) => {
                const candidates = await Candidate.find({ position: pos._id })
                    .select('-__v');
                
                return {
                    ...pos.toObject(),
                    candidates
                };
            })
        );

        res.status(200).json({
            electionName: activeElection.title,
            electionId: activeElection._id,
            form: formWithCandidates
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};