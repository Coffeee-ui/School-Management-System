import { GradeRepository } from '../repositories/gradeRepository.js';
import { EnrollmentRepository } from '../repositories/enrollmentRepository.js';
import { Grade } from '../models/types.js';
import { isValidGrade, getGradeRemarks, isValidStudentId } from '../utils/validation.js';

export class GradeService {
  private gradeRepo: GradeRepository;
  private enrollmentRepo: EnrollmentRepository;

  constructor(
    gradeRepo?: GradeRepository,
    enrollmentRepo?: EnrollmentRepository
  ) {
    this.gradeRepo = gradeRepo || new GradeRepository();
    this.enrollmentRepo = enrollmentRepo || new EnrollmentRepository();
  }

  public getAll(): Grade[] {
    return this.gradeRepo.findAllWithDetails();
  }

  public getById(id: number): Grade | null {
    return this.gradeRepo.findByIdWithDetails(id);
  }

  public getByStudentId(studentId: string): Grade[] {
    return this.gradeRepo.findByStudentId(studentId);
  }

  public getStudentGwa(studentId: string): { gwa: number; totalCredits: number; courseCount: number } {
    if (!isValidStudentId(studentId)) {
      throw new Error('Student ID must match format STU-YYYY-XXXX');
    }
    return this.gradeRepo.calculateGwa(studentId);
  }

  public create(data: {
    enrollment_id: number;
    grade: number;
    encoded_by: string;
  }): Grade {
    const numericGrade = Number(data.grade);
    if (!isValidGrade(numericGrade)) {
      throw new Error('Grade must be a number between 1.00 and 5.00');
    }

    const enrollment = this.enrollmentRepo.findById(data.enrollment_id);
    if (!enrollment) {
      throw new Error(`Enrollment record ${data.enrollment_id} not found`);
    }

    const existingGrade = this.gradeRepo.findByEnrollmentId(data.enrollment_id);
    if (existingGrade) {
      throw new Error(`A grade has already been encoded for enrollment ${data.enrollment_id}`);
    }

    const remarks = getGradeRemarks(numericGrade);

    return this.gradeRepo.create({
      enrollment_id: data.enrollment_id,
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      grade: numericGrade,
      remarks,
      encoded_by: data.encoded_by,
    });
  }

  public update(id: number, data: { grade?: number; encoded_by?: string }): Grade | null {
    const existing = this.gradeRepo.findById(id);
    if (!existing) {
      throw new Error('Grade record not found');
    }

    const updateData: Partial<Grade> = {};
    if (data.grade !== undefined) {
      const numericGrade = Number(data.grade);
      if (!isValidGrade(numericGrade)) {
        throw new Error('Grade must be a number between 1.00 and 5.00');
      }
      updateData.grade = numericGrade;
      updateData.remarks = getGradeRemarks(numericGrade);
    }
    if (data.encoded_by !== undefined) {
      updateData.encoded_by = data.encoded_by;
    }

    return this.gradeRepo.update(id, updateData);
  }

  public delete(id: number): boolean {
    return this.gradeRepo.delete(id);
  }
}
