import express from "express"
import { verifyToken } from '../middleware/verifyToken.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import { bulkSignup, deleteUser, login, updateUser, getAllUsers,submitApplication, manageApplication, signup, getPendingApplications } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", verifyToken, authorizeRole("admin"), signup);
router.post("/apply", submitApplication);
router.post("/application", verifyToken, authorizeRole("admin"), manageApplication);
router.post("/bulk", verifyToken, authorizeRole("admin"), bulkSignup);
router.put("/voter/:id", verifyToken, authorizeRole("admin"), updateUser);
router.post("/manage-user/:id", verifyToken, authorizeRole("admin"), manageApplication);
router.delete("/voter/:id", verifyToken, authorizeRole("admin"), deleteUser);
router.get("/voters", verifyToken, authorizeRole("admin"), getAllUsers);
router.get("/applications/pending", verifyToken, authorizeRole("admin"), getPendingApplications);

export default router;