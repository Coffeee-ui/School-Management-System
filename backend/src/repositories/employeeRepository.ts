import { BaseRepository } from './baseRepository.js';
import { Employee } from '../models/types.js';
import { IDatabaseProvider } from '../db/databaseProvider.js';

export class EmployeeRepository extends BaseRepository<Employee> {
  constructor(provider?: IDatabaseProvider) {
    super('employees', provider);
  }

  public findByEmployeeId(employeeId: string): Employee | null {
    return this.provider.queryOne<Employee>(
      `SELECT * FROM employees WHERE employee_id = ? LIMIT 1`,
      [employeeId.trim()]
    );
  }

  public findByUserId(userId: number): Employee | null {
    return this.provider.queryOne<Employee>(
      `SELECT * FROM employees WHERE user_id = ? LIMIT 1`,
      [userId]
    );
  }

  public findByEmail(email: string): Employee | null {
    return this.provider.queryOne<Employee>(
      `SELECT * FROM employees WHERE email = ? LIMIT 1`,
      [email.trim()]
    );
  }

  public create(data: {
    employee_id: string;
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    email: string;
    contact_number: string;
    date_of_birth: string;
    gender: string;
    hire_date: string;
    position: string;
    department: string;
    status?: string;
    user_id?: number | null;
  }): Employee {
    const now = new Date().toISOString();
    const result = this.provider.execute(
      `INSERT INTO employees (
        employee_id, first_name, last_name, middle_name, email,
        contact_number, date_of_birth, gender, hire_date, position,
        department, status, user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.employee_id.trim(),
        data.first_name.trim(),
        data.last_name.trim(),
        data.middle_name?.trim() || null,
        data.email.trim(),
        data.contact_number.trim(),
        data.date_of_birth.trim(),
        data.gender.trim(),
        data.hire_date.trim(),
        data.position.trim(),
        data.department.trim(),
        data.status || 'active',
        data.user_id || null,
        now,
        now,
      ]
    );

    const created = this.findById(Number(result.lastInsertRowid));
    if (!created) {
      throw new Error('Failed to create employee record');
    }
    return created;
  }

  public update(id: number, data: Partial<Employee>): Employee | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.employee_id !== undefined) {
      fields.push('employee_id = ?');
      values.push(data.employee_id.trim());
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
    if (data.hire_date !== undefined) {
      fields.push('hire_date = ?');
      values.push(data.hire_date.trim());
    }
    if (data.position !== undefined) {
      fields.push('position = ?');
      values.push(data.position.trim());
    }
    if (data.department !== undefined) {
      fields.push('department = ?');
      values.push(data.department.trim());
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
      `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  public linkUser(employeeId: string, userId: number): boolean {
    const res = this.provider.execute(
      `UPDATE employees SET user_id = ?, updated_at = ? WHERE employee_id = ?`,
      [userId, new Date().toISOString(), employeeId.trim()]
    );
    return res.changes > 0;
  }
}
