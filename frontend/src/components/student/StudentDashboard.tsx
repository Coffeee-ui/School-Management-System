import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../services/api.js';
import { Enrollment, Schedule, Grade, Student } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatDate, formatTime12 } from '../../utils/formatters.js';
import { BookOpen, Calendar, Award, User, RefreshCw } from 'lucide-react';

interface StudentDashboardProps {
  activeTab: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ activeTab }) => {
  const { user, profile } = useAuth();
  const [student, setStudent] = useState<Student | null>(profile as Student | null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gwa, setGwa] = useState<number>(0);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, enrollmentsRes, schedulesRes, gradesRes] = await Promise.all([
        api.getStudentProfile().catch(() => null),
        api.getSelfEnrollments().catch(() => []),
        api.getSelfSchedules().catch(() => []),
        api.getSelfGrades().catch(() => ({ grades: [], gwa: 0, totalCredits: 0, courseCount: 0 })),
      ]);

      if (profileRes) setStudent(profileRes);
      setEnrollments(enrollmentsRes);
      setSchedules(schedulesRes);
      setGrades(gradesRes.grades || []);
      setGwa(gradesRes.gwa || 0);
      setTotalCredits(gradesRes.totalCredits || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !student) {
    return <div className="loading-state">Loading student records...</div>;
  }

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Student Portal</h1>
          <p className="page-subtitle">Welcome, {student ? `${student.first_name} ${student.last_name}` : user?.username}</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={loadData}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-primary">
            <User size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Student ID</span>
            <span className="kpi-value">{student?.student_id || 'N/A'}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-info">
            <BookOpen size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Enrolled Courses</span>
            <span className="kpi-value">{enrollments.length}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-warning">
            <Award size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">General Weighted Average</span>
            <span className="kpi-value">{gwa > 0 ? gwa.toFixed(2) : '—'}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-success">
            <Calendar size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Earned Units</span>
            <span className="kpi-value">{totalCredits}</span>
          </div>
        </div>
      </div>

      {/* Profile Tab */}
      {(activeTab === 'profile' || activeTab === 'overview') && (
        <section className="dashboard-card mb-4" aria-labelledby="profile-heading">
          <div className="card-header">
            <h2 id="profile-heading" className="card-title">Academic & Personal Profile</h2>
            <StatusBadge status={student?.status || 'enrolled'} />
          </div>
          <div className="card-body">
            <div className="profile-grid">
              <div className="profile-field">
                <span className="profile-field-label">Full Name</span>
                <span className="profile-field-value">
                  {student?.first_name} {student?.middle_name ? `${student.middle_name} ` : ''}{student?.last_name}
                </span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Student ID</span>
                <span className="profile-field-value font-mono">{student?.student_id}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Program / Major</span>
                <span className="profile-field-value">{student?.program}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Year Level</span>
                <span className="profile-field-value">Year {student?.year_level}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Institutional Email</span>
                <span className="profile-field-value">{student?.email}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Contact Number</span>
                <span className="profile-field-value font-mono">{student?.contact_number}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Date of Birth</span>
                <span className="profile-field-value">{formatDate(student?.date_of_birth)}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Gender</span>
                <span className="profile-field-value">{student?.gender}</span>
              </div>
              <div className="profile-field span-2">
                <span className="profile-field-label">Home Address</span>
                <span className="profile-field-value">{student?.address}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Enrolled Courses Tab */}
      {(activeTab === 'courses' || activeTab === 'overview') && (
        <section className="dashboard-card mb-4" aria-labelledby="courses-heading">
          <div className="card-header">
            <h2 id="courses-heading" className="card-title">Enrolled Courses</h2>
            <span className="card-count">{enrollments.length} subjects</span>
          </div>
          <div className="card-body p-0">
            {enrollments.length === 0 ? (
              <div className="empty-state">No courses currently enrolled.</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Title</th>
                      <th>Units</th>
                      <th>Schedule / Room</th>
                      <th>Instructor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((e) => (
                      <tr key={e.id}>
                        <td className="font-mono font-bold text-primary">{e.course_code}</td>
                        <td>{e.course_name}</td>
                        <td>{e.credits || 3}</td>
                        <td>
                          {e.schedule_day ? (
                            <span>{e.schedule_day} {formatTime12(e.start_time || '')} - {formatTime12(e.end_time || '')} ({e.room})</span>
                          ) : (
                            <span className="text-muted">TBA</span>
                          )}
                        </td>
                        <td>{e.instructor_name || 'TBA'}</td>
                        <td><StatusBadge status={e.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Schedules Tab */}
      {(activeTab === 'schedules' || activeTab === 'overview') && (
        <section className="dashboard-card mb-4" aria-labelledby="schedules-heading">
          <div className="card-header">
            <h2 id="schedules-heading" className="card-title">Class Schedules</h2>
          </div>
          <div className="card-body p-0">
            {schedules.length === 0 ? (
              <div className="empty-state">No class schedules assigned yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Time</th>
                      <th>Course</th>
                      <th>Room</th>
                      <th>Instructor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((s, idx) => (
                      <tr key={idx}>
                        <td className="font-semibold">{s.day_of_week}</td>
                        <td className="font-mono">{formatTime12(s.start_time)} - {formatTime12(s.end_time)}</td>
                        <td>
                          <span className="font-mono font-bold">{s.course_code}</span> — {s.course_name}
                        </td>
                        <td><span className="room-pill">{s.room}</span></td>
                        <td>{s.instructor_name || 'Assigned Faculty'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Grades & GWA Tab */}
      {(activeTab === 'grades' || activeTab === 'overview') && (
        <section className="dashboard-card mb-4" aria-labelledby="grades-heading">
          <div className="card-header">
            <h2 id="grades-heading" className="card-title">Academic Grades & GWA</h2>
            {gwa > 0 && (
              <div className="gwa-pill">
                <span>Calculated GWA:</span>
                <strong>{gwa.toFixed(2)}</strong>
              </div>
            )}
          </div>
          <div className="card-body p-0">
            {grades.length === 0 ? (
              <div className="empty-state">No encoded grades available for the current term.</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Units</th>
                      <th>Final Grade</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g) => (
                      <tr key={g.id}>
                        <td className="font-mono font-bold text-primary">{g.course_code}</td>
                        <td>{g.course_name}</td>
                        <td>{g.credits || 3}</td>
                        <td className="font-mono font-bold">{Number(g.grade).toFixed(2)}</td>
                        <td><StatusBadge status={g.remarks} /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="tfoot-summary">
                      <td colSpan={2} className="text-right font-bold">General Weighted Average (GWA):</td>
                      <td className="font-bold">{totalCredits} units</td>
                      <td className="font-mono font-bold text-primary">{gwa > 0 ? gwa.toFixed(2) : '—'}</td>
                      <td>
                        <StatusBadge status={gwa <= 3.0 ? 'passing' : 'failed'} />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
