import Candidate from "../models/candidateSchema.js";
import Position from "../models/positionSchema.js";

export const addCandidate = async (req, res) => {
    try {
        const { name, position, partylist, electionId, yearLevel } = req.body;
        const profilePicture = req.file ? req.file.path : "";

        if (!name || !position || !electionId) {
            return res.status(400).json({ error: "Name, position, and electionId are required." });
        }

        const existingPosition = await Position.findById(position).lean();
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
            return res.status(404).json({ error: "Candidate not found" });
        }

        res.json({ message: "Candidate updated successfully", updatedCandidate });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const removeCandidate = async (req, res) => {
    try {
        // 1. Find and delete the candidate in one go
        const deletedCandidate = await Candidate.findByIdAndDelete(req.params.id);

        // 2. If no candidate was found, exit early
        if (!deletedCandidate) {
            return res.status(404).json({ error: "Candidate not found" });
        }

        // 3. Clean up the image file from the server
        // Fixed: changed 'candidate' to 'deletedCandidate'
        if (deletedCandidate.profilePicture) {
            try {
                if (fs.existsSync(deletedCandidate.profilePicture)) {
                    fs.unlinkSync(deletedCandidate.profilePicture);
                }
            } catch (fileError) {
                // We log the error but don't stop the response 
                // since the DB record is already gone.
                console.error("Failed to delete image file:", fileError);
            }
        }

        res.json({ message: "Candidate and associated data removed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};