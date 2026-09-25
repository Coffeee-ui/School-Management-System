import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticate);

// Self-profile route for employee
router.get('/profile', requirePermission('employees.read:self'), EmployeeController.getSelf);

// Management routes
router.get('/', requirePermission('employees.read'), EmployeeController.getAll);
router.get('/:id', requirePermission('employees.read'), EmployeeController.getById);
router.post('/', requirePermission('employees.create'), EmployeeController.create);
router.put('/:id', requirePermission('employees.update'), EmployeeController.update);
router.delete('/:id', requirePermission('employees.delete'), EmployeeController.delete);

export default router;
