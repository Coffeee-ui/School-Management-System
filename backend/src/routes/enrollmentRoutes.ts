import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticate);

// Self enrollments for student
router.get('/self', requirePermission('enrollments.read:self'), EnrollmentController.getSelf);

// Management routes
router.get('/', requirePermission('enrollments.read'), EnrollmentController.getAll);
router.get('/:id', requirePermission('enrollments.read'), EnrollmentController.getById);
router.post('/', requirePermission('enrollments.create'), EnrollmentController.create);
router.put('/:id', requirePermission('enrollments.update'), EnrollmentController.update);
router.delete('/:id', requirePermission('enrollments.delete'), EnrollmentController.delete);

export default router;
