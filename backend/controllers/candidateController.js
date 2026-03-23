import Candidate from "../models/candidateSchema.js";
import Position from "../models/positionSchema.js";

export const addCandidate = async (req, res) => {
    try {
        const { name, department, position, partylist, electionId, yearLevel } = req.body;
        const profilePicture = req.file ? req.file.path : "";

        if (!name || !position || !electionId) {
            return res.status(400).json({ error: "Name, position, and electionId are required." });
        }

        const existingPosition = await Position.findById(position);
        if (!existingPosition) {
            return res.status(404).json({ error: "The selected position does not exist." });
        }

        if (existingPosition.election.toString() !== electionId) {
            return res.status(400).json({ 
                error: "Position/Election mismatch. This position does not belong to the selected election." 
            });
        }

        const newCandidate = await Candidate.create({
            name,
            department,
            position,
            partylist, 
            election: electionId,
            yearLevel: yearLevel || null,
            profilePicture
        });

        const populatedCandidate = await Candidate.findById(newCandidate._id)
            .populate("position", "name")
            .populate("election", "title");

        res.status(201).json({ 
            message: "Candidate added successfully", 
            candidate: populatedCandidate 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCandidatesByDepartment = async (req, res) => {
    try {
        const { department } = req.params;
        const { electionId } = req.query;

        const query = {};
        
        if (electionId && electionId !== "") {
            query.election = electionId;
        }

        if (department && department !== "ALL") {
            query.$or = [{ department: department }, { department: "ALL" }];
        }

        const candidates = await Candidate.find(query)
            .populate("position", "name maxVote")
            .populate("election", "title")
            .sort({ name: 1 });
            
        res.status(200).json(candidates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const { electionId, position, ...updateData } = req.body;

        const finalUpdate = { ...updateData };
        
        if (electionId) finalUpdate.election = electionId;
        if (position) finalUpdate.position = position;
        if (req.file) finalUpdate.profilePicture = req.file.path;

        const updatedCandidate = await Candidate.findByIdAndUpdate(
            id, 
            finalUpdate, 
            { new: true, runValidators: true }
        )
        .populate("position", "name")
        .populate("election", "title");

        if (!updatedCandidate) {
            return res.status(404).json({ error: "Candidate not found" });
        }

        res.json({ message: "Candidate updated successfully", updatedCandidate });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const removeCandidate = async (req, res) => {
    try {
        const deletedCandidate = await Candidate.findByIdAndDelete(req.params.id);
        
        if (!deletedCandidate) {
            return res.status(404).json({ error: "Candidate not found" });
        }

        res.json({ message: "Candidate removed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};