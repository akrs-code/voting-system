import express from "express"; 
import { verifyToken } from '../middleware/verifyToken.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import { bulkSignup, login, signup } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", verifyToken, authorizeRole("admin"), signup);
router.post("/bulk", verifyToken, authorizeRole("admin"), bulkSignup);

export default router;