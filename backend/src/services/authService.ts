import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRepository } from '../repositories/userRepository.js';
import { StudentRepository } from '../repositories/studentRepository.js';
import { EmployeeRepository } from '../repositories/employeeRepository.js';
import { SessionRepository } from '../repositories/sessionRepository.js';
import { SqliteProvider } from '../db/sqliteProvider.js';
import { APP_CONFIG } from '../config/index.js';
import { SafeUser, User, AuthTokenPayload, UserRole } from '../models/types.js';
import {
  isValidPassword,
  isValidEmail,
  isValidStudentId,
  isValidEmployeeId,
} from '../utils/validation.js';

export interface LoginResult {
  user: SafeUser;
  token: string;
  sessionId: string;
}

export interface IdentifyProfileResult {
  profileType: 'student' | 'employee';
  profileId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export class AuthService {
  private userRepo: UserRepository;
  private studentRepo: StudentRepository;
  private employeeRepo: EmployeeRepository;
  private sessionRepo: SessionRepository;

  constructor(
    userRepo?: UserRepository,
    studentRepo?: StudentRepository,
    employeeRepo?: EmployeeRepository,
    sessionRepo?: SessionRepository
  ) {
    this.userRepo = userRepo || new UserRepository();
    this.studentRepo = studentRepo || new StudentRepository();
    this.employeeRepo = employeeRepo || new EmployeeRepository();
    this.sessionRepo = sessionRepo || new SessionRepository();
  }

  public async login(
    identifier: string,
    passwordPlain: string,
    ipAddress: string,
    userAgent: string
  ): Promise<LoginResult> {
    if (!identifier || !passwordPlain) {
      throw new Error('Identifier and password are required');
    }

    const user = this.userRepo.findByIdentifier(identifier);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new Error(`Account is ${user.status}. Please contact the administrator.`);
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Generate unique session ID
    const sessionId = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(sessionId + Date.now()).digest('hex');

    // Create session record
    this.sessionRepo.create({
      id: sessionId,
      user_id: user.id,
      token_hash: tokenHash,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    const payload: AuthTokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      studentId: user.student_id,
      employeeId: user.employee_id,
      sessionId,
    };

    const token = jwt.sign(payload, APP_CONFIG.JWT_SECRET, {
      expiresIn: APP_CONFIG.JWT_EXPIRES_IN,
    });

    const safeUser = this.userRepo.findSafeById(user.id)!;
    return { user: safeUser, token, sessionId };
  }

  public logout(sessionId: string): void {
    if (sessionId) {
      this.sessionRepo.endSession(sessionId, 'logout');
    }
  }

  public closeSession(sessionId: string): void {
    if (sessionId) {
      this.sessionRepo.endSession(sessionId, 'closed');
    }
  }

  public verifyToken(token: string): AuthTokenPayload {
    try {
      const decoded = jwt.verify(token, APP_CONFIG.JWT_SECRET) as AuthTokenPayload;
      // Check if session is still active
      const session = this.sessionRepo.findById(decoded.sessionId);
      if (!session || session.ended_at !== null) {
        throw new Error('Session has expired or ended');
      }
      this.sessionRepo.updateActivity(decoded.sessionId);
      return decoded;
    } catch {
      throw new Error('Invalid or expired authentication token');
    }
  }

  public identifyProfile(profileId: string, dateOfBirth: string): IdentifyProfileResult {
    const trimmedId = profileId.trim().toUpperCase();
    const trimmedDob = dateOfBirth.trim();

    if (isValidStudentId(trimmedId)) {
      const student = this.studentRepo.findByStudentId(trimmedId);
      if (!student) {
        throw new Error('Student record not found');
      }
      if (student.user_id !== null) {
        throw new Error('This student profile has already been claimed and has an active account');
      }
      if (student.date_of_birth !== trimmedDob) {
        throw new Error('Date of birth does not match student records');
      }
      return {
        profileType: 'student',
        profileId: student.student_id,
        firstName: student.first_name,
        lastName: student.last_name,
        email: student.email,
      };
    } else if (isValidEmployeeId(trimmedId)) {
      const employee = this.employeeRepo.findByEmployeeId(trimmedId);
      if (!employee) {
        throw new Error('Employee record not found');
      }
      if (employee.user_id !== null) {
        throw new Error('This employee profile has already been claimed and has an active account');
      }
      if (employee.date_of_birth !== trimmedDob) {
        throw new Error('Date of birth does not match employee records');
      }
      return {
        profileType: 'employee',
        profileId: employee.employee_id,
        firstName: employee.first_name,
        lastName: employee.last_name,
        email: employee.email,
      };
    } else {
      throw new Error('Invalid ID format. Must be STU-YYYY-XXXX or EMP-YYYY-XXXX');
    }
  }

  public async registerAndClaim(data: {
    profileId: string;
    dateOfBirth: string;
    username: string;
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<LoginResult> {
    const trimmedId = data.profileId.trim().toUpperCase();
    const trimmedDob = data.dateOfBirth.trim();
    const trimmedUsername = data.username.trim();
    const trimmedEmail = data.email.trim();

    if (!isValidPassword(data.password)) {
      throw new Error('Password must contain at least 8 characters, at least 1 uppercase letter, and at least 1 number');
    }

    if (!isValidEmail(trimmedEmail)) {
      throw new Error('Invalid email address format');
    }

    if (this.userRepo.findByUsername(trimmedUsername)) {
      throw new Error('Username is already taken');
    }

    if (this.userRepo.findByEmail(trimmedEmail)) {
      throw new Error('Email is already registered');
    }

    // Verify profile eligibility
    const profile = this.identifyProfile(trimmedId, trimmedDob);

    // Determine role:
    let role: UserRole = 'student';
    let studentId: string | null = null;
    let employeeId: string | null = null;

    if (profile.profileType === 'student') {
      role = 'student';
      studentId = trimmedId;
    } else {
      // Find employee to check position/department for exact role
      const emp = this.employeeRepo.findByEmployeeId(trimmedId);
      if (emp?.department.toLowerCase().includes('human resource') || emp?.position.toLowerCase().includes('hr')) {
        role = 'hr';
      } else if (emp?.department.toLowerCase().includes('registrar') || emp?.position.toLowerCase().includes('registrar')) {
        role = 'registrar';
      } else {
        role = 'employee';
      }
      employeeId = trimmedId;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Atomically create user and link profile using transaction
    const provider = SqliteProvider.getInstance();
    const newUser = provider.transaction(() => {
      const user = this.userRepo.create({
        username: trimmedUsername,
        email: trimmedEmail,
        password_hash: passwordHash,
        role,
        status: 'active',
        student_id: studentId,
        employee_id: employeeId,
      });

      if (studentId) {
        this.studentRepo.linkUser(studentId, user.id);
      } else if (employeeId) {
        this.employeeRepo.linkUser(employeeId, user.id);
      }

      return user;
    });

    // Auto-login after registration
    return this.login(newUser.username, data.password, data.ipAddress, data.userAgent);
  }
}
