import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../services/api.js';
import { Schedule, Employee, Course } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatDate, formatTime12 } from '../../utils/formatters.js';
import { Briefcase, Calendar, BookOpen, RefreshCw } from 'lucide-react';

interface EmployeeDashboardProps {
  activeTab: string;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ activeTab }) => {
  const { user, profile } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(profile as Employee | null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, schedRes, courseRes] = await Promise.all([
        api.getEmployeeProfile().catch(() => null),
        api.getSelfSchedules().catch(() => []),
        api.getCourses().catch(() => []),
      ]);

      if (empRes) setEmployee(empRes);
      setSchedules(schedRes);
      setCourses(courseRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !employee) {
    return <div className="loading-state">Loading employee profile...</div>;
  }

  const teachingSchedules = schedules.filter((s) => s.schedule_type === 'teaching');
  const otherSchedules = schedules.filter((s) => s.schedule_type !== 'teaching');

  return (
    <div className="employee-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Faculty & Staff Portal</h1>
          <p className="page-subtitle">Welcome, {employee ? `${employee.first_name} ${employee.last_name}` : user?.username}</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={loadData}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-primary">
            <Briefcase size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Employee ID</span>
            <span className="kpi-value font-mono">{employee?.employee_id || 'N/A'}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-info">
            <Calendar size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Assigned Duty Slots</span>
            <span className="kpi-value">{schedules.length}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-warning">
            <BookOpen size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Teaching Classes</span>
            <span className="kpi-value">{teachingSchedules.length}</span>
          </div>
        </div>
      </div>

      {/* Profile Tab */}
      {(activeTab === 'profile' || activeTab === 'overview') && (
        <section className="dashboard-card mb-4" aria-labelledby="emp-profile-heading">
          <div className="card-header">
            <h2 id="emp-profile-heading" className="card-title">Employee Information</h2>
            <StatusBadge status={employee?.status || 'active'} />
          </div>
          <div className="card-body">
            <div className="profile-grid">
              <div className="profile-field">
                <span className="profile-field-label">Full Name</span>
                <span className="profile-field-value">
                  {employee?.first_name} {employee?.middle_name ? `${employee.middle_name} ` : ''}{employee?.last_name}
                </span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Employee ID</span>
                <span className="profile-field-value font-mono">{employee?.employee_id}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Position / Title</span>
                <span className="profile-field-value font-semibold">{employee?.position}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Department</span>
                <span className="profile-field-value">{employee?.department}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Institutional Email</span>
                <span className="profile-field-value">{employee?.email}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Contact Number</span>
                <span className="profile-field-value font-mono">{employee?.contact_number}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Date of Birth</span>
                <span className="profile-field-value">{formatDate(employee?.date_of_birth)}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Hire Date</span>
                <span className="profile-field-value">{formatDate(employee?.hire_date)}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Assigned Schedules Tab */}
      {(activeTab === 'schedules' || activeTab === 'overview') && (
        <section className="dashboard-card mb-4" aria-labelledby="emp-schedules-heading">
          <div className="card-header">
            <h2 id="emp-schedules-heading" className="card-title">Assigned Duty & Teaching Schedules</h2>
            <span className="card-count">{schedules.length} assigned</span>
          </div>
          <div className="card-body p-0">
            {schedules.length === 0 ? (
              <div className="empty-state">No duty or class schedules assigned for this term.</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Schedule Type</th>
                      <th>Day</th>
                      <th>Time Slot</th>
                      <th>Assignment / Subject</th>
                      <th>Assigned Room / Post</th>
                      <th>Academic Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((s) => (
                      <tr key={s.id}>
                        <td><StatusBadge status={s.schedule_type} /></td>
                        <td className="font-semibold">{s.day_of_week}</td>
                        <td className="font-mono">{formatTime12(s.start_time)} - {formatTime12(s.end_time)}</td>
                        <td>
                          {s.schedule_type === 'teaching' ? (
                            <span>
                              <strong className="font-mono">{s.course_code}</strong>: {s.course_name}
                            </span>
                          ) : s.schedule_type === 'security_shift' ? (
                            <span>Campus Security Duty Shift</span>
                          ) : (
                            <span>Administrative / Office Duty</span>
                          )}
                        </td>
                        <td><span className="room-pill">{s.room}</span></td>
                        <td>{s.semester} {s.academic_year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <section className="dashboard-card mb-4" aria-labelledby="emp-courses-heading">
          <div className="card-header">
            <h2 id="emp-courses-heading" className="card-title">Institutional Course Catalog</h2>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Title</th>
                    <th>Department</th>
                    <th>Units</th>
                    <th>Term</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td className="font-mono font-bold text-primary">{c.course_code}</td>
                      <td>{c.course_name}</td>
                      <td>{c.department}</td>
                      <td>{c.credits}</td>
                      <td>{c.semester} {c.academic_year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
