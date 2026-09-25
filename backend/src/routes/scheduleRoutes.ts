import { Router } from 'express';
import { ScheduleController } from '../controllers/scheduleController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticate);

// Self-schedules (for student or employee)
router.get('/self', requirePermission('schedules.read:self'), ScheduleController.getSelf);

// Management routes
router.get('/', requirePermission('schedules.read'), ScheduleController.getAll);
router.get('/:id', requirePermission('schedules.read'), ScheduleController.getById);
router.post('/', requirePermission('schedules.create'), ScheduleController.create);
router.put('/:id', requirePermission('schedules.update'), ScheduleController.update);
router.delete('/:id', requirePermission('schedules.delete'), ScheduleController.delete);

export default router;
