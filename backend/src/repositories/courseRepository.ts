import { BaseRepository } from './baseRepository.js';
import { Course } from '../models/types.js';
import { IDatabaseProvider } from '../db/databaseProvider.js';

export class CourseRepository extends BaseRepository<Course> {
  constructor(provider?: IDatabaseProvider) {
    super('courses', provider);
  }

  public findByCode(courseCode: string): Course | null {
    return this.provider.queryOne<Course>(
      `SELECT * FROM courses WHERE course_code = ? LIMIT 1`,
      [courseCode.trim().toUpperCase()]
    );
  }

  public create(data: {
    course_code: string;
    course_name: string;
    description?: string | null;
    credits?: number;
    department: string;
    semester: string;
    academic_year: string;
    status?: 'active' | 'archived';
  }): Course {
    const now = new Date().toISOString();
    const result = this.provider.execute(
      `INSERT INTO courses (
        course_code, course_name, description, credits,
        department, semester, academic_year, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.course_code.trim().toUpperCase(),
        data.course_name.trim(),
        data.description?.trim() || null,
        data.credits || 3,
        data.department.trim(),
        data.semester.trim(),
        data.academic_year.trim(),
        data.status || 'active',
        now,
        now,
      ]
    );

    const created = this.findById(Number(result.lastInsertRowid));
    if (!created) {
      throw new Error('Failed to create course');
    }
    return created;
  }

  public update(id: number, data: Partial<Course>): Course | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.course_code !== undefined) {
      fields.push('course_code = ?');
      values.push(data.course_code.trim().toUpperCase());
    }
    if (data.course_name !== undefined) {
      fields.push('course_name = ?');
      values.push(data.course_name.trim());
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description ? data.description.trim() : null);
    }
    if (data.credits !== undefined) {
      fields.push('credits = ?');
      values.push(data.credits);
    }
    if (data.department !== undefined) {
      fields.push('department = ?');
      values.push(data.department.trim());
    }
    if (data.semester !== undefined) {
      fields.push('semester = ?');
      values.push(data.semester.trim());
    }
    if (data.academic_year !== undefined) {
      fields.push('academic_year = ?');
      values.push(data.academic_year.trim());
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    this.provider.execute(
      `UPDATE courses SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }
}
