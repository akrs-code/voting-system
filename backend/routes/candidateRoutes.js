import express from "express";
import { 
    addCandidate, 
    getCandidatesByDepartment, 
    removeCandidate 
} from "../controllers/candidateController.js";
import { verifyToken } from '../middleware/verifyToken.js';
import { authorizeRole } from '../middleware/authorizeRole.js';

const router = express.Router();

router.post("/", verifyToken, authorizeRole("admin"), addCandidate);
router.get("/:department", verifyToken, getCandidatesByDepartment);
router.delete("/:id", verifyToken, authorizeRole("admin"), removeCandidate);

export default router;