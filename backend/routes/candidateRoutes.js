import express from "express";
import { 
    addCandidate, 
    getCandidatesByDepartment, 
    updateCandidate,
    removeCandidate 
} from "../controllers/candidateController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { upload } from "../config/cloudinaryConfig.js";

const router = express.Router();

router.post("/", verifyToken, authorizeRole("admin"), upload.single('image'), addCandidate);
router.get("/:department", verifyToken, getCandidatesByDepartment);
router.patch("/:id", verifyToken, authorizeRole("admin"), upload.single('image'), updateCandidate); 
router.delete("/:id", verifyToken, authorizeRole("admin"), removeCandidate);

export default router;