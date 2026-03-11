import { login, signup, bulkSignup } from '../controllers/authController.js'
import { limiter } from '../middleware/rateLimiter.js'
import { verifyToken } from '../middleware/verifyToken.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import express from 'express'

const router = express.Router();

router.post('/signup', verifyToken, authorizeRole("admin"), signup)
router.post('/login', limiter, login)
router.post("/signup/bulk", verifyToken, authorizeRole("admin"), bulkSignup);

export default router