import express from 'express';
import { 
    createElection, 
    updateElection, 
    deleteElection, 
    getAllElections, 
    getActiveElection, 
    activateElection 
} from "../controllers/electionController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

const router = express.Router();

router.get("/active", verifyToken, getActiveElection);
router.get("/", verifyToken, authorizeRole("admin"), getAllElections);
router.post("/", verifyToken, authorizeRole("admin"), createElection);
router.put("/:id", verifyToken, authorizeRole("admin"), updateElection);
router.delete("/:id", verifyToken, authorizeRole("admin"), deleteElection);
router.put("/activate/:id", verifyToken, authorizeRole("admin"), activateElection);

export default router;