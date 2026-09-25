import { CourseRepository } from '../repositories/courseRepository.js';
import { Course } from '../models/types.js';

export class CourseService {
  private courseRepo: CourseRepository;

  constructor(courseRepo?: CourseRepository) {
    this.courseRepo = courseRepo || new CourseRepository();
  }

  public getAll(): Course[] {
    return this.courseRepo.findAll('department ASC, course_code ASC');
  }

  public getById(id: number): Course | null {
    return this.courseRepo.findById(id);
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
    const code = data.course_code.trim().toUpperCase();
    if (!code) {
      throw new Error('Course code is required');
    }
    if (!data.course_name?.trim()) {
      throw new Error('Course name is required');
    }
    if (!data.department?.trim()) {
      throw new Error('Department is required');
    }
    if (!data.semester?.trim()) {
      throw new Error('Semester is required');
    }
    if (!data.academic_year?.trim()) {
      throw new Error('Academic year is required');
    }

    const existing = this.courseRepo.findByCode(code);
    if (existing) {
      throw new Error(`Course code ${code} already exists`);
    }

    return this.courseRepo.create(data);
  }

  public update(id: number, data: Partial<Course>): Course | null {
    const existing = this.courseRepo.findById(id);
    if (!existing) {
      throw new Error('Course not found');
    }

    if (data.course_code) {
      const code = data.course_code.trim().toUpperCase();
      if (code !== existing.course_code) {
        const duplicate = this.courseRepo.findByCode(code);
        if (duplicate && duplicate.id !== id) {
          throw new Error(`Course code ${code} already exists`);
        }
      }
    }

    return this.courseRepo.update(id, data);
  }

  public delete(id: number): boolean {
    return this.courseRepo.delete(id);
  }
}
