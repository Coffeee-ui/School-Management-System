import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StudentManagement } from './StudentManagement.js';
import { CourseManagement } from './CourseManagement.js';
import { ScheduleManagement } from './ScheduleManagement.js';
import { EnrollmentManagement } from './EnrollmentManagement.js';
import { GradeManagement } from './GradeManagement.js';
import { EmployeeManagement } from '../hr/EmployeeManagement.js';
import { UserCheck, BookOpen, Layers, Award, Calendar, Users } from 'lucide-react';

interface RegistrarDashboardProps {
  activeTab: string;
}

export const RegistrarDashboard: React.FC<RegistrarDashboardProps> = ({ activeTab }) => {
  const [studentCount, setStudentCount] = useState<number>(0);
  const [courseCount, setCourseCount] = useState<number>(0);
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);
  const [gradeCount, setGradeCount] = useState<number>(0);

  const loadStats = async () => {
    try {
      const [students, courses, enrollments, grades] = await Promise.all([
        api.getStudents().catch(() => []),
        api.getCourses().catch(() => []),
        api.getEnrollments().catch(() => []),
        api.getGrades().catch(() => []),
      ]);

      setStudentCount(students.length);
      setCourseCount(courses.length);
      setEnrollmentCount(enrollments.length);
      setGradeCount(grades.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="registrar-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Registrar Operations Portal</h1>
          <p className="page-subtitle">Academic records, student enrollment, courses, and grade encoding</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-primary">
            <UserCheck size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Registered Students</span>
            <span className="kpi-value">{studentCount}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-info">
            <BookOpen size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Course Offerings</span>
            <span className="kpi-value">{courseCount}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-success">
            <Layers size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Term Enrollments</span>
            <span className="kpi-value">{enrollmentCount}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-warning">
            <Award size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Encoded Grades</span>
            <span className="kpi-value">{gradeCount}</span>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {(activeTab === 'students' || activeTab === 'overview') && <StudentManagement />}
      {activeTab === 'courses' && <CourseManagement />}
      {activeTab === 'schedules' && <ScheduleManagement />}
      {activeTab === 'enrollments' && <EnrollmentManagement />}
      {activeTab === 'grades' && <GradeManagement />}
      {activeTab === 'employees' && <EmployeeManagement />}
    </div>
  );
};
