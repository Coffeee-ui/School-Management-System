import { StudentRepository } from '../repositories/studentRepository.js';
import { Student } from '../models/types.js';
import {
  isValidStudentId,
  isValidContactNumber,
  isValidEmail,
  isValidCalendarDate,
} from '../utils/validation.js';

export class StudentService {
  private studentRepo: StudentRepository;

  constructor(studentRepo?: StudentRepository) {
    this.studentRepo = studentRepo || new StudentRepository();
  }

  public getAll(): Student[] {
    return this.studentRepo.findAll('last_name ASC, first_name ASC');
  }

  public getById(id: number): Student | null {
    return this.studentRepo.findById(id);
  }

  public getByStudentId(studentId: string): Student | null {
    return this.studentRepo.findByStudentId(studentId);
  }

  public getByUserId(userId: number): Student | null {
    return this.studentRepo.findByUserId(userId);
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
  }): Student {
    if (!isValidStudentId(data.student_id)) {
      throw new Error('Student ID must match format STU-YYYY-XXXX');
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

    const existingId = this.studentRepo.findByStudentId(data.student_id);
    if (existingId) {
      throw new Error(`Student ID ${data.student_id} already exists`);
    }

    const existingEmail = this.studentRepo.findByEmail(data.email);
    if (existingEmail) {
      throw new Error(`Email ${data.email} is already registered to another student`);
    }

    return this.studentRepo.create(data);
  }

  public update(id: number, data: Partial<Student>): Student | null {
    const existing = this.studentRepo.findById(id);
    if (!existing) {
      throw new Error('Student not found');
    }

    if (data.student_id && data.student_id !== existing.student_id) {
      if (!isValidStudentId(data.student_id)) {
        throw new Error('Student ID must match format STU-YYYY-XXXX');
      }
      const duplicate = this.studentRepo.findByStudentId(data.student_id);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Student ID ${data.student_id} already exists`);
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
      const duplicate = this.studentRepo.findByEmail(data.email);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Email ${data.email} is already registered to another student`);
      }
    }

    if (data.date_of_birth) {
      if (!isValidCalendarDate(data.date_of_birth)) {
        throw new Error('Date of birth must be a valid calendar date in YYYY-MM-DD format');
      }
    }

    return this.studentRepo.update(id, data);
  }

  public delete(id: number): boolean {
    return this.studentRepo.delete(id);
  }
}
