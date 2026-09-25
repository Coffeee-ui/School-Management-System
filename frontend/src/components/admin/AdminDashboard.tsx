import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { UserManagement } from './UserManagement.js';
import { AuditLogViewer } from './AuditLogViewer.js';
import { StudentManagement } from '../registrar/StudentManagement.js';
import { EmployeeManagement } from '../hr/EmployeeManagement.js';
import { CourseManagement } from '../registrar/CourseManagement.js';
import { ScheduleManagement } from '../registrar/ScheduleManagement.js';
import { EnrollmentManagement } from '../registrar/EnrollmentManagement.js';
import { GradeManagement } from '../registrar/GradeManagement.js';
import {
  Shield,
  FileText,
  UserCheck,
  Users,
  BookOpen,
  Calendar,
  Layers,
  Award,
  Activity,
} from 'lucide-react';

interface AdminDashboardProps {
  activeTab: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab }) => {
  const [stats, setStats] = useState({
    users: 0,
    students: 0,
    employees: 0,
    courses: 0,
    schedules: 0,
    enrollments: 0,
    grades: 0,
    auditLogs: 0,
  });

  const loadAllStats = async () => {
    try {
      const [u, s, e, c, sch, en, g, a] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getStudents().catch(() => []),
        api.getEmployees().catch(() => []),
        api.getCourses().catch(() => []),
        api.getSchedules().catch(() => []),
        api.getEnrollments().catch(() => []),
        api.getGrades().catch(() => []),
        api.getAuditStats().catch(() => ({ totalLogs: 0 })),
      ]);

      setStats({
        users: u.length,
        students: s.length,
        employees: e.length,
        courses: c.length,
        schedules: sch.length,
        enrollments: en.length,
        grades: g.length,
        auditLogs: a.totalLogs,
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAllStats();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Administrator System Control</h1>
          <p className="page-subtitle">Complete management of user accounts, institutional records, and audit security</p>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Institutional Big KPI Grid */}
          <div className="kpi-grid mb-4">
            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-primary">
                <Shield size={24} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">User Accounts</span>
                <span className="kpi-value">{stats.users}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-info">
                <UserCheck size={24} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Registered Students</span>
                <span className="kpi-value">{stats.students}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-success">
                <Users size={24} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Staff & Faculty</span>
                <span className="kpi-value">{stats.employees}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-warning">
                <BookOpen size={24} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Courses & Curricula</span>
                <span className="kpi-value">{stats.courses}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-info">
                <Calendar size={24} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Active Schedules</span>
                <span className="kpi-value">{stats.schedules}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-primary">
                <Layers size={24} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Term Enrollments</span>
                <span className="kpi-value">{stats.enrollments}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-warning">
                <Award size={24} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Encoded Grades</span>
                <span className="kpi-value">{stats.grades}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-success">
                <Activity size={24} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Audit Log Events</span>
                <span className="kpi-value font-mono">{stats.auditLogs}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card mb-4">
            <div className="card-header">
              <h2 className="card-title">Recent System Activity</h2>
            </div>
            <div className="card-body p-0">
              <AuditLogViewer />
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'audit_logs' && <AuditLogViewer />}
      {activeTab === 'students' && <StudentManagement />}
      {activeTab === 'employees' && <EmployeeManagement />}
      {activeTab === 'courses' && <CourseManagement />}
      {activeTab === 'schedules' && <ScheduleManagement />}
      {activeTab === 'enrollments' && <EnrollmentManagement />}
      {activeTab === 'grades' && <GradeManagement />}
    </div>
  );
};
