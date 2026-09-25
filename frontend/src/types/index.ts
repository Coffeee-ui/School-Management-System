export type UserRole = 'student' | 'employee' | 'hr' | 'registrar' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type StudentStatus = 'enrolled' | 'inactive' | 'graduated' | 'dropped';
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export type ScheduleType = 'teaching' | 'security_shift' | 'office';
export type EnrollmentStatus = 'enrolled' | 'dropped' | 'completed';

export interface SafeUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  student_id: string | null;
  employee_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  contact_number: string;
  date_of_birth: string;
  gender: string;
  address: string;
  program: string;
  year_level: number;
  status: StudentStatus;
  user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  contact_number: string;
  date_of_birth: string;
  gender: string;
  hire_date: string;
  position: string;
  department: string;
  status: EmployeeStatus;
  user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  course_code: string;
  course_name: string;
  description: string | null;
  credits: number;
  department: string;
  semester: string;
  academic_year: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: number;
  schedule_type: ScheduleType;
  course_id: number | null;
  employee_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  academic_year: string;
  semester: string;
  created_at: string;
  updated_at: string;
  course_code?: string;
  course_name?: string;
  instructor_name?: string;
}

export interface Enrollment {
  id: number;
  student_id: string;
  course_id: number;
  schedule_id: number | null;
  academic_year: string;
  semester: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  created_at: string;
  updated_at: string;
  course_code?: string;
  course_name?: string;
  credits?: number;
  student_name?: string;
  room?: string;
  schedule_day?: string;
  start_time?: string;
  end_time?: string;
  instructor_name?: string;
}

export interface Grade {
  id: number;
  enrollment_id: number;
  student_id: string;
  course_id: number;
  grade: number;
  remarks: string;
  encoded_by: string;
  encoded_at: string;
  updated_at: string;
  course_code?: string;
  course_name?: string;
  credits?: number;
  student_name?: string;
}

export interface GwaResult {
  gwa: number;
  totalCredits: number;
  courseCount: number;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  username: string;
  role: string;
  action: string;
  resource: string;
  details: string | null;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface AuditStats {
  totalLogs: number;
  actionCounts: { action: string; count: number }[];
  resourceCounts: { resource: string; count: number }[];
  recentActivityCount: number;
}

export interface DemoPreset {
  role: UserRole;
  title: string;
  username: string;
  password: string;
  description: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}
