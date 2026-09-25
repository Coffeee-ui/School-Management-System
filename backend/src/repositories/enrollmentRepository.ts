import { BaseRepository } from './baseRepository.js';
import { Enrollment, EnrollmentStatus } from '../models/types.js';
import { IDatabaseProvider } from '../db/databaseProvider.js';

export class EnrollmentRepository extends BaseRepository<Enrollment> {
  constructor(provider?: IDatabaseProvider) {
    super('enrollments', provider);
  }

  public findAllWithDetails(): Enrollment[] {
    return this.provider.query<Enrollment>(
      `SELECT e.*,
              c.course_code, c.course_name, c.credits,
              (s.first_name || ' ' || s.last_name) as student_name,
              sch.room, sch.day_of_week as schedule_day, sch.start_time, sch.end_time,
              (emp.first_name || ' ' || emp.last_name) as instructor_name
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN students s ON e.student_id = s.student_id
       LEFT JOIN schedules sch ON e.schedule_id = sch.id
       LEFT JOIN employees emp ON sch.employee_id = emp.employee_id
       ORDER BY e.created_at DESC`
    );
  }

  public findByStudentId(studentId: string): Enrollment[] {
    return this.provider.query<Enrollment>(
      `SELECT e.*,
              c.course_code, c.course_name, c.credits,
              (s.first_name || ' ' || s.last_name) as student_name,
              sch.room, sch.day_of_week as schedule_day, sch.start_time, sch.end_time,
              (emp.first_name || ' ' || emp.last_name) as instructor_name
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN students s ON e.student_id = s.student_id
       LEFT JOIN schedules sch ON e.schedule_id = sch.id
       LEFT JOIN employees emp ON sch.employee_id = emp.employee_id
       WHERE e.student_id = ?
       ORDER BY e.academic_year DESC, e.semester DESC`,
      [studentId.trim()]
    );
  }

  public findByIdWithDetails(id: number): Enrollment | null {
    return this.provider.queryOne<Enrollment>(
      `SELECT e.*,
              c.course_code, c.course_name, c.credits,
              (s.first_name || ' ' || s.last_name) as student_name,
              sch.room, sch.day_of_week as schedule_day, sch.start_time, sch.end_time,
              (emp.first_name || ' ' || emp.last_name) as instructor_name
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN students s ON e.student_id = s.student_id
       LEFT JOIN schedules sch ON e.schedule_id = sch.id
       LEFT JOIN employees emp ON sch.employee_id = emp.employee_id
       WHERE e.id = ? LIMIT 1`,
      [id]
    );
  }

  public findExisting(
    studentId: string,
    courseId: number,
    academicYear: string,
    semester: string
  ): Enrollment | null {
    return this.provider.queryOne<Enrollment>(
      `SELECT * FROM enrollments 
       WHERE student_id = ? AND course_id = ? AND academic_year = ? AND semester = ?
       LIMIT 1`,
      [studentId.trim(), courseId, academicYear.trim(), semester.trim()]
    );
  }

  public create(data: {
    student_id: string;
    course_id: number;
    schedule_id?: number | null;
    academic_year: string;
    semester: string;
    status?: EnrollmentStatus;
  }): Enrollment {
    const now = new Date().toISOString();
    const result = this.provider.execute(
      `INSERT INTO enrollments (
        student_id, course_id, schedule_id, academic_year,
        semester, status, enrolled_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.student_id.trim(),
        data.course_id,
        data.schedule_id || null,
        data.academic_year.trim(),
        data.semester.trim(),
        data.status || 'enrolled',
        now,
        now,
        now,
      ]
    );

    const created = this.findByIdWithDetails(Number(result.lastInsertRowid));
    if (!created) {
      throw new Error('Failed to create enrollment');
    }
    return created;
  }

  public update(id: number, data: Partial<Enrollment>): Enrollment | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.student_id !== undefined) {
      fields.push('student_id = ?');
      values.push(data.student_id.trim());
    }
    if (data.course_id !== undefined) {
      fields.push('course_id = ?');
      values.push(data.course_id);
    }
    if (data.schedule_id !== undefined) {
      fields.push('schedule_id = ?');
      values.push(data.schedule_id || null);
    }
    if (data.academic_year !== undefined) {
      fields.push('academic_year = ?');
      values.push(data.academic_year.trim());
    }
    if (data.semester !== undefined) {
      fields.push('semester = ?');
      values.push(data.semester.trim());
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    this.provider.execute(
      `UPDATE enrollments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findByIdWithDetails(id);
  }
}
