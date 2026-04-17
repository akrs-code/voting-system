import Position from "../models/positionSchema.js";
import Candidate from "../models/candidateSchema.js";
import Election from "../models/electionSchema.js";

export const createPosition = async (req, res) => {
    try {
        const { name, maxVote, department, yearLevel, election } = req.body;

        if (!election) {
            return res.status(400).json({ error: "electionId is required" });
        }

        const position = await Position.create({
            name,
            maxVote: Number(maxVote),
            department,
            yearLevel,
            election
        });

        res.status(201).json(position);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPositionsByDepartment = async (req, res) => {
    try {
        const { department } = req.params;
        const { electionId, search, yearLevel } = req.query;

        let query = {};

        if (electionId) {
            query.election = electionId;
        }

        if (department !== 'ALL') {
            query.department = { $in: [department, "ALL"] };
        }

        if (yearLevel) {
            query.yearLevel = yearLevel;
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const positions = await Position.find(query)
            .populate('election', 'title')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json(positions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getVotingForm = async (req, res) => {
    try {
        const { department, yearLevel } = req.user; 
        const activeElection = await Election.findOne({ isActive: true }).lean();
        
        if (!activeElection) return res.status(404).json({ error: "No active election" });

        const positions = await Position.find({
            election: activeElection._id,
            department: { $in: [department, "ALL"] },
            yearLevel: { $in: [yearLevel, null] }
        }).lean();

        const allCandidates = await Candidate.find({ 
            position: { $in: positions.map(p => p._id) } 
        }).lean();

        const form = positions.map(pos => ({
            ...pos,
            candidates: allCandidates.filter(c => c.position.toString() === pos._id.toString())
        }));

        res.status(200).json({ election: activeElection, form });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updatePosition = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedPosition = await Position.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).lean();

        if (!updatedPosition) {
            return res.status(404).json({ error: "Position not found" });
        }

        res.status(200).json(updatedPosition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deletePosition = async (req, res) => {
    try {
        const { id } = req.params;

        const position = await Position.findByIdAndDelete(id);

        if (!position) {
            return res.status(404).json({ error: "Position not found" });
        }

        await Candidate.deleteMany({ position: id });

        res.status(200).json({ message: "Position and associated candidates deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};