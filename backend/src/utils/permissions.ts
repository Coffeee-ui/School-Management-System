import { UserRole } from '../models/types.js';

export type Permission =
  | 'profile.read:self'
  | 'students.read:self'
  | 'students.read'
  | 'students.create'
  | 'students.update'
  | 'students.delete'
  | 'employees.read:self'
  | 'employees.read'
  | 'employees.create'
  | 'employees.update'
  | 'employees.delete'
  | 'courses.read'
  | 'courses.create'
  | 'courses.update'
  | 'courses.delete'
  | 'schedules.read:self'
  | 'schedules.read'
  | 'schedules.create'
  | 'schedules.update'
  | 'schedules.delete'
  | 'enrollments.read:self'
  | 'enrollments.read'
  | 'enrollments.create'
  | 'enrollments.update'
  | 'enrollments.delete'
  | 'grades.read:self'
  | 'grades.read'
  | 'grades.create'
  | 'grades.update'
  | 'grades.delete'
  | 'users.read'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'audit_logs.read'
  | '*';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [
    'profile.read:self',
    'students.read:self',
    'courses.read',
    'schedules.read:self',
    'enrollments.read:self',
    'grades.read:self',
  ],
  employee: [
    'profile.read:self',
    'employees.read:self',
    'courses.read',
    'schedules.read:self',
  ],
  hr: [
    'profile.read:self',
    'employees.read',
    'employees.create',
    'employees.update',
    'employees.delete',
    'schedules.read',
    'schedules.create',
    'schedules.update',
    'schedules.delete',
  ],
  registrar: [
    'profile.read:self',
    'students.read',
    'students.create',
    'students.update',
    'students.delete',
    'employees.read',
    'courses.read',
    'courses.create',
    'courses.update',
    'courses.delete',
    'schedules.read',
    'schedules.create',
    'schedules.update',
    'schedules.delete',
    'enrollments.read',
    'enrollments.create',
    'enrollments.update',
    'enrollments.delete',
    'grades.read',
    'grades.create',
    'grades.update',
    'grades.delete',
  ],
  admin: [
    '*',
    'profile.read:self',
    'students.read:self',
    'students.read',
    'students.create',
    'students.update',
    'students.delete',
    'employees.read:self',
    'employees.read',
    'employees.create',
    'employees.update',
    'employees.delete',
    'courses.read',
    'courses.create',
    'courses.update',
    'courses.delete',
    'schedules.read:self',
    'schedules.read',
    'schedules.create',
    'schedules.update',
    'schedules.delete',
    'enrollments.read:self',
    'enrollments.read',
    'enrollments.create',
    'enrollments.update',
    'enrollments.delete',
    'grades.read:self',
    'grades.read',
    'grades.create',
    'grades.update',
    'grades.delete',
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'audit_logs.read',
  ],
};

export function hasPermission(role: UserRole, requiredPermission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  if (permissions.includes('*')) {
    return true;
  }
  return permissions.includes(requiredPermission);
}
