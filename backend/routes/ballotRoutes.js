import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { castBallot, getElectionResultsByPosition } from '../controllers/ballotController.js';

const router = express.Router();

router.post('/submit', verifyToken, castBallot);
router.get('/results/:electionId/positions', verifyToken, getElectionResultsByPosition);

export default router; 