import { BaseRepository } from './baseRepository.js';
import { Student } from '../models/types.js';
import { IDatabaseProvider } from '../db/databaseProvider.js';

export class StudentRepository extends BaseRepository<Student> {
  constructor(provider?: IDatabaseProvider) {
    super('students', provider);
  }

  public findByStudentId(studentId: string): Student | null {
    return this.provider.queryOne<Student>(
      `SELECT * FROM students WHERE student_id = ? LIMIT 1`,
      [studentId.trim()]
    );
  }

  public findByUserId(userId: number): Student | null {
    return this.provider.queryOne<Student>(
      `SELECT * FROM students WHERE user_id = ? LIMIT 1`,
      [userId]
    );
  }

  public findByEmail(email: string): Student | null {
    return this.provider.queryOne<Student>(
      `SELECT * FROM students WHERE email = ? LIMIT 1`,
      [email.trim()]
    );
  }

  public create(data: {
    student_id: string;
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    email: string;
    contact_number: string;
    date_of_birth: string;
    gender: string;
    address: string;
    program: string;
    year_level?: number;
    status?: string;
    user_id?: number | null;
  }): Student {
    const now = new Date().toISOString();
    const result = this.provider.execute(
      `INSERT INTO students (
        student_id, first_name, last_name, middle_name, email,
        contact_number, date_of_birth, gender, address, program,
        year_level, status, user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.student_id.trim(),
        data.first_name.trim(),
        data.last_name.trim(),
        data.middle_name?.trim() || null,
        data.email.trim(),
        data.contact_number.trim(),
        data.date_of_birth.trim(),
        data.gender.trim(),
        data.address.trim(),
        data.program.trim(),
        data.year_level || 1,
        data.status || 'enrolled',
        data.user_id || null,
        now,
        now,
      ]
    );

    const created = this.findById(Number(result.lastInsertRowid));
    if (!created) {
      throw new Error('Failed to create student record');
    }
    return created;
  }

  public update(id: number, data: Partial<Student>): Student | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.student_id !== undefined) {
      fields.push('student_id = ?');
      values.push(data.student_id.trim());
    }
    if (data.first_name !== undefined) {
      fields.push('first_name = ?');
      values.push(data.first_name.trim());
    }
    if (data.last_name !== undefined) {
      fields.push('last_name = ?');
      values.push(data.last_name.trim());
    }
    if (data.middle_name !== undefined) {
      fields.push('middle_name = ?');
      values.push(data.middle_name ? data.middle_name.trim() : null);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email.trim());
    }
    if (data.contact_number !== undefined) {
      fields.push('contact_number = ?');
      values.push(data.contact_number.trim());
    }
    if (data.date_of_birth !== undefined) {
      fields.push('date_of_birth = ?');
      values.push(data.date_of_birth.trim());
    }
    if (data.gender !== undefined) {
      fields.push('gender = ?');
      values.push(data.gender.trim());
    }
    if (data.address !== undefined) {
      fields.push('address = ?');
      values.push(data.address.trim());
    }
    if (data.program !== undefined) {
      fields.push('program = ?');
      values.push(data.program.trim());
    }
    if (data.year_level !== undefined) {
      fields.push('year_level = ?');
      values.push(data.year_level);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.user_id !== undefined) {
      fields.push('user_id = ?');
      values.push(data.user_id);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    this.provider.execute(
      `UPDATE students SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  public linkUser(studentId: string, userId: number): boolean {
    const res = this.provider.execute(
      `UPDATE students SET user_id = ?, updated_at = ? WHERE student_id = ?`,
      [userId, new Date().toISOString(), studentId.trim()]
    );
    return res.changes > 0;
  }
}
