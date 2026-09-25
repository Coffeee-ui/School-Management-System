import { Request, Response, NextFunction } from 'express';
import { GradeService } from '../services/gradeService.js';
import { AuditService } from '../services/auditService.js';

const gradeService = new GradeService();
const auditService = new AuditService();

export class GradeController {
  public static getAll(_req: Request, res: Response, next: NextFunction): void {
    try {
      const grades = gradeService.getAll();
      res.status(200).json(grades);
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

      const grades = gradeService.getByStudentId(studentId);
      const gwaInfo = gradeService.getStudentGwa(studentId);

      res.status(200).json({
        grades,
        gwa: gwaInfo.gwa,
        totalCredits: gwaInfo.totalCredits,
        courseCount: gwaInfo.courseCount,
      });
    } catch (err) {
      next(err);
    }
  }

  public static getGwaByStudent(req: Request, res: Response, next: NextFunction): void {
    try {
      const studentId = req.params.studentId;
      const gwaInfo = gradeService.getStudentGwa(studentId);
      res.status(200).json(gwaInfo);
    } catch (err) {
      next(err);
    }
  }

  public static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const grade = gradeService.getById(id);
      if (!grade) {
        res.status(404).json({ error: 'Grade record not found' });
        return;
      }
      res.status(200).json(grade);
    } catch (err) {
      next(err);
    }
  }

  public static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const encodedBy = req.user?.username || req.user?.employeeId || 'registrar';
      const grade = gradeService.create({
        ...req.body,
        encoded_by: encodedBy,
      });

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'registrar',
        action: 'ENCODE_GRADE',
        resource: 'grades',
        details: { gradeId: grade.id, studentId: grade.student_id, grade: grade.grade, remarks: grade.remarks },
        ipAddress,
        userAgent,
      });

      res.status(201).json(grade);
    } catch (err) {
      next(err);
    }
  }

  public static update(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const encodedBy = req.user?.username || req.user?.employeeId || 'registrar';
      const updated = gradeService.update(id, {
        ...req.body,
        encoded_by: encodedBy,
      });

      if (!updated) {
        res.status(404).json({ error: 'Grade record not found' });
        return;
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'registrar',
        action: 'UPDATE_GRADE',
        resource: 'grades',
        details: { gradeId: id, newGrade: updated.grade, remarks: updated.remarks },
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
      const grade = gradeService.getById(id);
      if (!grade) {
        res.status(404).json({ error: 'Grade record not found' });
        return;
      }

      gradeService.delete(id);

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'registrar',
        action: 'DELETE_GRADE',
        resource: 'grades',
        details: { gradeId: id, studentId: grade.student_id },
        ipAddress,
        userAgent,
      });

      res.status(200).json({ message: 'Grade record deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
