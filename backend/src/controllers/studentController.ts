import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/studentService.js';
import { AuditService } from '../services/auditService.js';

const studentService = new StudentService();
const auditService = new AuditService();

export class StudentController {
  public static getAll(_req: Request, res: Response, next: NextFunction): void {
    try {
      const students = studentService.getAll();
      res.status(200).json(students);
    } catch (err) {
      next(err);
    }
  }

  public static getSelf(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user?.studentId && !req.user?.userId) {
        res.status(403).json({ error: 'Forbidden: No linked student record' });
        return;
      }

      let student = null;
      if (req.user.studentId) {
        student = studentService.getByStudentId(req.user.studentId);
      } else {
        student = studentService.getByUserId(req.user.userId);
      }

      if (!student) {
        res.status(404).json({ error: 'Student profile not found' });
        return;
      }

      res.status(200).json(student);
    } catch (err) {
      next(err);
    }
  }

  public static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const student = studentService.getById(id);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }
      res.status(200).json(student);
    } catch (err) {
      next(err);
    }
  }

  public static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const student = studentService.create(req.body);

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'registrar',
        action: 'CREATE_STUDENT',
        resource: 'students',
        details: { studentId: student.student_id, name: `${student.first_name} ${student.last_name}` },
        ipAddress,
        userAgent,
      });

      res.status(201).json(student);
    } catch (err) {
      next(err);
    }
  }

  public static update(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = studentService.update(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'registrar',
        action: 'UPDATE_STUDENT',
        resource: 'students',
        details: { studentId: updated.student_id, fields: Object.keys(req.body) },
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
      const id = parseInt(req.params.id, 10);
      const student = studentService.getById(id);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      studentService.delete(id);

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'registrar',
        action: 'DELETE_STUDENT',
        resource: 'students',
        details: { studentId: student.student_id },
        ipAddress,
        userAgent,
      });

      res.status(200).json({ message: 'Student deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
