import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import studentRoutes from './studentRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import courseRoutes from './courseRoutes.js';
import scheduleRoutes from './scheduleRoutes.js';
import enrollmentRoutes from './enrollmentRoutes.js';
import gradeRoutes from './gradeRoutes.js';
import auditRoutes from './auditRoutes.js';
import demoRoutes from './demoRoutes.js';
import { APP_CONFIG } from '../config/index.js';

const apiRouter = Router();

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    mode: APP_CONFIG.MODE,
    timestamp: new Date().toISOString(),
    service: 'Apex Institute School Management Portal API',
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/students', studentRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/courses', courseRoutes);
apiRouter.use('/schedules', scheduleRoutes);
apiRouter.use('/enrollments', enrollmentRoutes);
apiRouter.use('/grades', gradeRoutes);
apiRouter.use('/audit-logs', auditRoutes);
apiRouter.use('/demo', demoRoutes);

export default apiRouter;
