import { login, signup, bulkSignup } from '../controllers/authController.js'
import { limiter } from '../middleware/rateLimiter.js'
import express from 'express'

const router = express.Router();

router.post('/signup', signup)
router.post('/login', limiter, login)
router.post("/signup/bulk", bulkSignup);

export default router