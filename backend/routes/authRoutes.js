import express from "express"
import { verifyToken } from '../middleware/verifyToken.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import {
    bulkSignup, deleteUser, login, updateUser,
    getAllUsers, submitApplication, manageApplication,
    signup, getPendingApplications, logout, getMe
} from "../controllers/authController.js";

import { limiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/login", limiter, login);
router.post("/logout", logout);
router.post("/applications", limiter, submitApplication);
router.get("/me", verifyToken, getMe);

router.use(verifyToken, authorizeRole("admin"));

router.get("/users", getAllUsers);
router.post("/users", signup);
router.post("/users/bulk", bulkSignup);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/applications/pending", getPendingApplications);
router.patch("/applications/:id", manageApplication);

export default router;