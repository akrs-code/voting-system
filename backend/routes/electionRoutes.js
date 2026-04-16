import express from 'express';
import { 
    createElection, 
    updateElection, 
    deleteElection, 
    getAllElections, 
    getActiveElection, 
    activateElection, 
    toggleLockElection
} from "../controllers/electionController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const router = express.Router();

router.get("/", verifyToken, authorizeRole("admin"), getAllElections);
router.get("/active", verifyToken, getActiveElection);
router.post("/", verifyToken, authorizeRole("admin"), createElection);
router.patch("/:id", verifyToken, authorizeRole("admin"), updateElection);
router.delete("/:id", verifyToken, authorizeRole("admin"), deleteElection);

router.patch("/:id/status", verifyToken, authorizeRole("admin"), activateElection);
router.patch("/:id/lock", verifyToken, authorizeRole("admin"), toggleLockElection);

export default router;