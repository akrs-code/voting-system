import express from 'express';
import { createPosition, deletePosition, getPositionsByDepartment, getVotingForm, updatePosition } from '../controllers/positionController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { authorizeRole } from '../middleware/authorizeRole.js';

const router = express.Router();

router.post('/', verifyToken, authorizeRole("admin"), createPosition);
router.get('/form/data', verifyToken, getVotingForm);
router.get('/:department', verifyToken, getPositionsByDepartment);
router.put('/:id', verifyToken, authorizeRole("admin"), updatePosition);
router.delete('/:id', verifyToken, authorizeRole("admin"), deletePosition);

export default router;