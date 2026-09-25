import { EmployeeRepository } from '../repositories/employeeRepository.js';
import { Employee } from '../models/types.js';
import {
  isValidEmployeeId,
  isValidContactNumber,
  isValidEmail,
  isValidCalendarDate,
} from '../utils/validation.js';

export class EmployeeService {
  private employeeRepo: EmployeeRepository;

  constructor(employeeRepo?: EmployeeRepository) {
    this.employeeRepo = employeeRepo || new EmployeeRepository();
  }

  public getAll(): Employee[] {
    return this.employeeRepo.findAll('department ASC, last_name ASC');
  }

  public getById(id: number): Employee | null {
    return this.employeeRepo.findById(id);
  }

  public getByEmployeeId(employeeId: string): Employee | null {
    return this.employeeRepo.findByEmployeeId(employeeId);
  }

  public getByUserId(userId: number): Employee | null {
    return this.employeeRepo.findByUserId(userId);
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
  }): Employee {
    if (!isValidEmployeeId(data.employee_id)) {
      throw new Error('Employee ID must match format EMP-YYYY-XXXX');
    }
    if (!isValidContactNumber(data.contact_number)) {
      throw new Error('Contact number must be exactly 11 digits starting with 09 (e.g. 09123456789)');
    }
    if (!isValidEmail(data.email)) {
      throw new Error('Invalid email address');
    }
    if (!isValidCalendarDate(data.date_of_birth)) {
      throw new Error('Date of birth must be a valid calendar date in YYYY-MM-DD format');
    }
    if (!isValidCalendarDate(data.hire_date)) {
      throw new Error('Hire date must be a valid calendar date in YYYY-MM-DD format');
    }

    const existingId = this.employeeRepo.findByEmployeeId(data.employee_id);
    if (existingId) {
      throw new Error(`Employee ID ${data.employee_id} already exists`);
    }

    const existingEmail = this.employeeRepo.findByEmail(data.email);
    if (existingEmail) {
      throw new Error(`Email ${data.email} is already registered to another employee`);
    }

    return this.employeeRepo.create(data);
  }

  public update(id: number, data: Partial<Employee>): Employee | null {
    const existing = this.employeeRepo.findById(id);
    if (!existing) {
      throw new Error('Employee not found');
    }

    if (data.employee_id && data.employee_id !== existing.employee_id) {
      if (!isValidEmployeeId(data.employee_id)) {
        throw new Error('Employee ID must match format EMP-YYYY-XXXX');
      }
      const duplicate = this.employeeRepo.findByEmployeeId(data.employee_id);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Employee ID ${data.employee_id} already exists`);
      }
    }

    if (data.contact_number) {
      if (!isValidContactNumber(data.contact_number)) {
        throw new Error('Contact number must be exactly 11 digits starting with 09 (e.g. 09123456789)');
      }
    }

    if (data.email && data.email !== existing.email) {
      if (!isValidEmail(data.email)) {
        throw new Error('Invalid email address');
      }
      const duplicate = this.employeeRepo.findByEmail(data.email);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Email ${data.email} is already registered to another employee`);
      }
    }

    if (data.date_of_birth) {
      if (!isValidCalendarDate(data.date_of_birth)) {
        throw new Error('Date of birth must be a valid calendar date in YYYY-MM-DD format');
      }
    }

    if (data.hire_date) {
      if (!isValidCalendarDate(data.hire_date)) {
        throw new Error('Hire date must be a valid calendar date in YYYY-MM-DD format');
      }
    }

    return this.employeeRepo.update(id, data);
  }

  public delete(id: number): boolean {
    return this.employeeRepo.delete(id);
  }
}
