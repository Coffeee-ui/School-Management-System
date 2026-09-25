import { ScheduleRepository } from '../repositories/scheduleRepository.js';
import { Schedule, ScheduleType } from '../models/types.js';
import {
  isValidTime,
  isStartTimeBeforeEndTime,
  isValidEmployeeId,
} from '../utils/validation.js';

export class ScheduleService {
  private scheduleRepo: ScheduleRepository;

  constructor(scheduleRepo?: ScheduleRepository) {
    this.scheduleRepo = scheduleRepo || new ScheduleRepository();
  }

  public getAll(): Schedule[] {
    return this.scheduleRepo.findAllWithDetails();
  }

  public getById(id: number): Schedule | null {
    return this.scheduleRepo.findByIdWithDetails(id);
  }

  public getByEmployeeId(employeeId: string): Schedule[] {
    return this.scheduleRepo.findByEmployeeId(employeeId);
  }

  public create(data: {
    schedule_type: ScheduleType;
    course_id?: number | null;
    employee_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room: string;
    academic_year: string;
    semester: string;
  }): Schedule {
    if (!isValidEmployeeId(data.employee_id)) {
      throw new Error('Employee ID must match format EMP-YYYY-XXXX');
    }
    if (!isValidTime(data.start_time) || !isValidTime(data.end_time)) {
      throw new Error('Times must be in 24-hour HH:MM format (00:00 - 23:59)');
    }
    if (!isStartTimeBeforeEndTime(data.start_time, data.end_time)) {
      throw new Error('Schedule start time must occur before end time');
    }

    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(data.day_of_week)) {
      throw new Error('Invalid day of week');
    }

    // Check employee schedule conflict
    const hasEmployeeConflict = this.scheduleRepo.checkEmployeeConflict(
      data.employee_id,
      data.day_of_week,
      data.start_time,
      data.end_time
    );
    if (hasEmployeeConflict) {
      throw new Error(`Schedule conflict: Employee ${data.employee_id} is already scheduled on ${data.day_of_week} during this time`);
    }

    // Check room schedule conflict
    const hasRoomConflict = this.scheduleRepo.checkRoomConflict(
      data.room,
      data.day_of_week,
      data.start_time,
      data.end_time
    );
    if (hasRoomConflict) {
      throw new Error(`Schedule conflict: Room ${data.room} is already booked on ${data.day_of_week} during this time`);
    }

    return this.scheduleRepo.create(data);
  }

  public update(id: number, data: Partial<Schedule>): Schedule | null {
    const existing = this.scheduleRepo.findById(id);
    if (!existing) {
      throw new Error('Schedule not found');
    }

    const employeeId = data.employee_id || existing.employee_id;
    const dayOfWeek = data.day_of_week || existing.day_of_week;
    const startTime = data.start_time || existing.start_time;
    const endTime = data.end_time || existing.end_time;
    const room = data.room || existing.room;

    if (data.start_time || data.end_time) {
      if (!isValidTime(startTime) || !isValidTime(endTime)) {
        throw new Error('Times must be in 24-hour HH:MM format (00:00 - 23:59)');
      }
      if (!isStartTimeBeforeEndTime(startTime, endTime)) {
        throw new Error('Schedule start time must occur before end time');
      }
    }

    // Conflict check
    if (this.scheduleRepo.checkEmployeeConflict(employeeId, dayOfWeek, startTime, endTime, id)) {
      throw new Error(`Schedule conflict: Employee ${employeeId} is already scheduled on ${dayOfWeek} during this time`);
    }

    if (this.scheduleRepo.checkRoomConflict(room, dayOfWeek, startTime, endTime, id)) {
      throw new Error(`Schedule conflict: Room ${room} is already booked on ${dayOfWeek} during this time`);
    }

    return this.scheduleRepo.update(id, data);
  }

  public delete(id: number): boolean {
    return this.scheduleRepo.delete(id);
  }
}
