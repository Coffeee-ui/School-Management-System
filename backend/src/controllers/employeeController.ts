import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employeeService.js';
import { AuditService } from '../services/auditService.js';

const employeeService = new EmployeeService();
const auditService = new AuditService();

export class EmployeeController {
  public static getAll(_req: Request, res: Response, next: NextFunction): void {
    try {
      const employees = employeeService.getAll();
      res.status(200).json(employees);
    } catch (err) {
      next(err);
    }
  }

  public static getSelf(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user?.employeeId && !req.user?.userId) {
        res.status(403).json({ error: 'Forbidden: No linked employee record' });
        return;
      }

      let employee = null;
      if (req.user.employeeId) {
        employee = employeeService.getByEmployeeId(req.user.employeeId);
      } else {
        employee = employeeService.getByUserId(req.user.userId);
      }

      if (!employee) {
        res.status(404).json({ error: 'Employee profile not found' });
        return;
      }

      res.status(200).json(employee);
    } catch (err) {
      next(err);
    }
  }

  public static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id as string, 10);
      const employee = employeeService.getById(id);
      if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }
      res.status(200).json(employee);
    } catch (err) {
      next(err);
    }
  }

  public static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const employee = employeeService.create(req.body);

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'hr',
        action: 'CREATE_EMPLOYEE',
        resource: 'employees',
        details: { employeeId: employee.employee_id, name: `${employee.first_name} ${employee.last_name}`, department: employee.department },
        ipAddress,
        userAgent,
      });

      res.status(201).json(employee);
    } catch (err) {
      next(err);
    }
  }

  public static update(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id as string, 10);
      const updated = employeeService.update(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'hr',
        action: 'UPDATE_EMPLOYEE',
        resource: 'employees',
        details: { employeeId: updated.employee_id, fields: Object.keys(req.body) },
        ipAddress,
        userAgent,
      });

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }

  public static delete(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id as string, 10);
      const employee = employeeService.getById(id);
      if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }

      employeeService.delete(id);

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'hr',
        action: 'DELETE_EMPLOYEE',
        resource: 'employees',
        details: { employeeId: employee.employee_id },
        ipAddress,
        userAgent,
      });

      res.status(200).json({ message: 'Employee record deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
