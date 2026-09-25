import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Enrollment, Student, Course, Schedule, EnrollmentStatus } from '../../types/index.js';
import { useNotification } from '../../hooks/useNotification.js';
import { ValidatedInput } from '../common/ValidatedInput.js';
import { Modal } from '../common/Modal.js';
import { ConfirmDialog } from '../common/ConfirmDialog.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatDate } from '../../utils/formatters.js';
import { validateStudentId, validateRequired } from '../../utils/validation.js';
import { Layers, Search, Edit2, Trash2, RefreshCw } from 'lucide-react';

export const EnrollmentManagement: React.FC = () => {
  const { success, error } = useNotification();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form states
  const [studentId, setStudentId] = useState<string>('');
  const [courseId, setCourseId] = useState<number | ''>('');
  const [scheduleId, setScheduleId] = useState<number | ''>('');
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');
  const [semester, setSemester] = useState<string>('1st Semester');
  const [status, setStatus] = useState<EnrollmentStatus>('enrolled');

  const loadData = async () => {
    setLoading(true);
    try {
      const [enrollData, stuData, courseData, schedData] = await Promise.all([
        api.getEnrollments(),
        api.getStudents().catch(() => []),
        api.getCourses().catch(() => []),
        api.getSchedules().catch(() => []),
      ]);
      setEnrollments(enrollData);
      setStudents(stuData);
      setCourses(courseData);
      setSchedules(schedData);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to fetch enrollment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingEnrollment(null);
    setStudentId(students[0]?.student_id || '');
    setCourseId(courses[0]?.id || '');
    setScheduleId('');
    setAcademicYear('2026-2027');
    setSemester('1st Semester');
    setStatus('enrolled');
    setIsModalOpen(true);
  };

  const openEditModal = (en: Enrollment) => {
    setEditingEnrollment(en);
    setStudentId(en.student_id);
    setCourseId(en.course_id);
    setScheduleId(en.schedule_id || '');
    setAcademicYear(en.academic_year);
    setSemester(en.semester);
    setStatus(en.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const idErr = validateStudentId(studentId);
    if (idErr || !courseId) {
      error(idErr || 'Please select a valid subject');
      return;
    }

    try {
      if (editingEnrollment) {
        await api.updateEnrollment(editingEnrollment.id, {
          schedule_id: scheduleId ? Number(scheduleId) : null,
          status,
        });
        success(`✓ Enrollment record updated`);
      } else {
        await api.createEnrollment({
          student_id: studentId,
          course_id: Number(courseId),
          schedule_id: scheduleId ? Number(scheduleId) : null,
          academic_year: academicYear,
          semester,
          status,
        });
        success(`✓ Enrolled student ${studentId} into course`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Server error: unable to process enrollment');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteEnrollment(deleteTarget.id);
      success(`✓ Enrollment record deleted`);
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to delete enrollment');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesSearch =
      e.student_id.toLowerCase().includes(search.toLowerCase()) ||
      (e.student_name && e.student_name.toLowerCase().includes(search.toLowerCase())) ||
      (e.course_code && e.course_code.toLowerCase().includes(search.toLowerCase())) ||
      (e.course_name && e.course_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter schedules that match selected course
  const availableSchedules = schedules.filter(
    (s) => s.schedule_type === 'teaching' && (!courseId || s.course_id === Number(courseId))
  );

  return (
    <div className="management-module">
      <div className="module-toolbar">
        <div className="search-filter-group">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search enrollments by student, subject, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="enrolled">Enrolled</option>
            <option value="dropped">Dropped</option>
            <option value="completed">Completed</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-icon-only"
            onClick={loadData}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <Layers size={16} />
          <span>New Enrollment</span>
        </button>
      </div>

      <div className="dashboard-card p-0">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Subject Code</th>
                <th>Subject Title</th>
                <th>Units</th>
                <th>Schedule Slot</th>
                <th>Enrolled Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">Loading enrollment records...</td>
                </tr>
              ) : filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">No enrollment records found.</td>
                </tr>
              ) : (
                filteredEnrollments.map((e) => (
                  <tr key={e.id}>
                    <td className="font-mono font-bold text-primary">{e.student_id}</td>
                    <td className="font-medium">{e.student_name}</td>
                    <td className="font-mono font-semibold">{e.course_code}</td>
                    <td>{e.course_name}</td>
                    <td>{e.credits || 3}</td>
                    <td>
                      {e.schedule_day ? (
                        <span>{e.schedule_day} ({e.start_time}-{e.end_time}, {e.room})</span>
                      ) : (
                        <span className="text-muted">Unscheduled</span>
                      )}
                    </td>
                    <td>{formatDate(e.enrolled_at)}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn-icon text-primary"
                          onClick={() => openEditModal(e)}
                          title="Edit enrollment status / schedule"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => setDeleteTarget(e)}
                          title="Delete enrollment"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Enrollment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEnrollment ? `Edit Enrollment #${editingEnrollment.id}` : 'Enroll Student in Subject'}
        maxWidth="540px"
      >
        <form onSubmit={handleSave} className="form-grid">
          <div className="col-12">
            <div className="form-field">
              <label className="field-label">Student</label>
              <select
                className="field-input font-mono"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={Boolean(editingEnrollment)}
                required
              >
                <option value="">-- Select Student --</option>
                {students.map((stu) => (
                  <option key={stu.id} value={stu.student_id}>
                    {stu.student_id} - {stu.first_name} {stu.last_name} ({stu.program})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-12">
            <div className="form-field">
              <label className="field-label">Course / Subject</label>
              <select
                className="field-input"
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value ? Number(e.target.value) : '');
                  setScheduleId('');
                }}
                disabled={Boolean(editingEnrollment)}
                required
              >
                <option value="">-- Select Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_code}: {c.course_name} ({c.credits} units)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-12">
            <div className="form-field">
              <label className="field-label">Class Schedule Slot (Optional)</label>
              <select
                className="field-input"
                value={scheduleId}
                onChange={(e) => setScheduleId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Select Schedule Slot (or leave unscheduled) --</option>
                {availableSchedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.day_of_week} {s.start_time}-{s.end_time} | Room: {s.room} | Instructor: {s.instructor_name || s.employee_id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-6">
            <div className="form-field">
              <label className="field-label">Semester</label>
              <select
                className="field-input"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                disabled={Boolean(editingEnrollment)}
              >
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Academic Year"
              value={academicYear}
              onChange={setAcademicYear}
              validator={(val) => validateRequired(val, 'Academic year')}
              disabled={Boolean(editingEnrollment)}
              required
            />
          </div>

          {editingEnrollment && (
            <div className="col-12">
              <div className="form-field">
                <label className="field-label">Enrollment Status</label>
                <select
                  className="field-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EnrollmentStatus)}
                >
                  <option value="enrolled">Enrolled</option>
                  <option value="dropped">Dropped</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          )}

          <div className="col-12 modal-footer-actions mt-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingEnrollment ? 'Save Changes' : 'Confirm Enrollment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Confirm Enrollment Removal"
        message={`Are you sure you want to remove the enrollment of ${deleteTarget?.student_name} (${deleteTarget?.student_id}) from ${deleteTarget?.course_code}? Any encoded grade for this enrollment will also be deleted.`}
        confirmText={isDeleting ? 'Removing...' : 'Delete Enrollment'}
        isDanger
      />
    </div>
  );
};
