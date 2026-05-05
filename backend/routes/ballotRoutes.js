import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    castBallot,
    getBallot,
    getElectionResultsByPosition,
    getElectionStats
} from '../controllers/ballotController.js';
import { authorizeRole } from '../middleware/authorizeRole.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', authorizeRole("voter"), castBallot);
router.get('/:electionId', authorizeRole("voter"), getBallot);
router.get('/:electionId/results', authorizeRole("admin"), getElectionResultsByPosition);
router.get('/:electionId/stats', authorizeRole("admin"), getElectionStats);

export default router;