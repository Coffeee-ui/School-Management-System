import { Router, Request, Response, NextFunction } from 'express';
import { APP_CONFIG } from '../config/index.js';
import { seedDatabase } from '../../scripts/seed.js';

const router = Router();

router.post('/reset', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!APP_CONFIG.DEMO_MODE) {
    res.status(403).json({ error: 'Demo mode is disabled. Reset operation is forbidden in normal mode.' });
    return;
  }

  try {
    await seedDatabase(true);
    res.status(200).json({ message: 'Demo database reset and seeded successfully' });
  } catch (err) {
    next(err);
  }
});

router.get('/status', (_req: Request, res: Response) => {
  res.status(200).json({
    mode: APP_CONFIG.MODE,
    demoMode: APP_CONFIG.DEMO_MODE,
  });
});

export default router;
