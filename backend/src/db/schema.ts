import { IDatabaseProvider } from './databaseProvider.js';

export function initializeDatabaseSchema(provider: IDatabaseProvider): void {
  provider.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'employee', 'hr', 'registrar', 'admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
      student_id TEXT UNIQUE,
      employee_id TEXT UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      middle_name TEXT,
      email TEXT UNIQUE NOT NULL,
      contact_number TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      gender TEXT NOT NULL,
      address TEXT NOT NULL,
      program TEXT NOT NULL,
      year_level INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'enrolled' CHECK(status IN ('enrolled', 'inactive', 'graduated', 'dropped')),
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      middle_name TEXT,
      email TEXT UNIQUE NOT NULL,
      contact_number TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      gender TEXT NOT NULL,
      hire_date TEXT NOT NULL,
      position TEXT NOT NULL,
      department TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'on_leave', 'terminated')),
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_code TEXT UNIQUE NOT NULL,
      course_name TEXT NOT NULL,
      description TEXT,
      credits INTEGER NOT NULL DEFAULT 3,
      department TEXT NOT NULL,
      semester TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_type TEXT NOT NULL CHECK(schedule_type IN ('teaching', 'security_shift', 'office')),
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      employee_id TEXT NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      semester TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
      academic_year TEXT NOT NULL,
      semester TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'enrolled' CHECK(status IN ('enrolled', 'dropped', 'completed')),
      enrolled_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(student_id, course_id, academic_year, semester)
    );

    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enrollment_id INTEGER UNIQUE NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      grade REAL NOT NULL,
      remarks TEXT NOT NULL,
      encoded_by TEXT NOT NULL,
      encoded_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_activity_at TEXT NOT NULL,
      ended_at TEXT,
      end_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      details TEXT,
      ip_address TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    -- Performance and integrity indexes
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
    CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
    CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
    CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
    CREATE INDEX IF NOT EXISTS idx_courses_course_code ON courses(course_code);
    CREATE INDEX IF NOT EXISTS idx_schedules_employee_id ON schedules(employee_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_course_id ON schedules(course_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
    CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
    CREATE INDEX IF NOT EXISTS idx_grades_enrollment_id ON grades(enrollment_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
  `);
}
