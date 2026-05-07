import mongoose from "mongoose";
const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    profilePicture: String,

    department: {
        type: String,
        enum: ["DIS", "DCS", "ALL"]
    },

    yearLevel: {
        type: Number,
        enum: [1, 2, 3, 4, null],
        required: false
    },

    partylist: String,

    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Position"
    },
    election: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Election",
        required: true
    }
});

candidateSchema.index({ election: 1, position: 1 });

candidateSchema.index({ election: 1, department: 1 });

candidateSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {

        await mongoose.model('Ballot').updateMany(
            { "votes.candidate": doc._id },
            { $pull: { votes: { candidate: doc._id } } }
        );

        if (doc.profilePicture) {
            const fs = await import('fs');
            try {
                if (fs.default.existsSync(doc.profilePicture)) {
                    fs.default.unlinkSync(doc.profilePicture);
                }
            } catch (fileError) {
                console.error("Failed to delete image file:", fileError);
            }
        }
    }
});

export default mongoose.model("Candidate", candidateSchema);