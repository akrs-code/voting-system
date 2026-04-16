import Election from "../models/electionSchema.js";

export const createElection = async (req, res) => {
    try {
        const { title, startDate, endDate } = req.body;
        const election = await Election.create({ title, startDate, endDate });
        
        const io = req.app.get('io');
        if (io) io.emit('election_created', election);
        
        res.status(201).json(election);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getActiveElection = async (req, res) => {
    try {
        const election = await Election.findOne({ isActive: true });
        res.json(election);
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

export const updateElection = async (req, res) => {
    try {
        const election = await Election.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        const io = req.app.get('io');
        if (io) io.emit('election_updated', election);
        
        res.json(election);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const activateElection = async (req, res) => {
    try {
        await Election.updateMany({}, { isActive: false });
        const election = await Election.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
        
        const io = req.app.get('io');
        if (io) io.emit('election_activated', election._id);
        
        res.json(election);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const toggleLockElection = async (req, res) => {
    try {
        const election = await Election.findById(req.params.id);
        if (!election) return res.status(404).json({ message: "Election not found" });

        election.isLocked = !election.isLocked;
        await election.save();

        const io = req.app.get('io');
        if (io) io.emit('election_updated', election);

        res.json({
            message: `Election ${election.isLocked ? "locked" : "unlocked"}`,
            data: election
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const deleteElection = async (req, res) => {
    try {
        await Election.findByIdAndDelete(req.params.id);
        
        const io = req.app.get('io');
        if (io) io.emit('election_deleted', req.params.id);
        
        res.json({ message: "Deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};