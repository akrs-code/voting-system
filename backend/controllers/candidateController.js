import Candidate from "../models/candidateSchema.js";
import Position from "../models/positionSchema.js";

export const addCandidate = async (req, res) => {
    try {
        const { name, position, partylist, electionId, yearLevel } = req.body;
        const profilePicture = req.file ? req.file.path : "";

        if (!name || !position || !electionId) {
            return res.status(400).json({ message: "Missing required information. Please provide the candidate's name, position, and election cycle." });
        }

        const existingPosition = await Position.findById(position).lean();
        if (!existingPosition) {
            return res.status(404).json({ message: "The selected electoral position does not exist in our records." });
        }

        if (existingPosition.election.toString() !== electionId) {
            return res.status(400).json({
                message: "Configuration Error: The chosen position is not compatible with the selected election cycle."
            });
        }

        const newCandidate = await Candidate.create({
            name,
            department: existingPosition.department,
            position,
            partylist,
            election: electionId,
            yearLevel: yearLevel || null,
            profilePicture
        });

        const populatedCandidate = await Candidate.findById(newCandidate._id)
            .populate("position", "name")
            .populate("election", "title")
            .lean();

        res.status(201).json({
            message: "Candidate added successfully",
            candidate: populatedCandidate
        });

    } catch (error) {
        res.status(500).json({ message: "An error occurred while adding the candidate. " + error.message });
    }
};

export const getCandidatesByDepartment = async (req, res) => {
    try {
        const { department } = req.params;
        const { electionId } = req.query;

        const query = {};

        if (electionId) {
            query.election = electionId;
        }

        if (department && department !== "ALL") {
            query.department = department;
        }

        const candidates = await Candidate.find(query)
            .populate("position", "name maxVote")
            .populate("election", "title")
            .sort({ name: 1 })
            .lean();

        res.status(200).json(candidates);
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve the candidate list. " + error.message });
    }
};

export const updateCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const { electionId, position, ...updateData } = req.body;

        const finalUpdate = { ...updateData };

        if (electionId) finalUpdate.election = electionId;
        if (position) {
            finalUpdate.position = position;
            const pos = await Position.findById(position).lean();
            if (pos) finalUpdate.department = pos.department;
        }
        if (req.file) finalUpdate.profilePicture = req.file.path;

        const updatedCandidate = await Candidate.findByIdAndUpdate(
            id,
            { $set: finalUpdate },
            { new: true, runValidators: true }
        )
            .populate("position", "name")
            .populate("election", "title")
            .lean();

        if (!updatedCandidate) {
            return res.status(404).json({ message: "We couldn't find the candidate profile you're trying to update." });
        }

        res.json({ message: "Candidate updated successfully", updatedCandidate });
    } catch (error) {
        res.status(500).json({ message: "Failed to update the candidate profile. " + error.message });
    }
};

export const removeCandidate = async (req, res) => {
    try {
        const deletedCandidate = await Candidate.findByIdAndDelete(req.params.id);

        if (!deletedCandidate) {
            return res.status(404).json({ message: "The candidate profile you are trying to remove does not exist." });
        }
        if (deletedCandidate.profilePicture) {
            try {
                if (fs.existsSync(deletedCandidate.profilePicture)) {
                    fs.unlinkSync(deletedCandidate.profilePicture);
                }
            } catch (fileError) {
                console.error("Failed to delete image file:", fileError);
            }
        }

        res.json({ message: "Candidate and associated data removed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error removing candidate from registry: " + error.message });
    }
};