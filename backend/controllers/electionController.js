import Election from "../models/electionSchema.js";

export const createElection = async (req, res) => {
    try {
        const { title, startDate, endDate } = req.body;
        if (!title || !startDate || !endDate)
            return res.status(400).json({ error: "All fields are required" });

        const election = await Election.create({ title, startDate, endDate });
        res.status(201).json({ message: "Election created", election });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateElection = async (req, res) => {
    try {
        const { id } = req.params;
        const election = await Election.findByIdAndUpdate(id, req.body, { new: true });
        if (!election) return res.status(404).json({ error: "Election not found" });

        res.json({ message: "Election updated", election });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteElection = async (req, res) => {
    try {
        const { id } = req.params;
        const election = await Election.findByIdAndDelete(id);
        if (!election) return res.status(404).json({ error: "Election not found" });

        res.json({ message: "Election deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllElections = async (req, res) => {
    try {
        const elections = await Election.find().sort({ createdAt: -1 });
        res.json(elections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getActiveElection = async (req, res) => {
    try {
        const election = await Election.findOne({ isActive: true });
        if (!election) return res.status(404).json({ error: "No active election found" });
        res.json(election);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const activateElection = async (req, res) => {
    try {
        const { id } = req.params;
        await Election.updateMany({ isActive: true }, { isActive: false });
        const election = await Election.findByIdAndUpdate(id, { isActive: true }, { new: true });
        if (!election) return res.status(404).json({ error: "Election not found" });

        res.json({ message: "Election activated", election });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};