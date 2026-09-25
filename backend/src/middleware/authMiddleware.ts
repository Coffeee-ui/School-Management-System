import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { AuthTokenPayload } from '../models/types.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      sessionId?: string;
    }
  }
}

const authService = new AuthService();

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    req.sessionId = payload.sessionId;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    res.status(401).json({ error: `Unauthorized: ${message}` });
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = authService.verifyToken(token);
      req.user = payload;
      req.sessionId = payload.sessionId;
    } catch {
      // ignore in optional mode
    }
  }
  next();
}
