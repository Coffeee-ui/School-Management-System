import bcrypt from 'bcrypt';
import { SqliteProvider } from '../src/db/sqliteProvider.js';
import { initializeDatabaseSchema } from '../src/db/schema.js';
import { getGradeRemarks } from '../src/utils/validation.js';

export async function seedDatabase(force: boolean = false): Promise<void> {
  const provider = SqliteProvider.getInstance();
  initializeDatabaseSchema(provider);

  const existingUsers = provider.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
  if (existingUsers && existingUsers.count > 0 && !force) {
    console.log(`Database already contains ${existingUsers.count} users. Skipping seeding (use force=true to re-seed).`);
    return;
  }

  console.log('Seeding Apex Institute database with standardized institutional records...');

  if (force) {
    provider.exec(`
      DELETE FROM audit_logs;
      DELETE FROM sessions;
      DELETE FROM grades;
      DELETE FROM enrollments;
      DELETE FROM schedules;
      DELETE FROM courses;
      DELETE FROM students;
      DELETE FROM employees;
      DELETE FROM users;
    `);
  }

  const now = new Date().toISOString();
  const defaultPasswordHash = await bcrypt.hash('Apex2026!', 10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const regPasswordHash = await bcrypt.hash('RegistrarPassword123!', 10);
  const hrPasswordHash = await bcrypt.hash('HrPassword123!', 10);
  const facultyPasswordHash = await bcrypt.hash('FacultyPassword123!', 10);
  const studentPasswordHash = await bcrypt.hash('StudentPassword123!', 10);

  // 1. Employees (22 employees as specified in Section 14)
  const employeesData = [
    // Administration
    { empId: 'EMP-2024-0001', fn: 'Arthur', ln: 'Pendelton', mn: 'C', email: 'arthur.pendelton@apex.edu', phone: '09171112201', dob: '1975-04-12', gender: 'Male', hire: '2015-06-01', pos: 'Institute President', dept: 'Administration' },
    { empId: 'EMP-2024-0002', fn: 'Eleanor', ln: 'Vance', mn: 'M', email: 'eleanor.vance@apex.edu', phone: '09171112202', dob: '1980-08-23', gender: 'Female', hire: '2017-08-15', pos: 'Vice President of Academic Affairs', dept: 'Administration' },
    // HR Department
    { empId: 'EMP-2024-0003', fn: 'Helena', ln: 'Reyes', mn: 'S', email: 'helena.reyes@apex.edu', phone: '09181112203', dob: '1984-11-05', gender: 'Female', hire: '2018-03-10', pos: 'HR Director', dept: 'Human Resources' },
    { empId: 'EMP-2024-0004', fn: 'Marcus', ln: 'Chavez', mn: 'D', email: 'marcus.chavez@apex.edu', phone: '09181112204', dob: '1990-02-17', gender: 'Male', hire: '2020-01-15', pos: 'HR Specialist', dept: 'Human Resources' },
    // Registrar Office
    { empId: 'EMP-2024-0005', fn: 'Reginald', ln: 'Torres', mn: 'B', email: 'reginald.torres@apex.edu', phone: '09191112205', dob: '1982-05-19', gender: 'Male', hire: '2016-09-01', pos: 'Head Registrar', dept: 'Registrar Office' },
    { empId: 'EMP-2024-0006', fn: 'Patricia', ln: 'Santos', mn: 'L', email: 'patricia.santos@apex.edu', phone: '09191112206', dob: '1988-07-28', gender: 'Female', hire: '2019-06-15', pos: 'Assistant Registrar', dept: 'Registrar Office' },
    // College of Computer Studies Faculty
    { empId: 'EMP-2024-0007', fn: 'Alan', ln: 'Smith', mn: 'T', email: 'alan.smith@apex.edu', phone: '09201112207', dob: '1985-06-23', gender: 'Male', hire: '2018-08-01', pos: 'Associate Professor', dept: 'College of Computer Studies' },
    { empId: 'EMP-2024-0008', fn: 'Grace', ln: 'Hopper', mn: 'M', email: 'grace.hopper@apex.edu', phone: '09201112208', dob: '1986-12-09', gender: 'Female', hire: '2019-01-10', pos: 'Professor', dept: 'College of Computer Studies' },
    { empId: 'EMP-2024-0009', fn: 'Dennis', ln: 'Ritchie', mn: 'M', email: 'dennis.ritchie@apex.edu', phone: '09201112209', dob: '1983-09-09', gender: 'Male', hire: '2017-07-15', pos: 'Senior Lecturer', dept: 'College of Computer Studies' },
    { empId: 'EMP-2024-0010', fn: 'Ada', ln: 'Lovelace', mn: 'A', email: 'ada.lovelace@apex.edu', phone: '09201112210', dob: '1989-12-10', gender: 'Female', hire: '2021-08-16', pos: 'Assistant Professor', dept: 'College of Computer Studies' },
    // College of Engineering Faculty
    { empId: 'EMP-2024-0011', fn: 'Nikola', ln: 'Tesla', mn: 'E', email: 'nikola.tesla@apex.edu', phone: '09211112211', dob: '1981-07-10', gender: 'Male', hire: '2016-01-05', pos: 'Professor', dept: 'College of Engineering' },
    { empId: 'EMP-2024-0012', fn: 'Marie', ln: 'Curie', mn: 'S', email: 'marie.curie@apex.edu', phone: '09211112212', dob: '1983-11-07', gender: 'Female', hire: '2017-02-01', pos: 'Associate Professor', dept: 'College of Engineering' },
    { empId: 'EMP-2024-0013', fn: 'Thomas', ln: 'Edison', mn: 'A', email: 'thomas.edison@apex.edu', phone: '09211112213', dob: '1980-02-11', gender: 'Male', hire: '2015-11-20', pos: 'Lecturer', dept: 'College of Engineering' },
    // College of Business Faculty
    { empId: 'EMP-2024-0014', fn: 'Warren', ln: 'Buffett', mn: 'E', email: 'warren.buffett@apex.edu', phone: '09221112214', dob: '1978-08-30', gender: 'Male', hire: '2014-06-01', pos: 'Professor', dept: 'College of Business' },
    { empId: 'EMP-2024-0015', fn: 'Janet', ln: 'Yellen', mn: 'L', email: 'janet.yellen@apex.edu', phone: '09221112215', dob: '1982-08-13', gender: 'Female', hire: '2018-09-01', pos: 'Associate Professor', dept: 'College of Business' },
    // Campus Security Office (Security Shifts)
    { empId: 'EMP-2024-0016', fn: 'Rodrigo', ln: 'Reyes', mn: 'F', email: 'rodrigo.reyes@apex.edu', phone: '09231112216', dob: '1987-03-15', gender: 'Male', hire: '2019-05-10', pos: 'Security Officer', dept: 'Campus Security Office' },
    { empId: 'EMP-2024-0017', fn: 'Danilo', ln: 'Cruz', mn: 'G', email: 'danilo.cruz@apex.edu', phone: '09231112217', dob: '1989-10-22', gender: 'Male', hire: '2020-02-15', pos: 'Security Guard', dept: 'Campus Security Office' },
    { empId: 'EMP-2024-0018', fn: 'Nestor', ln: 'Aquino', mn: 'V', email: 'nestor.aquino@apex.edu', phone: '09231112218', dob: '1991-01-30', gender: 'Male', hire: '2021-04-01', pos: 'Security Guard', dept: 'Campus Security Office' },
    // General Services & Staff
    { empId: 'EMP-2024-0019', fn: 'Beatriz', ln: 'Luna', mn: 'C', email: 'beatriz.luna@apex.edu', phone: '09241112219', dob: '1992-06-18', gender: 'Female', hire: '2021-07-01', pos: 'Office Assistant', dept: 'Administration' },
    { empId: 'EMP-2024-0020', fn: 'Carlos', ln: 'Mendoza', mn: 'P', email: 'carlos.mendoza@apex.edu', phone: '09241112220', dob: '1993-09-14', gender: 'Male', hire: '2022-01-10', pos: 'IT Support Specialist', dept: 'College of Computer Studies' },
    { empId: 'EMP-2024-0021', fn: 'Diana', ln: 'Flores', mn: 'R', email: 'diana.flores@apex.edu', phone: '09251112221', dob: '1994-04-05', gender: 'Female', hire: '2022-06-15', pos: 'Records Clerk', dept: 'Registrar Office' },
    { empId: 'EMP-2024-0022', fn: 'Ferdinand', ln: 'Tan', mn: 'H', email: 'ferdinand.tan@apex.edu', phone: '09251112222', dob: '1988-11-29', gender: 'Male', hire: '2019-11-01', pos: 'HR Assistant', dept: 'Human Resources' },
  ];

  for (const emp of employeesData) {
    provider.execute(
      `INSERT INTO employees (employee_id, first_name, last_name, middle_name, email, contact_number, date_of_birth, gender, hire_date, position, department, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [emp.empId, emp.fn, emp.ln, emp.mn, emp.email, emp.phone, emp.dob, emp.gender, emp.hire, emp.pos, emp.dept, now, now]
    );
  }

  // 2. Students (6 students as specified in Section 14)
  const studentsData = [
    { stuId: 'STU-2024-0001', fn: 'John', ln: 'Doe', mn: 'Alexander', email: 'john.doe@gmail.com', phone: '09261112231', dob: '2004-03-15', gender: 'Male', addr: '123 Rizal Ave, Manila', prog: 'BS Computer Science', yr: 3 },
    { stuId: 'STU-2024-0002', fn: 'Jane', ln: 'Smith', mn: 'Marie', email: 'jane.smith@gmail.com', phone: '09261112232', dob: '2005-07-22', gender: 'Female', addr: '456 Quezon Blvd, Quezon City', prog: 'BS Information Technology', yr: 2 },
    { stuId: 'STU-2024-0003', fn: 'Michael', ln: 'Brown', mn: 'James', email: 'michael.brown@gmail.com', phone: '09261112233', dob: '2003-11-08', gender: 'Male', addr: '789 Taft Ave, Pasay', prog: 'BS Computer Science', yr: 4 },
    { stuId: 'STU-2024-0004', fn: 'Emily', ln: 'Davis', mn: 'Rose', email: 'emily.davis@gmail.com', phone: '09271112234', dob: '2006-01-30', gender: 'Female', addr: '101 Ortigas Ave, Pasig', prog: 'BS Civil Engineering', yr: 1 },
    { stuId: 'STU-2024-0005', fn: 'Robert', ln: 'Wilson', mn: 'Edward', email: 'robert.wilson@gmail.com', phone: '09271112235', dob: '2004-09-14', gender: 'Male', addr: '202 Shaw Blvd, Mandaluyong', prog: 'BS Business Administration', yr: 3 },
    { stuId: 'STU-2024-0006', fn: 'Sophia', ln: 'Taylor', mn: 'Grace', email: 'sophia.taylor@gmail.com', phone: '09271112236', dob: '2005-04-18', gender: 'Female', addr: '303 Makati Ave, Makati', prog: 'BS Information Technology', yr: 2 },
  ];

  for (const stu of studentsData) {
    provider.execute(
      `INSERT INTO students (student_id, first_name, last_name, middle_name, email, contact_number, date_of_birth, gender, address, program, year_level, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'enrolled', ?, ?)`,
      [stu.stuId, stu.fn, stu.ln, stu.mn, stu.email, stu.phone, stu.dob, stu.gender, stu.addr, stu.prog, stu.yr, now, now]
    );
  }

  // 3. Courses (8 courses as specified in Section 14)
  const coursesData = [
    { code: 'CS101', name: 'Introduction to Computer Science', desc: 'Fundamental concepts of computing and problem solving.', credits: 3, dept: 'College of Computer Studies', sem: '1st Semester', ay: '2026-2027' },
    { code: 'CS102', name: 'Data Structures and Algorithms', desc: 'Design, analysis, and implementation of algorithms and data structures.', credits: 3, dept: 'College of Computer Studies', sem: '1st Semester', ay: '2026-2027' },
    { code: 'IT201', name: 'Web Systems and Technologies', desc: 'Modern full-stack web development methodologies.', credits: 3, dept: 'College of Computer Studies', sem: '1st Semester', ay: '2026-2027' },
    { code: 'IT204', name: 'Database Management Systems', desc: 'Relational database architecture, SQL, and indexing.', credits: 3, dept: 'College of Computer Studies', sem: '1st Semester', ay: '2026-2027' },
    { code: 'ENG101', name: 'Calculus for Engineers', desc: 'Differential and integral calculus with engineering applications.', credits: 4, dept: 'College of Engineering', sem: '1st Semester', ay: '2026-2027' },
    { code: 'ENG105', name: 'Circuit Analysis', desc: 'Analysis of electrical circuits, ohms law, Kirchhoff laws.', credits: 3, dept: 'College of Engineering', sem: '1st Semester', ay: '2026-2027' },
    { code: 'BA101', name: 'Principles of Management', desc: 'Introduction to organizational theory and modern management.', credits: 3, dept: 'College of Business', sem: '1st Semester', ay: '2026-2027' },
    { code: 'BA202', name: 'Financial Accounting', desc: 'Basic accounting principles, ledgers, and financial reporting.', credits: 3, dept: 'College of Business', sem: '1st Semester', ay: '2026-2027' },
  ];

  for (const c of coursesData) {
    provider.execute(
      `INSERT INTO courses (course_code, course_name, description, credits, department, semester, academic_year, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [c.code, c.name, c.desc, c.credits, c.dept, c.sem, c.ay, now, now]
    );
  }

  // 4. Schedules (9 schedules: teaching, security shift, office schedules)
  // Get course IDs
  const cs101 = provider.queryOne<{ id: number }>('SELECT id FROM courses WHERE course_code = ?', ['CS101'])!.id;
  const cs102 = provider.queryOne<{ id: number }>('SELECT id FROM courses WHERE course_code = ?', ['CS102'])!.id;
  const it201 = provider.queryOne<{ id: number }>('SELECT id FROM courses WHERE course_code = ?', ['IT201'])!.id;
  const it204 = provider.queryOne<{ id: number }>('SELECT id FROM courses WHERE course_code = ?', ['IT204'])!.id;
  const eng101 = provider.queryOne<{ id: number }>('SELECT id FROM courses WHERE course_code = ?', ['ENG101'])!.id;
  const ba101 = provider.queryOne<{ id: number }>('SELECT id FROM courses WHERE course_code = ?', ['BA101'])!.id;

  const schedulesData = [
    // Teaching schedules
    { type: 'teaching', cid: cs101, empId: 'EMP-2024-0007', day: 'Monday', start: '08:00', end: '10:00', room: 'Computer Lab 1', ay: '2026-2027', sem: '1st Semester' },
    { type: 'teaching', cid: cs102, empId: 'EMP-2024-0008', day: 'Tuesday', start: '10:00', end: '12:00', room: 'Computer Lab 2', ay: '2026-2027', sem: '1st Semester' },
    { type: 'teaching', cid: it201, empId: 'EMP-2024-0009', day: 'Wednesday', start: '13:00', end: '15:00', room: 'Multimedia Room', ay: '2026-2027', sem: '1st Semester' },
    { type: 'teaching', cid: it204, empId: 'EMP-2024-0010', day: 'Thursday', start: '09:00', end: '11:00', room: 'Computer Lab 3', ay: '2026-2027', sem: '1st Semester' },
    { type: 'teaching', cid: eng101, empId: 'EMP-2024-0011', day: 'Friday', start: '08:00', end: '11:00', room: 'Lecture Hall A', ay: '2026-2027', sem: '1st Semester' },
    { type: 'teaching', cid: ba101, empId: 'EMP-2024-0014', day: 'Friday', start: '13:00', end: '15:00', room: 'Room 304', ay: '2026-2027', sem: '1st Semester' },
    // Security shifts
    { type: 'security_shift', cid: null, empId: 'EMP-2024-0016', day: 'Monday', start: '06:00', end: '14:00', room: 'Main Campus Gate 1', ay: '2026-2027', sem: '1st Semester' },
    { type: 'security_shift', cid: null, empId: 'EMP-2024-0017', day: 'Monday', start: '14:00', end: '22:00', room: 'East Wing Guard Post', ay: '2026-2027', sem: '1st Semester' },
    // Office duty schedule
    { type: 'office', cid: null, empId: 'EMP-2024-0005', day: 'Monday', start: '08:00', end: '17:00', room: 'Registrar Office Window 1', ay: '2026-2027', sem: '1st Semester' },
  ];

  for (const s of schedulesData) {
    provider.execute(
      `INSERT INTO schedules (schedule_type, course_id, employee_id, day_of_week, start_time, end_time, room, academic_year, semester, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.type, s.cid, s.empId, s.day, s.start, s.end, s.room, s.ay, s.sem, now, now]
    );
  }

  // 5. Enrollments (8 enrollments as specified in Section 14)
  const sch1 = provider.queryOne<{ id: number }>('SELECT id FROM schedules WHERE course_id = ?', [cs101])!.id;
  const sch2 = provider.queryOne<{ id: number }>('SELECT id FROM schedules WHERE course_id = ?', [cs102])!.id;
  const sch3 = provider.queryOne<{ id: number }>('SELECT id FROM schedules WHERE course_id = ?', [it201])!.id;
  const sch4 = provider.queryOne<{ id: number }>('SELECT id FROM schedules WHERE course_id = ?', [it204])!.id;
  const sch5 = provider.queryOne<{ id: number }>('SELECT id FROM schedules WHERE course_id = ?', [eng101])!.id;
  const sch6 = provider.queryOne<{ id: number }>('SELECT id FROM schedules WHERE course_id = ?', [ba101])!.id;

  const enrollmentsData = [
    { stuId: 'STU-2024-0001', cid: cs101, sid: sch1, ay: '2026-2027', sem: '1st Semester' },
    { stuId: 'STU-2024-0001', cid: cs102, sid: sch2, ay: '2026-2027', sem: '1st Semester' },
    { stuId: 'STU-2024-0001', cid: it201, sid: sch3, ay: '2026-2027', sem: '1st Semester' },
    { stuId: 'STU-2024-0002', cid: cs101, sid: sch1, ay: '2026-2027', sem: '1st Semester' },
    { stuId: 'STU-2024-0002', cid: it204, sid: sch4, ay: '2026-2027', sem: '1st Semester' },
    { stuId: 'STU-2024-0003', cid: cs102, sid: sch2, ay: '2026-2027', sem: '1st Semester' },
    { stuId: 'STU-2024-0004', cid: eng101, sid: sch5, ay: '2026-2027', sem: '1st Semester' },
    { stuId: 'STU-2024-0005', cid: ba101, sid: sch6, ay: '2026-2027', sem: '1st Semester' },
  ];

  for (const e of enrollmentsData) {
    provider.execute(
      `INSERT INTO enrollments (student_id, course_id, schedule_id, academic_year, semester, status, enrolled_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'enrolled', ?, ?, ?)`,
      [e.stuId, e.cid, e.sid, e.ay, e.sem, now, now, now]
    );
  }

  // 6. Grades (8 grades corresponding to the enrollments)
  const enrollments = provider.query<{ id: number; student_id: string; course_id: number }>('SELECT id, student_id, course_id FROM enrollments ORDER BY id ASC');
  const gradeValues = [1.25, 1.50, 1.75, 2.00, 2.25, 1.50, 2.50, 1.75];

  for (let i = 0; i < enrollments.length; i++) {
    const en = enrollments[i];
    const val = gradeValues[i] || 2.00;
    const remarks = getGradeRemarks(val);
    provider.execute(
      `INSERT INTO grades (enrollment_id, student_id, course_id, grade, remarks, encoded_by, encoded_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'reginald.torres', ?, ?)`,
      [en.id, en.student_id, en.course_id, val, remarks, now, now]
    );
  }

  // 7. Users (28 users as specified in Section 14)
  // Admin user
  const adminRes = provider.execute(
    `INSERT INTO users (username, email, password_hash, role, status, student_id, employee_id, created_at, updated_at)
     VALUES (?, ?, ?, 'admin', 'active', NULL, NULL, ?, ?)`,
    ['admin', 'admin@apex.edu', adminPasswordHash, now, now]
  );
  const adminId = Number(adminRes.lastInsertRowid);

  // Registrar user
  const regRes = provider.execute(
    `INSERT INTO users (username, email, password_hash, role, status, student_id, employee_id, created_at, updated_at)
     VALUES (?, ?, ?, 'registrar', 'active', NULL, 'EMP-2024-0005', ?, ?)`,
    ['registrar', 'registrar@apex.edu', regPasswordHash, now, now]
  );
  provider.execute('UPDATE employees SET user_id = ? WHERE employee_id = ?', [Number(regRes.lastInsertRowid), 'EMP-2024-0005']);

  // HR user
  const hrRes = provider.execute(
    `INSERT INTO users (username, email, password_hash, role, status, student_id, employee_id, created_at, updated_at)
     VALUES (?, ?, ?, 'hr', 'active', NULL, 'EMP-2024-0003', ?, ?)`,
    ['hr_manager', 'hr@apex.edu', hrPasswordHash, now, now]
  );
  provider.execute('UPDATE employees SET user_id = ? WHERE employee_id = ?', [Number(hrRes.lastInsertRowid), 'EMP-2024-0003']);

  // Faculty user (Prof. Smith)
  const facRes = provider.execute(
    `INSERT INTO users (username, email, password_hash, role, status, student_id, employee_id, created_at, updated_at)
     VALUES (?, ?, ?, 'employee', 'active', NULL, 'EMP-2024-0007', ?, ?)`,
    ['prof.smith', 'alan.smith@apex.edu', facultyPasswordHash, now, now]
  );
  provider.execute('UPDATE employees SET user_id = ? WHERE employee_id = ?', [Number(facRes.lastInsertRowid), 'EMP-2024-0007']);

  // Security officer user
  const secRes = provider.execute(
    `INSERT INTO users (username, email, password_hash, role, status, student_id, employee_id, created_at, updated_at)
     VALUES (?, ?, ?, 'employee', 'active', NULL, 'EMP-2024-0016', ?, ?)`,
    ['officer.reyes', 'rodrigo.reyes@apex.edu', facultyPasswordHash, now, now]
  );
  provider.execute('UPDATE employees SET user_id = ? WHERE employee_id = ?', [Number(secRes.lastInsertRowid), 'EMP-2024-0016']);

  // Other employees users (creating accounts for 17 more employees -> 5 + 17 = 22 employee users)
  for (let i = 1; i <= 22; i++) {
    const emp = employeesData[i - 1];
    // Skip if already has user
    const existing = provider.queryOne<{ user_id: number | null }>('SELECT user_id FROM employees WHERE employee_id = ?', [emp.empId]);
    if (existing && existing.user_id) continue;

    const username = emp.email.split('@')[0];
    let role = 'employee';
    if (emp.dept === 'Human Resources') role = 'hr';
    if (emp.dept === 'Registrar Office') role = 'registrar';

    const uRes = provider.execute(
      `INSERT INTO users (username, email, password_hash, role, status, student_id, employee_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', NULL, ?, ?, ?)`,
      [username, emp.email, defaultPasswordHash, role, emp.empId, now, now]
    );
    provider.execute('UPDATE employees SET user_id = ? WHERE employee_id = ?', [Number(uRes.lastInsertRowid), emp.empId]);
  }

  // Student users (5 student accounts -> total 1 admin + 22 employees + 5 students = 28 users!)
  const studentUserRes1 = provider.execute(
    `INSERT INTO users (username, email, password_hash, role, status, student_id, employee_id, created_at, updated_at)
     VALUES (?, ?, ?, 'student', 'active', 'STU-2024-0001', NULL, ?, ?)`,
    ['john.doe', 'john.doe@gmail.com', studentPasswordHash, now, now]
  );
  provider.execute('UPDATE students SET user_id = ? WHERE student_id = ?', [Number(studentUserRes1.lastInsertRowid), 'STU-2024-0001']);

  const studentUserRes2 = provider.execute(
    `INSERT INTO users (username, email, password_hash, role, status, student_id, employee_id, created_at, updated_at)
     VALUES (?, ?, ?, 'student', 'active', 'STU-2024-0002', NULL, ?, ?)`,
    ['jane.smith', 'jane.smith@gmail.com', studentPasswordHash, now, now]
  );
  provider.execute('UPDATE students SET user_id = ? WHERE student_id = ?', [Number(studentUserRes2.lastInsertRowid), 'STU-2024-0002']);

  const studentUserRes3 = provider.execute(
    `INSERT INTO users (username, email, password_hash, role, status, student_id, employee_id, created_at, updated_at)
     VALUES (?, ?, ?, 'student', 'active', 'STU-2024-0003', NULL, ?, ?)`,
    ['michael.brown', 'michael.brown@gmail.com', studentPasswordHash, now, now]
  );
  provider.execute('UPDATE students SET user_id = ? WHERE student_id = ?', [Number(studentUserRes3.lastInsertRowid), 'STU-2024-0003']);

  const studentUserRes4 = provider.execute(
    `INSERT INTO users (username, email, password_hash, role, status, student_id, employee_id, created_at, updated_at)
     VALUES (?, ?, ?, 'student', 'active', 'STU-2024-0004', NULL, ?, ?)`,
    ['emily.davis', 'emily.davis@gmail.com', studentPasswordHash, now, now]
  );
  provider.execute('UPDATE students SET user_id = ? WHERE student_id = ?', [Number(studentUserRes4.lastInsertRowid), 'STU-2024-0004']);

  const studentUserRes5 = provider.execute(
    `INSERT INTO users (username, email, password_hash, role, status, student_id, employee_id, created_at, updated_at)
     VALUES (?, ?, ?, 'student', 'active', 'STU-2024-0005', NULL, ?, ?)`,
    ['robert.wilson', 'robert.wilson@gmail.com', studentPasswordHash, now, now]
  );
  provider.execute('UPDATE students SET user_id = ? WHERE student_id = ?', [Number(studentUserRes5.lastInsertRowid), 'STU-2024-0005']);

  // Note: Student STU-2024-0006 (Sophia Taylor) is intentionally left UNCLAIMED (user_id is NULL)
  // so the user can test the Registration / Profile Claiming feature!

  // 8. Sessions (historical sessions — use real user IDs from DB)
  const allUserIds = provider.query<{ id: number }>('SELECT id FROM users ORDER BY id ASC').map(r => r.id);
  const sessionCount = 179;
  for (let i = 1; i <= sessionCount; i++) {
    const sessDate = new Date(Date.now() - (sessionCount - i) * 3600 * 1000).toISOString();
    const userId = allUserIds[i % allUserIds.length];
    provider.execute(
      `INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, created_at, last_activity_at, ended_at, end_reason)
       VALUES (?, ?, ?, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', ?, ?, ?, 'logout')`,
      [`sess-${i}-${Date.now()}`, userId, `token-hash-${i}`, sessDate, sessDate, sessDate]
    );
  }

  // 9. Audit Logs (576 historical audit logs as noted in Section 14)
  const actions = ['LOGIN', 'LOGOUT', 'CREATE_STUDENT', 'UPDATE_STUDENT', 'ENCODE_GRADE', 'CREATE_COURSE', 'UPDATE_SCHEDULE', 'VIEW_PROFILE'];
  const resources = ['auth', 'students', 'grades', 'courses', 'schedules', 'users'];
  const auditCount = 576;

  for (let i = 1; i <= auditCount; i++) {
    const act = actions[i % actions.length];
    const res = resources[i % resources.length];
    const logDate = new Date(Date.now() - (auditCount - i) * 1800 * 1000).toISOString();
    provider.execute(
      `INSERT INTO audit_logs (user_id, username, role, action, resource, details, ip_address, user_agent, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, '127.0.0.1', 'Mozilla/5.0 Institutional Browser', ?)`,
      [adminId, 'admin', 'admin', act, res, `System automated event #${i}`, logDate]
    );
  }

  const finalCounts = {
    users: provider.queryOne<{ c: number }>('SELECT COUNT(*) as c FROM users')!.c,
    employees: provider.queryOne<{ c: number }>('SELECT COUNT(*) as c FROM employees')!.c,
    students: provider.queryOne<{ c: number }>('SELECT COUNT(*) as c FROM students')!.c,
    courses: provider.queryOne<{ c: number }>('SELECT COUNT(*) as c FROM courses')!.c,
    schedules: provider.queryOne<{ c: number }>('SELECT COUNT(*) as c FROM schedules')!.c,
    enrollments: provider.queryOne<{ c: number }>('SELECT COUNT(*) as c FROM enrollments')!.c,
    grades: provider.queryOne<{ c: number }>('SELECT COUNT(*) as c FROM grades')!.c,
    sessions: provider.queryOne<{ c: number }>('SELECT COUNT(*) as c FROM sessions')!.c,
    auditLogs: provider.queryOne<{ c: number }>('SELECT COUNT(*) as c FROM audit_logs')!.c,
  };

  console.log('Seeding completed successfully!');
  console.log('Record counts:', finalCounts);
}

// Allow direct execution
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase(true).then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}
