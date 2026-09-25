import { Router } from 'express';
import { GradeController } from '../controllers/gradeController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticate);

// Self grades and GWA for student
router.get('/self', requirePermission('grades.read:self'), GradeController.getSelf);

// Specific student GWA
router.get('/gwa/:studentId', requirePermission('grades.read'), GradeController.getGwaByStudent);

// Management routes
router.get('/', requirePermission('grades.read'), GradeController.getAll);
router.get('/:id', requirePermission('grades.read'), GradeController.getById);
router.post('/', requirePermission('grades.create'), GradeController.create);
router.put('/:id', requirePermission('grades.update'), GradeController.update);
router.delete('/:id', requirePermission('grades.delete'), GradeController.delete);

export default router;
