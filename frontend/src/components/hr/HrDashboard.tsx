import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../services/api.js';
import { EmployeeManagement } from './EmployeeManagement.js';
import { ScheduleManagement } from '../registrar/ScheduleManagement.js';
import { Users, Briefcase, Calendar, ShieldCheck } from 'lucide-react';
import { Employee } from '../../types/index.js';
import { formatDate } from '../../utils/formatters.js';

interface HrDashboardProps {
  activeTab: string;
}

export const HrDashboard: React.FC<HrDashboardProps> = ({ activeTab }) => {
  const { user, profile } = useAuth();
  const [empCount, setEmpCount] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [deptCount, setDeptCount] = useState<number>(0);
  const [schedCount, setSchedCount] = useState<number>(0);

  const loadStats = async () => {
    try {
      const [employees, schedules] = await Promise.all([
        api.getEmployees().catch(() => []),
        api.getSchedules().catch(() => []),
      ]);

      setEmpCount(employees.length);
      setActiveCount(employees.filter((e) => e.status === 'active').length);
      const uniqueDepts = new Set(employees.map((e) => e.department));
      setDeptCount(uniqueDepts.size);
      setSchedCount(schedules.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const employeeProfile = profile as Employee | null;

  return (
    <div className="hr-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Human Resources Portal</h1>
          <p className="page-subtitle">Employee records, department staffing, and duty schedules</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-primary">
            <Users size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Total Staff & Faculty</span>
            <span className="kpi-value">{empCount}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-success">
            <ShieldCheck size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Active Staff</span>
            <span className="kpi-value">{activeCount}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-info">
            <Briefcase size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Institutional Departments</span>
            <span className="kpi-value">{deptCount}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-warning">
            <Calendar size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Scheduled Duty Slots</span>
            <span className="kpi-value">{schedCount}</span>
          </div>
        </div>
      </div>

      {activeTab === 'employees' && <EmployeeManagement />}

      {activeTab === 'schedules' && <ScheduleManagement />}

      {activeTab === 'profile' && employeeProfile && (
        <section className="dashboard-card" aria-labelledby="hr-profile-heading">
          <div className="card-header">
            <h2 id="hr-profile-heading" className="card-title">My Staff Profile</h2>
          </div>
          <div className="card-body">
            <div className="profile-grid">
              <div className="profile-field">
                <span className="profile-field-label">Full Name</span>
                <span className="profile-field-value">
                  {employeeProfile.first_name} {employeeProfile.last_name}
                </span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Employee ID</span>
                <span className="profile-field-value font-mono">{employeeProfile.employee_id}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Position</span>
                <span className="profile-field-value">{employeeProfile.position}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Department</span>
                <span className="profile-field-value">{employeeProfile.department}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Email</span>
                <span className="profile-field-value">{employeeProfile.email}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Contact Number</span>
                <span className="profile-field-value font-mono">{employeeProfile.contact_number}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Hire Date</span>
                <span className="profile-field-value">{formatDate(employeeProfile.hire_date)}</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
