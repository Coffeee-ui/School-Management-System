import { Router } from 'express';
import { AuditController } from '../controllers/auditController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission('audit_logs.read'));

router.get('/', AuditController.getLogs);
router.get('/stats', AuditController.getStats);
router.get('/export', AuditController.exportCsv);

export default router;
