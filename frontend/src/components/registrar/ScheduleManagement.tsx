import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Schedule, Course, Employee, ScheduleType } from '../../types/index.js';
import { useNotification } from '../../hooks/useNotification.js';
import { ValidatedInput } from '../common/ValidatedInput.js';
import { Modal } from '../common/Modal.js';
import { ConfirmDialog } from '../common/ConfirmDialog.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatTime12 } from '../../utils/formatters.js';
import {
  validateTime,
  validateTimeRange,
  validateRequired,
  validateEmployeeId,
} from '../../utils/validation.js';
import { CalendarPlus, Search, Edit2, Trash2, RefreshCw } from 'lucide-react';

export const ScheduleManagement: React.FC = () => {
  const { success, error } = useNotification();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form states
  const [scheduleType, setScheduleType] = useState<ScheduleType>('teaching');
  const [courseId, setCourseId] = useState<number | ''>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState<string>('Monday');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [room, setRoom] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');
  const [semester, setSemester] = useState<string>('1st Semester');

  const loadData = async () => {
    setLoading(true);
    try {
      const [schedData, courseData, empData] = await Promise.all([
        api.getSchedules(),
        api.getCourses().catch(() => []),
        api.getEmployees().catch(() => []),
      ]);
      setSchedules(schedData);
      setCourses(courseData);
      setEmployees(empData);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingSchedule(null);
    setScheduleType('teaching');
    setCourseId(courses[0]?.id || '');
    setEmployeeId(employees[0]?.employee_id || '');
    setDayOfWeek('Monday');
    setStartTime('08:00');
    setEndTime('10:00');
    setRoom('Room 301');
    setAcademicYear('2026-2027');
    setSemester('1st Semester');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Schedule) => {
    setEditingSchedule(s);
    setScheduleType(s.schedule_type);
    setCourseId(s.course_id || '');
    setEmployeeId(s.employee_id);
    setDayOfWeek(s.day_of_week);
    setStartTime(s.start_time);
    setEndTime(s.end_time);
    setRoom(s.room);
    setAcademicYear(s.academic_year);
    setSemester(s.semester);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const empErr = validateEmployeeId(employeeId);
    const startErr = validateTime(startTime);
    const endErr = validateTime(endTime);
    const rangeErr = validateTimeRange(startTime, endTime);
    const roomErr = validateRequired(room, 'Room / Post assignment');

    if (empErr || startErr || endErr || rangeErr || roomErr) {
      error(rangeErr || 'Please correct the highlighted errors in the form');
      return;
    }

    try {
      if (editingSchedule) {
        await api.updateSchedule(editingSchedule.id, {
          schedule_type: scheduleType,
          course_id: scheduleType === 'teaching' && courseId ? Number(courseId) : null,
          employee_id: employeeId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          room,
          academic_year: academicYear,
          semester,
        });
        success(`✓ Schedule slot updated successfully`);
      } else {
        await api.createSchedule({
          schedule_type: scheduleType,
          course_id: scheduleType === 'teaching' && courseId ? Number(courseId) : null,
          employee_id: employeeId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          room,
          academic_year: academicYear,
          semester,
        });
        success(`✓ New schedule slot created successfully`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Server error: unable to save schedule');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteSchedule(deleteTarget.id);
      success(`✓ Schedule slot deleted successfully`);
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to delete schedule');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSchedules = schedules.filter((s) => {
    const matchesSearch =
      s.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      (s.instructor_name && s.instructor_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.course_code && s.course_code.toLowerCase().includes(search.toLowerCase())) ||
      s.room.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'all' || s.schedule_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="management-module">
      <div className="module-toolbar">
        <div className="search-filter-group">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by instructor, subject, room, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Schedule Types</option>
            <option value="teaching">Teaching Loads</option>
            <option value="security_shift">Security Shifts</option>
            <option value="office">Office Schedules</option>
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
          <CalendarPlus size={16} />
          <span>Add Schedule</span>
        </button>
      </div>

      <div className="dashboard-card p-0">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Day</th>
                <th>Time Window</th>
                <th>Subject / Duty</th>
                <th>Assigned Staff</th>
                <th>Room / Post</th>
                <th>Term</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">Loading schedule catalog...</td>
                </tr>
              ) : filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">No schedules found.</td>
                </tr>
              ) : (
                filteredSchedules.map((s) => (
                  <tr key={s.id}>
                    <td><StatusBadge status={s.schedule_type} /></td>
                    <td className="font-semibold">{s.day_of_week}</td>
                    <td className="font-mono">{formatTime12(s.start_time)} - {formatTime12(s.end_time)}</td>
                    <td>
                      {s.schedule_type === 'teaching' ? (
                        <span><strong className="font-mono text-primary">{s.course_code}</strong>: {s.course_name}</span>
                      ) : s.schedule_type === 'security_shift' ? (
                        <span>Security Guard Shift</span>
                      ) : (
                        <span>Staff Office Hours</span>
                      )}
                    </td>
                    <td>
                      {s.instructor_name ? `${s.instructor_name} (${s.employee_id})` : s.employee_id}
                    </td>
                    <td><span className="room-pill">{s.room}</span></td>
                    <td>{s.semester}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn-icon text-primary"
                          onClick={() => openEditModal(s)}
                          title="Edit schedule"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => setDeleteTarget(s)}
                          title="Delete schedule"
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

      {/* Create / Edit Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? `Edit Schedule Slot #${editingSchedule.id}` : 'Create Schedule Slot'}
        maxWidth="580px"
      >
        <form onSubmit={handleSave} className="form-grid">
          <div className="col-6">
            <div className="form-field">
              <label className="field-label">Schedule Type</label>
              <select
                className="field-input"
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
              >
                <option value="teaching">Teaching Load</option>
                <option value="security_shift">Security Shift</option>
                <option value="office">Office Schedule</option>
              </select>
            </div>
          </div>

          <div className="col-6">
            <div className="form-field">
              <label className="field-label">Day of Week</label>
              <select
                className="field-input"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>
          </div>

          {scheduleType === 'teaching' && (
            <div className="col-12">
              <div className="form-field">
                <label className="field-label">Subject / Course</label>
                <select
                  className="field-input"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : '')}
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
          )}

          <div className="col-12">
            <div className="form-field">
              <label className="field-label">Assigned Employee / Staff</label>
              <select
                className="field-input font-mono"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              >
                <option value="">-- Select Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.employee_id}>
                    {emp.employee_id} - {emp.first_name} {emp.last_name} ({emp.position} - {emp.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Start Time (24h HH:MM)"
              value={startTime}
              onChange={setStartTime}
              validator={validateTime}
              placeholder="08:00"
              required
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="End Time (24h HH:MM)"
              value={endTime}
              onChange={setEndTime}
              validator={validateTime}
              placeholder="10:00"
              required
            />
          </div>

          <div className="col-12">
            <ValidatedInput
              label="Assigned Room / Security Post / Office"
              value={room}
              onChange={setRoom}
              validator={(val) => validateRequired(val, 'Room / Post assignment')}
              placeholder="e.g. Lab 2, Room 304, Main Gate Post"
              required
            />
          </div>

          <div className="col-6">
            <div className="form-field">
              <label className="field-label">Semester</label>
              <select
                className="field-input"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
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
              placeholder="2026-2027"
              required
            />
          </div>

          <div className="col-12 modal-footer-actions mt-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingSchedule ? 'Save Changes' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Confirm Schedule Deletion"
        message={`Are you sure you want to delete this schedule slot on ${deleteTarget?.day_of_week} ${deleteTarget?.start_time}-${deleteTarget?.end_time} in ${deleteTarget?.room}?`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Slot'}
        isDanger
      />
    </div>
  );
};
