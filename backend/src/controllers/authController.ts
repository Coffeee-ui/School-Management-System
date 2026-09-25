import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { AuditService } from '../services/auditService.js';
import { UserRepository } from '../repositories/userRepository.js';
import { StudentRepository } from '../repositories/studentRepository.js';
import { EmployeeRepository } from '../repositories/employeeRepository.js';
import { APP_CONFIG } from '../config/index.js';

const authService = new AuthService();
const auditService = new AuditService();
const userRepo = new UserRepository();
const studentRepo = new StudentRepository();
const employeeRepo = new EmployeeRepository();

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, password } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      const result = await authService.login(identifier, password, ipAddress, userAgent);

      auditService.log({
        userId: result.user.id,
        username: result.user.username,
        role: result.user.role,
        action: 'LOGIN',
        resource: 'auth',
        details: { identifier },
        ipAddress,
        userAgent,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.sessionId) {
        authService.logout(req.sessionId);
      }

      if (req.user) {
        const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Unknown';

        auditService.log({
          userId: req.user.userId,
          username: req.user.username,
          role: req.user.role,
          action: 'LOGOUT',
          resource: 'auth',
          details: 'User logged out',
          ipAddress,
          userAgent,
        });
      }

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async closeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let sessionId = req.sessionId;
      // Also support beacon payload
      if (!sessionId && req.body && req.body.sessionId) {
        sessionId = req.body.sessionId;
      }

      if (sessionId) {
        authService.closeSession(sessionId);
      }

      res.status(200).json({ message: 'Session closed' });
    } catch (err) {
      next(err);
    }
  }

  public static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const safeUser = userRepo.findSafeById(req.user.userId);
      if (!safeUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      let profileData: unknown = null;
      if (safeUser.student_id) {
        profileData = studentRepo.findByStudentId(safeUser.student_id);
      } else if (safeUser.employee_id) {
        profileData = employeeRepo.findByEmployeeId(safeUser.employee_id);
      }

      res.status(200).json({
        user: safeUser,
        profile: profileData,
        demoMode: APP_CONFIG.DEMO_MODE,
      });
    } catch (err) {
      next(err);
    }
  }

  public static identifyProfile(req: Request, res: Response, next: NextFunction): void {
    try {
      const { profileId, dateOfBirth } = req.body;
      if (!profileId || !dateOfBirth) {
        res.status(400).json({ error: 'Institutional ID and date of birth are required' });
        return;
      }

      const result = authService.identifyProfile(profileId, dateOfBirth);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { profileId, dateOfBirth, username, email, password } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      if (!profileId || !dateOfBirth || !username || !email || !password) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      const result = await authService.registerAndClaim({
        profileId,
        dateOfBirth,
        username,
        email,
        password,
        ipAddress,
        userAgent,
      });

      auditService.log({
        userId: result.user.id,
        username: result.user.username,
        role: result.user.role,
        action: 'REGISTER_CLAIM',
        resource: 'auth',
        details: { profileId, username },
        ipAddress,
        userAgent,
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static getDemoPresets(_req: Request, res: Response): void {
    if (!APP_CONFIG.DEMO_MODE) {
      res.status(403).json({ error: 'Demo mode is not enabled' });
      return;
    }

    const presets = [
      {
        role: 'admin',
        title: 'Administrator',
        username: 'admin',
        password: 'AdminPassword123!',
        description: 'Full system control, users, sessions, audit log viewer & CSV export',
      },
      {
        role: 'registrar',
        title: 'Registrar Officer',
        username: 'registrar',
        password: 'RegistrarPassword123!',
        description: 'Manage students, courses, enrollments, schedules, and encode grades',
      },
      {
        role: 'hr',
        title: 'Human Resources',
        username: 'hr_manager',
        password: 'HrPassword123!',
        description: 'Manage employees, staff records, departments, and duty schedules',
      },
      {
        role: 'employee',
        title: 'Faculty / Professor',
        username: 'prof.smith',
        password: 'FacultyPassword123!',
        description: 'Personal profile, department assignment, and teaching schedules',
      },
      {
        role: 'employee',
        title: 'Security Staff',
        username: 'officer.reyes',
        password: 'SecurityPassword123!',
        description: 'Security shifts, post assignments, and duty hours',
      },
      {
        role: 'student',
        title: 'Student',
        username: 'john.doe',
        password: 'StudentPassword123!',
        description: 'Personal profile, enrolled courses, class schedules, term grades & GWA',
      },
    ];

    res.status(200).json({ presets });
  }
}
