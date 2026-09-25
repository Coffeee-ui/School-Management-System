import { Request, Response, NextFunction } from 'express';
import { ScheduleService } from '../services/scheduleService.js';
import { EnrollmentService } from '../services/enrollmentService.js';
import { AuditService } from '../services/auditService.js';

const scheduleService = new ScheduleService();
const enrollmentService = new EnrollmentService();
const auditService = new AuditService();

export class ScheduleController {
  public static getAll(_req: Request, res: Response, next: NextFunction): void {
    try {
      const schedules = scheduleService.getAll();
      res.status(200).json(schedules);
    } catch (err) {
      next(err);
    }
  }

  public static getSelf(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (req.user.role === 'employee' || req.user.employeeId) {
        const empId = req.user.employeeId;
        if (!empId) {
          res.status(404).json({ error: 'No linked employee profile' });
          return;
        }
        const schedules = scheduleService.getByEmployeeId(empId);
        res.status(200).json(schedules);
        return;
      }

      if (req.user.role === 'student' || req.user.studentId) {
        const studentId = req.user.studentId;
        if (!studentId) {
          res.status(404).json({ error: 'No linked student profile' });
          return;
        }
        // For student, their class schedules come from their active enrollments
        const enrollments = enrollmentService.getByStudentId(studentId);
        const studentSchedules = enrollments
          .filter(e => e.status === 'enrolled' && e.schedule_id)
          .map(e => ({
            id: e.schedule_id,
            schedule_type: 'teaching',
            course_id: e.course_id,
            course_code: e.course_code,
            course_name: e.course_name,
            instructor_name: e.instructor_name,
            day_of_week: e.schedule_day,
            start_time: e.start_time,
            end_time: e.end_time,
            room: e.room,
            academic_year: e.academic_year,
            semester: e.semester,
          }));
        res.status(200).json(studentSchedules);
        return;
      }

      res.status(200).json([]);
    } catch (err) {
      next(err);
    }
  }

  public static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id as string, 10);
      const schedule = scheduleService.getById(id);
      if (!schedule) {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }
      res.status(200).json(schedule);
    } catch (err) {
      next(err);
    }
  }

  public static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const schedule = scheduleService.create(req.body);

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'staff',
        action: 'CREATE_SCHEDULE',
        resource: 'schedules',
        details: { scheduleId: schedule.id, type: schedule.schedule_type, employeeId: schedule.employee_id, room: schedule.room },
        ipAddress,
        userAgent,
      });

      res.status(201).json(schedule);
    } catch (err) {
      next(err);
    }
  }

  public static update(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id as string, 10);
      const updated = scheduleService.update(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'staff',
        action: 'UPDATE_SCHEDULE',
        resource: 'schedules',
        details: { scheduleId: id },
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
      const schedule = scheduleService.getById(id);
      if (!schedule) {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }

      scheduleService.delete(id);

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'system',
        role: req.user?.role || 'staff',
        action: 'DELETE_SCHEDULE',
        resource: 'schedules',
        details: { scheduleId: id },
        ipAddress,
        userAgent,
      });

      res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
