import express from 'express';
import { createPosition, deletePosition, getPositionsByDepartment, getVotingForm, updatePosition } from '../controllers/positionController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { authorizeRole } from '../middleware/authorizeRole.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', authorizeRole("admin"), createPosition);
router.get('/voting-structure', getVotingForm);
router.get('/dept/:department', getPositionsByDepartment);
router.patch('/:id', authorizeRole("admin"), updatePosition);
router.delete('/:id', authorizeRole("admin"), deletePosition);

export default router;