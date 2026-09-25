import { BaseRepository } from './baseRepository.js';
import { Schedule, ScheduleType } from '../models/types.js';
import { IDatabaseProvider } from '../db/databaseProvider.js';

export class ScheduleRepository extends BaseRepository<Schedule> {
  constructor(provider?: IDatabaseProvider) {
    super('schedules', provider);
  }

  public findAllWithDetails(): Schedule[] {
    return this.provider.query<Schedule>(
      `SELECT s.*, 
              c.course_code, c.course_name,
              (e.first_name || ' ' || e.last_name) as instructor_name
       FROM schedules s
       LEFT JOIN courses c ON s.course_id = c.id
       LEFT JOIN employees e ON s.employee_id = e.employee_id
       ORDER BY 
         CASE s.day_of_week
           WHEN 'Monday' THEN 1
           WHEN 'Tuesday' THEN 2
           WHEN 'Wednesday' THEN 3
           WHEN 'Thursday' THEN 4
           WHEN 'Friday' THEN 5
           WHEN 'Saturday' THEN 6
           WHEN 'Sunday' THEN 7
           ELSE 8
         END,
         s.start_time ASC`
    );
  }

  public findByEmployeeId(employeeId: string): Schedule[] {
    return this.provider.query<Schedule>(
      `SELECT s.*, 
              c.course_code, c.course_name,
              (e.first_name || ' ' || e.last_name) as instructor_name
       FROM schedules s
       LEFT JOIN courses c ON s.course_id = c.id
       LEFT JOIN employees e ON s.employee_id = e.employee_id
       WHERE s.employee_id = ?
       ORDER BY 
         CASE s.day_of_week
           WHEN 'Monday' THEN 1
           WHEN 'Tuesday' THEN 2
           WHEN 'Wednesday' THEN 3
           WHEN 'Thursday' THEN 4
           WHEN 'Friday' THEN 5
           WHEN 'Saturday' THEN 6
           WHEN 'Sunday' THEN 7
           ELSE 8
         END,
         s.start_time ASC`,
      [employeeId.trim()]
    );
  }

  public findByCourseId(courseId: number): Schedule[] {
    return this.provider.query<Schedule>(
      `SELECT s.*, 
              c.course_code, c.course_name,
              (e.first_name || ' ' || e.last_name) as instructor_name
       FROM schedules s
       LEFT JOIN courses c ON s.course_id = c.id
       LEFT JOIN employees e ON s.employee_id = e.employee_id
       WHERE s.course_id = ?
       ORDER BY s.day_of_week, s.start_time`,
      [courseId]
    );
  }

  public findByIdWithDetails(id: number): Schedule | null {
    return this.provider.queryOne<Schedule>(
      `SELECT s.*, 
              c.course_code, c.course_name,
              (e.first_name || ' ' || e.last_name) as instructor_name
       FROM schedules s
       LEFT JOIN courses c ON s.course_id = c.id
       LEFT JOIN employees e ON s.employee_id = e.employee_id
       WHERE s.id = ? LIMIT 1`,
      [id]
    );
  }

  public checkEmployeeConflict(
    employeeId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    excludeId?: number
  ): boolean {
    const sql = `
      SELECT COUNT(*) as count FROM schedules
      WHERE employee_id = ? 
        AND day_of_week = ?
        AND ? < end_time AND ? > start_time
        ${excludeId ? 'AND id != ?' : ''}
    `;
    const params: unknown[] = [employeeId.trim(), dayOfWeek.trim(), startTime, endTime];
    if (excludeId) params.push(excludeId);

    const row = this.provider.queryOne<{ count: number }>(sql, params);
    return (row?.count || 0) > 0;
  }

  public checkRoomConflict(
    room: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    excludeId?: number
  ): boolean {
    const sql = `
      SELECT COUNT(*) as count FROM schedules
      WHERE room = ? 
        AND day_of_week = ?
        AND ? < end_time AND ? > start_time
        ${excludeId ? 'AND id != ?' : ''}
    `;
    const params: unknown[] = [room.trim(), dayOfWeek.trim(), startTime, endTime];
    if (excludeId) params.push(excludeId);

    const row = this.provider.queryOne<{ count: number }>(sql, params);
    return (row?.count || 0) > 0;
  }

  public create(data: {
    schedule_type: ScheduleType;
    course_id?: number | null;
    employee_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room: string;
    academic_year: string;
    semester: string;
  }): Schedule {
    const now = new Date().toISOString();
    const result = this.provider.execute(
      `INSERT INTO schedules (
        schedule_type, course_id, employee_id, day_of_week,
        start_time, end_time, room, academic_year, semester,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.schedule_type,
        data.course_id || null,
        data.employee_id.trim(),
        data.day_of_week.trim(),
        data.start_time.trim(),
        data.end_time.trim(),
        data.room.trim(),
        data.academic_year.trim(),
        data.semester.trim(),
        now,
        now,
      ]
    );

    const created = this.findByIdWithDetails(Number(result.lastInsertRowid));
    if (!created) {
      throw new Error('Failed to create schedule');
    }
    return created;
  }

  public update(id: number, data: Partial<Schedule>): Schedule | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.schedule_type !== undefined) {
      fields.push('schedule_type = ?');
      values.push(data.schedule_type);
    }
    if (data.course_id !== undefined) {
      fields.push('course_id = ?');
      values.push(data.course_id || null);
    }
    if (data.employee_id !== undefined) {
      fields.push('employee_id = ?');
      values.push(data.employee_id.trim());
    }
    if (data.day_of_week !== undefined) {
      fields.push('day_of_week = ?');
      values.push(data.day_of_week.trim());
    }
    if (data.start_time !== undefined) {
      fields.push('start_time = ?');
      values.push(data.start_time.trim());
    }
    if (data.end_time !== undefined) {
      fields.push('end_time = ?');
      values.push(data.end_time.trim());
    }
    if (data.room !== undefined) {
      fields.push('room = ?');
      values.push(data.room.trim());
    }
    if (data.academic_year !== undefined) {
      fields.push('academic_year = ?');
      values.push(data.academic_year.trim());
    }
    if (data.semester !== undefined) {
      fields.push('semester = ?');
      values.push(data.semester.trim());
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    this.provider.execute(
      `UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findByIdWithDetails(id);
  }
}
