import { EnrollmentRepository } from '../repositories/enrollmentRepository.js';
import { StudentRepository } from '../repositories/studentRepository.js';
import { CourseRepository } from '../repositories/courseRepository.js';
import { Enrollment, EnrollmentStatus } from '../models/types.js';
import { isValidStudentId } from '../utils/validation.js';

export class EnrollmentService {
  private enrollmentRepo: EnrollmentRepository;
  private studentRepo: StudentRepository;
  private courseRepo: CourseRepository;

  constructor(
    enrollmentRepo?: EnrollmentRepository,
    studentRepo?: StudentRepository,
    courseRepo?: CourseRepository
  ) {
    this.enrollmentRepo = enrollmentRepo || new EnrollmentRepository();
    this.studentRepo = studentRepo || new StudentRepository();
    this.courseRepo = courseRepo || new CourseRepository();
  }

  public getAll(): Enrollment[] {
    return this.enrollmentRepo.findAllWithDetails();
  }

  public getById(id: number): Enrollment | null {
    return this.enrollmentRepo.findByIdWithDetails(id);
  }

  public getByStudentId(studentId: string): Enrollment[] {
    return this.enrollmentRepo.findByStudentId(studentId);
  }

  public create(data: {
    student_id: string;
    course_id: number;
    schedule_id?: number | null;
    academic_year: string;
    semester: string;
    status?: EnrollmentStatus;
  }): Enrollment {
    if (!isValidStudentId(data.student_id)) {
      throw new Error('Student ID must match format STU-YYYY-XXXX');
    }

    const student = this.studentRepo.findByStudentId(data.student_id);
    if (!student) {
      throw new Error(`Student ${data.student_id} does not exist`);
    }

    const course = this.courseRepo.findById(data.course_id);
    if (!course) {
      throw new Error(`Course with ID ${data.course_id} does not exist`);
    }

    const existing = this.enrollmentRepo.findExisting(
      data.student_id,
      data.course_id,
      data.academic_year,
      data.semester
    );
    if (existing) {
      throw new Error(`Student ${data.student_id} is already enrolled in ${course.course_code} for ${data.semester} ${data.academic_year}`);
    }

    return this.enrollmentRepo.create(data);
  }

  public update(id: number, data: Partial<Enrollment>): Enrollment | null {
    const existing = this.enrollmentRepo.findById(id);
    if (!existing) {
      throw new Error('Enrollment record not found');
    }

    return this.enrollmentRepo.update(id, data);
  }

  public delete(id: number): boolean {
    return this.enrollmentRepo.delete(id);
  }
}
