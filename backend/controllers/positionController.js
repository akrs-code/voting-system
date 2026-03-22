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
        const { electionId, search, yearLevel } = req.query; 
        
        // 1. Base query: Match specific dept OR "ALL"
        let query = {
            $or: [{ department: department }, { department: "ALL" }]
        };
        
        // 2. Filter by Election
        if (electionId) query.election = electionId;

        // 3. Filter by Year Level (if specifically requested)
        if (yearLevel) query.yearLevel = yearLevel;

        // 4. Search by Name (Case-insensitive)
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const positions = await Position.find(query).populate('election', 'title');
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

export const updatePosition = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, maxVote, department, yearLevel, electionId } = req.body;

        const updatedPosition = await Position.findByIdAndUpdate(
            id,
            { 
                name, 
                maxVote, 
                department, 
                yearLevel, 
                election: electionId 
            },
            { new: true, runValidators: true }
        );

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

        res.status(200).json({ message: "Position and associated candidates deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};