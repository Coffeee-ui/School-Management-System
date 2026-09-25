import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimitMiddleware.js';

import { APP_CONFIG } from '../config/index.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.status(200).json({
    mode: APP_CONFIG.MODE,
    demoMode: APP_CONFIG.DEMO_MODE,
  });
});
router.post('/login', authRateLimiter, AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.post('/close-session', optionalAuthenticate, AuthController.closeSession);
router.get('/me', authenticate, AuthController.me);
router.post('/identify-profile', authRateLimiter, AuthController.identifyProfile);
router.post('/register', authRateLimiter, AuthController.register);
router.get('/demo-presets', AuthController.getDemoPresets);

export default router;
