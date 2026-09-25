import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService.js';

const auditService = new AuditService();

export class AuditController {
  public static getLogs(req: Request, res: Response, next: NextFunction): void {
    try {
      const { userId, username, role, action, resource, startDate, endDate, search, limit, offset } = req.query;

      const filters = {
        userId: userId ? parseInt(userId as string, 10) : undefined,
        username: username as string | undefined,
        role: role as string | undefined,
        action: action as string | undefined,
        resource: resource as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        search: search as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      };

      const result = auditService.getLogs(filters);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static getStats(_req: Request, res: Response, next: NextFunction): void {
    try {
      const stats = auditService.getStats();
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  }

  public static exportCsv(req: Request, res: Response, next: NextFunction): void {
    try {
      const { userId, username, role, action, resource, startDate, endDate, search } = req.query;

      const filters = {
        userId: userId ? parseInt(userId as string, 10) : undefined,
        username: username as string | undefined,
        role: role as string | undefined,
        action: action as string | undefined,
        resource: resource as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        search: search as string | undefined,
      };

      const csv = auditService.exportCsv(filters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}
