import { Request, Response, NextFunction } from 'express';
import { Permission, hasPermission } from '../utils/permissions.js';
import { UserRole } from '../models/types.js';

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    // Admin has global wildcard access
    if (req.user.role === 'admin') {
      next();
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions for this resource' });
      return;
    }

    next();
  };
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({ error: 'Forbidden: Role not authorized for this resource' });
  };
}
