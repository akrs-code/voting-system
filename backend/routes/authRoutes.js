import express from "express"; 
import { verifyToken } from '../middleware/verifyToken.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import { bulkSignup, deleteUser, login, signup, updateUser, getAllUsers } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", verifyToken, authorizeRole("admin"), signup);
router.post("/bulk", verifyToken, authorizeRole("admin"), bulkSignup);
router.put("/voter/:id", verifyToken, authorizeRole("admin"), updateUser);
router.delete("/voter/:id", verifyToken, authorizeRole("admin"), deleteUser);
router.get("/voters", verifyToken, authorizeRole("admin"), getAllUsers);

export default router;