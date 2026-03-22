import express from "express";
import { 
    addCandidate, 
    getCandidatesByDepartment, 
    updateCandidate,
    removeCandidate 
} from "../controllers/candidateController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const router = express.Router();

router.post("/", verifyToken, authorizeRole("admin"), addCandidate);
router.get("/:department", verifyToken, getCandidatesByDepartment);
router.put("/:id", verifyToken, authorizeRole("admin"), updateCandidate); 
router.delete("/:id", verifyToken, authorizeRole("admin"), removeCandidate);

export default router;