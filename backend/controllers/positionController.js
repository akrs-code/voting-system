import Position from "../models/positionSchema.js";
import Candidate from "../models/candidateSchema.js";
import Election from "../models/electionSchema.js";

export const createPosition = async (req, res) => {
    try {
        const { name, maxVote, department, yearLevel } = req.body;
        const position = await Position.create({ name, maxVote, department, yearLevel });
        res.status(201).json(position);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPositionsByDepartment = async (req, res) => {
    try {
        const { department } = req.params;
        const positions = await Position.find({
            $or: [{ department: department }, { department: "ALL" }]
        });
        res.json(positions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getVotingForm = async (req, res) => {
    try {
        const { department, yearLevel } = req.user; // voter info
        const activeElection = await Election.findOne({ isActive: true });
        if (!activeElection) return res.status(404).json({ error: "No active election" });

        const positions = await Position.find({
            $or: [{ department }, { department: "ALL" }]
        });

        const form = await Promise.all(
            positions.map(async (pos) => {
                const candidateFilter = {
                    position: pos._id,
                    department
                };
                if (pos.yearLevel && pos.yearLevel !== yearLevel) {
                    return null;
                }

                const candidates = await Candidate.find(candidateFilter);
                return { ...pos.toObject(), candidates };
            })
        );

        res.json(form);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};