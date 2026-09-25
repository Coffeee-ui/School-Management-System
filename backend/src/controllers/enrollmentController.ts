import { Request, Response, NextFunction } from 'express';
import { EnrollmentService } from '../services/enrollmentService.js';
import { AuditService } from '../services/auditService.js';

const enrollmentService = new EnrollmentService();
const auditService = new AuditService();

export class EnrollmentController {
  public static getAll(_req: Request, res: Response, next: NextFunction): void {
    try {
      const enrollments = enrollmentService.getAll();
      res.status(200).json(enrollments);
    } catch (err) {
      next(err);
    }
  }

  public static getSelf(req: Request, res: Response, next: NextFunction): void {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        res.status(403).json({ error: 'Forbidden: No linked student record' });
        return;
      }

      const enrollments = enrollmentService.getByStudentId(studentId);
      res.status(200).json(enrollments);
    } catch (err) {
      next(err);
    }
  }

  public static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id as string, 10);
      const enrollment = enrollmentService.getById(id);
      if (!enrollment) {
        res.status(404).json({ error: 'Enrollment record not found' });
        return;
      }
      res.status(200).json(enrollment);
    } catch (err) {
      next(err);
    }
  }

  public static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const enrollment = enrollmentService.create(req.body);

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'registrar',
        action: 'CREATE_ENROLLMENT',
        resource: 'enrollments',
        details: { enrollmentId: enrollment.id, studentId: enrollment.student_id, courseId: enrollment.course_id },
        ipAddress,
        userAgent,
      });

      res.status(201).json(enrollment);
    } catch (err) {
      next(err);
    }
  }

  public static update(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id as string, 10);
      const updated = enrollmentService.update(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Enrollment record not found' });
        return;
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'registrar',
        action: 'UPDATE_ENROLLMENT',
        resource: 'enrollments',
        details: { enrollmentId: id, status: updated.status },
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
      const enrollment = enrollmentService.getById(id);
      if (!enrollment) {
        res.status(404).json({ error: 'Enrollment record not found' });
        return;
      }

      enrollmentService.delete(id);

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'registrar',
        action: 'DELETE_ENROLLMENT',
        resource: 'enrollments',
        details: { enrollmentId: id, studentId: enrollment.student_id },
        ipAddress,
        userAgent,
      });

      res.status(200).json({ message: 'Enrollment record deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
