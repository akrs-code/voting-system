import express from 'express';
import { createPosition, getPositionsByDepartment, getVotingForm } from '../controllers/positionController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { authorizeRole } from '../middleware/authorizeRole.js';

const router = express.Router();

router.post('/', verifyToken, authorizeRole("admin"), createPosition);
router.get('/form/data', verifyToken, getVotingForm);
router.get('/:department', verifyToken, getPositionsByDepartment);

export default router;