import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('users.read'), UserController.getAll);
router.get('/:id', requirePermission('users.read'), UserController.getById);
router.post('/', requirePermission('users.create'), UserController.create);
router.put('/:id', requirePermission('users.update'), UserController.update);
router.delete('/:id', requirePermission('users.delete'), UserController.delete);

export default router;
