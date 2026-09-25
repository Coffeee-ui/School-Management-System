import { Router } from 'express';
import { CourseController } from '../controllers/courseController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('courses.read'), CourseController.getAll);
router.get('/:id', requirePermission('courses.read'), CourseController.getById);
router.post('/', requirePermission('courses.create'), CourseController.create);
router.put('/:id', requirePermission('courses.update'), CourseController.update);
router.delete('/:id', requirePermission('courses.delete'), CourseController.delete);

export default router;
