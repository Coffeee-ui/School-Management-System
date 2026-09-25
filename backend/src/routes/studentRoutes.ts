import { Router } from 'express';
import { StudentController } from '../controllers/studentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticate);

// Self-profile route for student role
router.get('/profile', requirePermission('students.read:self'), StudentController.getSelf);

// Administrative / Registrar routes
router.get('/', requirePermission('students.read'), StudentController.getAll);
router.get('/:id', requirePermission('students.read'), StudentController.getById);
router.post('/', requirePermission('students.create'), StudentController.create);
router.put('/:id', requirePermission('students.update'), StudentController.update);
router.delete('/:id', requirePermission('students.delete'), StudentController.delete);

export default router;
