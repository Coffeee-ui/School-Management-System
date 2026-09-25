import { APP_CONFIG } from '../config/index.js';
import {
  SafeUser,
  Student,
  Employee,
  Course,
  Schedule,
  Enrollment,
  Grade,
  GwaResult,
  AuditLog,
  AuditStats,
  DemoPreset,
} from '../types/index.js';

class ApiService {
  private token: string | null = null;
  private sessionId: string | null = null;

  constructor() {
    this.token = localStorage.getItem('apex_token');
    this.sessionId = localStorage.getItem('apex_session_id');
  }

  public setAuth(token: string | null, sessionId: string | null): void {
    this.token = token;
    this.sessionId = sessionId;
    if (token) {
      localStorage.setItem('apex_token', token);
    } else {
      localStorage.removeItem('apex_token');
    }
    if (sessionId) {
      localStorage.setItem('apex_session_id', sessionId);
    } else {
      localStorage.removeItem('apex_session_id');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public getSessionId(): string | null {
    return this.sessionId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${APP_CONFIG.API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg =
        (typeof data === 'object' && data !== null && 'error' in data ? (data as { error: string }).error : null) ||
        `HTTP Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // --- Auth Endpoints ---
  public async login(identifier: string, password: string): Promise<{ user: SafeUser; token: string; sessionId: string }> {
    const res = await this.request<{ user: SafeUser; token: string; sessionId: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    this.setAuth(res.token, res.sessionId);
    return res;
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setAuth(null, null);
    }
  }

  public closeSessionBeacon(): void {
    if (!this.sessionId) return;
    const url = `${APP_CONFIG.API_BASE_URL}/auth/close-session`;
    const payload = JSON.stringify({ sessionId: this.sessionId });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
    this.setAuth(null, null);
  }

  public async getMe(): Promise<{ user: SafeUser; profile: Student | Employee | null; demoMode: boolean }> {
    return this.request('/auth/me');
  }

  public async identifyProfile(profileId: string, dateOfBirth: string): Promise<{
    profileType: 'student' | 'employee';
    profileId: string;
    firstName: string;
    lastName: string;
    email: string;
  }> {
    return this.request('/auth/identify-profile', {
      method: 'POST',
      body: JSON.stringify({ profileId, dateOfBirth }),
    });
  }

  public async register(data: {
    profileId: string;
    dateOfBirth: string;
    username: string;
    email: string;
    password: string;
  }): Promise<{ user: SafeUser; token: string; sessionId: string }> {
    const res = await this.request<{ user: SafeUser; token: string; sessionId: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setAuth(res.token, res.sessionId);
    return res;
  }

  public async getAppStatus(): Promise<{ mode: 'normal' | 'demo'; demoMode: boolean }> {
    return this.request('/auth/status');
  }

  public async getDemoPresets(): Promise<{ presets: DemoPreset[] }> {
    return this.request('/auth/demo-presets');
  }

  // --- Users Endpoints ---
  public async getUsers(): Promise<SafeUser[]> {
    return this.request('/users');
  }

  public async getUser(id: number): Promise<SafeUser> {
    return this.request(`/users/${id}`);
  }

  public async createUser(data: Partial<SafeUser> & { password: string }): Promise<SafeUser> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateUser(id: number, data: Partial<SafeUser> & { password?: string }): Promise<SafeUser> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async deleteUser(id: number): Promise<{ message: string }> {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // --- Students Endpoints ---
  public async getStudents(): Promise<Student[]> {
    return this.request('/students');
  }

  public async getStudentProfile(): Promise<Student> {
    return this.request('/students/profile');
  }

  public async getStudent(id: number): Promise<Student> {
    return this.request(`/students/${id}`);
  }

  public async createStudent(data: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Student> {
    return this.request('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateStudent(id: number, data: Partial<Student>): Promise<Student> {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async deleteStudent(id: number): Promise<{ message: string }> {
    return this.request(`/students/${id}`, { method: 'DELETE' });
  }

  // --- Employees Endpoints ---
  public async getEmployees(): Promise<Employee[]> {
    return this.request('/employees');
  }

  public async getEmployeeProfile(): Promise<Employee> {
    return this.request('/employees/profile');
  }

  public async getEmployee(id: number): Promise<Employee> {
    return this.request(`/employees/${id}`);
  }

  public async createEmployee(data: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Employee> {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
    return this.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async deleteEmployee(id: number): Promise<{ message: string }> {
    return this.request(`/employees/${id}`, { method: 'DELETE' });
  }

  // --- Courses Endpoints ---
  public async getCourses(): Promise<Course[]> {
    return this.request('/courses');
  }

  public async getCourse(id: number): Promise<Course> {
    return this.request(`/courses/${id}`);
  }

  public async createCourse(data: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateCourse(id: number, data: Partial<Course>): Promise<Course> {
    return this.request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async deleteCourse(id: number): Promise<{ message: string }> {
    return this.request(`/courses/${id}`, { method: 'DELETE' });
  }

  // --- Schedules Endpoints ---
  public async getSchedules(): Promise<Schedule[]> {
    return this.request('/schedules');
  }

  public async getSelfSchedules(): Promise<Schedule[]> {
    return this.request('/schedules/self');
  }

  public async getSchedule(id: number): Promise<Schedule> {
    return this.request(`/schedules/${id}`);
  }

  public async createSchedule(data: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<Schedule> {
    return this.request('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateSchedule(id: number, data: Partial<Schedule>): Promise<Schedule> {
    return this.request(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async deleteSchedule(id: number): Promise<{ message: string }> {
    return this.request(`/schedules/${id}`, { method: 'DELETE' });
  }

  // --- Enrollments Endpoints ---
  public async getEnrollments(): Promise<Enrollment[]> {
    return this.request('/enrollments');
  }

  public async getSelfEnrollments(): Promise<Enrollment[]> {
    return this.request('/enrollments/self');
  }

  public async getEnrollment(id: number): Promise<Enrollment> {
    return this.request(`/enrollments/${id}`);
  }

  public async createEnrollment(data: {
    student_id: string;
    course_id: number;
    schedule_id?: number | null;
    academic_year: string;
    semester: string;
    status?: string;
  }): Promise<Enrollment> {
    return this.request('/enrollments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateEnrollment(id: number, data: Partial<Enrollment>): Promise<Enrollment> {
    return this.request(`/enrollments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async deleteEnrollment(id: number): Promise<{ message: string }> {
    return this.request(`/enrollments/${id}`, { method: 'DELETE' });
  }

  // --- Grades Endpoints ---
  public async getGrades(): Promise<Grade[]> {
    return this.request('/grades');
  }

  public async getSelfGrades(): Promise<{
    grades: Grade[];
    gwa: number;
    totalCredits: number;
    courseCount: number;
  }> {
    return this.request('/grades/self');
  }

  public async getStudentGwa(studentId: string): Promise<GwaResult> {
    return this.request(`/grades/gwa/${studentId}`);
  }

  public async createGrade(data: { enrollment_id: number; grade: number }): Promise<Grade> {
    return this.request('/grades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateGrade(id: number, data: { grade?: number }): Promise<Grade> {
    return this.request(`/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async deleteGrade(id: number): Promise<{ message: string }> {
    return this.request(`/grades/${id}`, { method: 'DELETE' });
  }

  // --- Audit Logs Endpoints ---
  public async getAuditLogs(params: Record<string, string | number | undefined> = {}): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/audit-logs${query}`);
  }

  public async getAuditStats(): Promise<AuditStats> {
    return this.request('/audit-logs/stats');
  }

  public getAuditExportUrl(params: Record<string, string | number | undefined> = {}): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return `${APP_CONFIG.API_BASE_URL}/audit-logs/export${query}`;
  }

  // --- Demo Endpoints ---
  public async resetDemoDatabase(): Promise<{ message: string }> {
    return this.request('/demo/reset', { method: 'POST' });
  }
}

export const api = new ApiService();
export default api;
