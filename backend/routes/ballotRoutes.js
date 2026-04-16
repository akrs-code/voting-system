import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { 
    castBallot, 
    getBallot, 
    getElectionResultsByPosition, 
    getElectionStats 
} from '../controllers/ballotController.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', castBallot);
router.get('/:electionId', getBallot);
router.get('/:electionId/results', getElectionResultsByPosition);
router.get('/:electionId/stats', getElectionStats);

export default router;