import { BaseRepository } from './baseRepository.js';
import { Grade } from '../models/types.js';
import { IDatabaseProvider } from '../db/databaseProvider.js';

export class GradeRepository extends BaseRepository<Grade> {
  constructor(provider?: IDatabaseProvider) {
    super('grades', provider);
  }

  public findAllWithDetails(): Grade[] {
    return this.provider.query<Grade>(
      `SELECT g.*, 
              c.course_code, c.course_name, c.credits,
              (s.first_name || ' ' || s.last_name) as student_name
       FROM grades g
       JOIN courses c ON g.course_id = c.id
       JOIN students s ON g.student_id = s.student_id
       ORDER BY g.updated_at DESC`
    );
  }

  public findByStudentId(studentId: string): Grade[] {
    return this.provider.query<Grade>(
      `SELECT g.*, 
              c.course_code, c.course_name, c.credits,
              (s.first_name || ' ' || s.last_name) as student_name
       FROM grades g
       JOIN courses c ON g.course_id = c.id
       JOIN students s ON g.student_id = s.student_id
       WHERE g.student_id = ?
       ORDER BY g.updated_at DESC`,
      [studentId.trim()]
    );
  }

  public findByEnrollmentId(enrollmentId: number): Grade | null {
    return this.provider.queryOne<Grade>(
      `SELECT g.*, 
              c.course_code, c.course_name, c.credits,
              (s.first_name || ' ' || s.last_name) as student_name
       FROM grades g
       JOIN courses c ON g.course_id = c.id
       JOIN students s ON g.student_id = s.student_id
       WHERE g.enrollment_id = ? LIMIT 1`,
      [enrollmentId]
    );
  }

  public findByIdWithDetails(id: number): Grade | null {
    return this.provider.queryOne<Grade>(
      `SELECT g.*, 
              c.course_code, c.course_name, c.credits,
              (s.first_name || ' ' || s.last_name) as student_name
       FROM grades g
       JOIN courses c ON g.course_id = c.id
       JOIN students s ON g.student_id = s.student_id
       WHERE g.id = ? LIMIT 1`,
      [id]
    );
  }

  public calculateGwa(studentId: string): { gwa: number; totalCredits: number; courseCount: number } {
    const grades = this.findByStudentId(studentId);
    if (!grades || grades.length === 0) {
      return { gwa: 0, totalCredits: 0, courseCount: 0 };
    }

    let totalWeightedScore = 0;
    let totalCredits = 0;

    for (const g of grades) {
      const credits = g.credits || 3;
      totalWeightedScore += g.grade * credits;
      totalCredits += credits;
    }

    const gwa = totalCredits > 0 ? Number((totalWeightedScore / totalCredits).toFixed(2)) : 0;
    return {
      gwa,
      totalCredits,
      courseCount: grades.length,
    };
  }

  public create(data: {
    enrollment_id: number;
    student_id: string;
    course_id: number;
    grade: number;
    remarks: string;
    encoded_by: string;
  }): Grade {
    const now = new Date().toISOString();
    const result = this.provider.execute(
      `INSERT INTO grades (
        enrollment_id, student_id, course_id, grade,
        remarks, encoded_by, encoded_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.enrollment_id,
        data.student_id.trim(),
        data.course_id,
        data.grade,
        data.remarks.trim(),
        data.encoded_by.trim(),
        now,
        now,
      ]
    );

    const created = this.findByIdWithDetails(Number(result.lastInsertRowid));
    if (!created) {
      throw new Error('Failed to create grade');
    }
    return created;
  }

  public update(id: number, data: Partial<Grade>): Grade | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.grade !== undefined) {
      fields.push('grade = ?');
      values.push(data.grade);
    }
    if (data.remarks !== undefined) {
      fields.push('remarks = ?');
      values.push(data.remarks.trim());
    }
    if (data.encoded_by !== undefined) {
      fields.push('encoded_by = ?');
      values.push(data.encoded_by.trim());
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    this.provider.execute(
      `UPDATE grades SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findByIdWithDetails(id);
  }
}
