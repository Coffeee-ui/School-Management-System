import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/userRepository.js';
import { AuditService } from '../services/auditService.js';
import { isValidEmail, isValidPassword } from '../utils/validation.js';

const userRepo = new UserRepository();
const auditService = new AuditService();

export class UserController {
  public static getAll(_req: Request, res: Response, next: NextFunction): void {
    try {
      const users = userRepo.findSafeAll();
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  }

  public static getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id as string, 10);
      const user = userRepo.findSafeById(id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password, role, status, student_id, employee_id } = req.body;

      if (!username || !email || !password || !role) {
        res.status(400).json({ error: 'Username, email, password, and role are required' });
        return;
      }

      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Invalid email address' });
        return;
      }

      if (!isValidPassword(password)) {
        res.status(400).json({
          error: 'Password must contain at least 8 characters, 1 uppercase letter, and 1 number',
        });
        return;
      }

      if (userRepo.findByUsername(username)) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }

      if (userRepo.findByEmail(email)) {
        res.status(409).json({ error: 'Email already exists' });
        return;
      }

      const password_hash = await bcrypt.hash(password, 10);
      const user = userRepo.create({
        username,
        email,
        password_hash,
        role,
        status: status || 'active',
        student_id: student_id || null,
        employee_id: employee_id || null,
      });

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'admin',
        role: req.user?.role || 'admin',
        action: 'CREATE_USER',
        resource: 'users',
        details: { createdUserId: user.id, username: user.username, role: user.role },
        ipAddress,
        userAgent,
      });

      res.status(201).json(userRepo.findSafeById(user.id));
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const { username, email, password, role, status, student_id, employee_id } = req.body;

      const existing = userRepo.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const updateData: Record<string, unknown> = {};

      if (username && username !== existing.username) {
        const duplicate = userRepo.findByUsername(username);
        if (duplicate && duplicate.id !== id) {
          res.status(409).json({ error: 'Username already exists' });
          return;
        }
        updateData.username = username;
      }

      if (email && email !== existing.email) {
        if (!isValidEmail(email)) {
          res.status(400).json({ error: 'Invalid email address' });
          return;
        }
        const duplicate = userRepo.findByEmail(email);
        if (duplicate && duplicate.id !== id) {
          res.status(409).json({ error: 'Email already exists' });
          return;
        }
        updateData.email = email;
      }

      if (password) {
        if (!isValidPassword(password)) {
          res.status(400).json({
            error: 'Password must contain at least 8 characters, 1 uppercase letter, and 1 number',
          });
          return;
        }
        updateData.password_hash = await bcrypt.hash(password, 10);
      }

      if (role) updateData.role = role;
      if (status) updateData.status = status;
      if (student_id !== undefined) updateData.student_id = student_id || null;
      if (employee_id !== undefined) updateData.employee_id = employee_id || null;

      userRepo.update(id, updateData);

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'admin',
        role: req.user?.role || 'admin',
        action: 'UPDATE_USER',
        resource: 'users',
        details: { updatedUserId: id, fields: Object.keys(updateData) },
        ipAddress,
        userAgent,
      });

      res.status(200).json(userRepo.findSafeById(id));
    } catch (err) {
      next(err);
    }
  }

  public static delete(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id as string, 10);
      const existing = userRepo.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      userRepo.delete(id);

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      auditService.log({
        userId: req.user?.userId,
        username: req.user?.username || 'admin',
        role: req.user?.role || 'admin',
        action: 'DELETE_USER',
        resource: 'users',
        details: { deletedUserId: id, username: existing.username },
        ipAddress,
        userAgent,
      });

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
