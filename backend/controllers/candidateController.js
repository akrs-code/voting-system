import Candidate from "../models/candidateSchema.js";
export const addCandidate = async (req, res) => {
    try {
        const { name, department, position, party, electionId } = req.body;

        if (!name || !department || !position || !electionId) {
            return res.status(400).json({ error: "Required fields missing" });
        }

        const newCandidate = await Candidate.create({
            name,
            department,
            position,
            party,
            electionId,
            yearLevel: req.body.yearLevel || null
        });

        res.status(201).json({ message: "Candidate added successfully", newCandidate });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCandidatesByDepartment = async (req, res) => {
    try {
        const { department } = req.params;
        const { electionId } = req.query;

        const candidates = await Candidate.find({ department, electionId });
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const removeCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        await Candidate.findByIdAndDelete(id);
        res.json({ message: "Candidate removed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};