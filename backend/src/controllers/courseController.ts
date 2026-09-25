import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/courseService.js';
import { AuditService } from '../services/auditService.js';

const courseService = new CourseService();
const auditService = new AuditService();

export class CourseController {
  public static getAll(_req: Request, res: Response, next: NextFunction): void {
    try {
      const courses = courseService.getAll();
      res.status(200).json(courses);
    } catch (err) {
      next(err);
    }
  }

  public static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id as string, 10);
      const course = courseService.getById(id);
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }
      res.status(200).json(course);
    } catch (err) {
      next(err);
    }
  }

  public static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const course = courseService.create(req.body);

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'registrar',
        action: 'CREATE_COURSE',
        resource: 'courses',
        details: { courseCode: course.course_code, name: course.course_name },
        ipAddress,
        userAgent,
      });

      res.status(201).json(course);
    } catch (err) {
      next(err);
    }
  }

  public static update(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id as string, 10);
      const updated = courseService.update(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'registrar',
        action: 'UPDATE_COURSE',
        resource: 'courses',
        details: { courseId: id, courseCode: updated.course_code },
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
      const course = courseService.getById(id);
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      courseService.delete(id);

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'registrar',
        action: 'DELETE_COURSE',
        resource: 'courses',
        details: { courseCode: course.course_code },
        ipAddress,
        userAgent,
      });

      res.status(200).json({ message: 'Course deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
