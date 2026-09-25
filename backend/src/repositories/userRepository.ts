import { BaseRepository } from './baseRepository.js';
import { User, SafeUser } from '../models/types.js';
import { IDatabaseProvider } from '../db/databaseProvider.js';

export class UserRepository extends BaseRepository<User> {
  constructor(provider?: IDatabaseProvider) {
    super('users', provider);
  }

  public findByIdentifier(identifier: string): User | null {
    const trimmed = identifier.trim();
    return this.provider.queryOne<User>(
      `SELECT * FROM users 
       WHERE username = ? OR email = ? OR student_id = ? OR employee_id = ?
       LIMIT 1`,
      [trimmed, trimmed, trimmed, trimmed]
    );
  }

  public findByUsername(username: string): User | null {
    return this.provider.queryOne<User>(
      `SELECT * FROM users WHERE username = ? LIMIT 1`,
      [username.trim()]
    );
  }

  public findByEmail(email: string): User | null {
    return this.provider.queryOne<User>(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email.trim()]
    );
  }

  public findByStudentId(studentId: string): User | null {
    return this.provider.queryOne<User>(
      `SELECT * FROM users WHERE student_id = ? LIMIT 1`,
      [studentId.trim()]
    );
  }

  public findByEmployeeId(employeeId: string): User | null {
    return this.provider.queryOne<User>(
      `SELECT * FROM users WHERE employee_id = ? LIMIT 1`,
      [employeeId.trim()]
    );
  }

  public create(data: {
    username: string;
    email: string;
    password_hash: string;
    role: string;
    status?: string;
    student_id?: string | null;
    employee_id?: string | null;
  }): User {
    const now = new Date().toISOString();
    const result = this.provider.execute(
      `INSERT INTO users (username, email, password_hash, role, status, student_id, employee_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.username.trim(),
        data.email.trim(),
        data.password_hash,
        data.role,
        data.status || 'active',
        data.student_id || null,
        data.employee_id || null,
        now,
        now,
      ]
    );

    const created = this.findById(Number(result.lastInsertRowid));
    if (!created) {
      throw new Error('Failed to create user record');
    }
    return created;
  }

  public update(id: number, data: Partial<User>): User | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.username !== undefined) {
      fields.push('username = ?');
      values.push(data.username.trim());
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email.trim());
    }
    if (data.password_hash !== undefined) {
      fields.push('password_hash = ?');
      values.push(data.password_hash);
    }
    if (data.role !== undefined) {
      fields.push('role = ?');
      values.push(data.role);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.student_id !== undefined) {
      fields.push('student_id = ?');
      values.push(data.student_id);
    }
    if (data.employee_id !== undefined) {
      fields.push('employee_id = ?');
      values.push(data.employee_id);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    this.provider.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  public findSafeAll(): SafeUser[] {
    return this.provider.query<SafeUser>(
      `SELECT id, username, email, role, status, student_id, employee_id, created_at, updated_at 
       FROM users ORDER BY id ASC`
    );
  }

  public findSafeById(id: number): SafeUser | null {
    return this.provider.queryOne<SafeUser>(
      `SELECT id, username, email, role, status, student_id, employee_id, created_at, updated_at 
       FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
  }
}
