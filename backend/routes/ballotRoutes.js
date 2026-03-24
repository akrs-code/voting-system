import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { 
    castBallot, 
    getBallot, 
    getElectionResultsByPosition, 
    getElectionStats 
} from '../controllers/ballotController.js';

const router = express.Router();

router.post('/cast', verifyToken, castBallot);
router.get('/results/:electionId', verifyToken, getElectionResultsByPosition);
router.get('/stats/:electionId', verifyToken, getElectionStats);
router.get('/:electionId/ballot', verifyToken, getBallot);

export default router;