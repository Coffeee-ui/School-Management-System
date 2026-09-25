import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Course } from '../../types/index.js';
import { useNotification } from '../../hooks/useNotification.js';
import { ValidatedInput } from '../common/ValidatedInput.js';
import { Modal } from '../common/Modal.js';
import { ConfirmDialog } from '../common/ConfirmDialog.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { validateRequired } from '../../utils/validation.js';
import { PlusCircle, Search, Edit2, Trash2, RefreshCw } from 'lucide-react';

export const CourseManagement: React.FC = () => {
  const { success, error } = useNotification();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form states
  const [courseCode, setCourseCode] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [credits, setCredits] = useState<number>(3);
  const [department, setDepartment] = useState<string>('College of Computer Studies');
  const [semester, setSemester] = useState<string>('1st Semester');
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await api.getCourses();
      setCourses(data);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const openCreateModal = () => {
    setEditingCourse(null);
    setCourseCode('');
    setCourseName('');
    setDescription('');
    setCredits(3);
    setDepartment('College of Computer Studies');
    setSemester('1st Semester');
    setAcademicYear('2026-2027');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Course) => {
    setEditingCourse(c);
    setCourseCode(c.course_code);
    setCourseName(c.course_name);
    setDescription(c.description || '');
    setCredits(c.credits);
    setDepartment(c.department);
    setSemester(c.semester);
    setAcademicYear(c.academic_year);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const codeErr = validateRequired(courseCode, 'Course code');
    const nameErr = validateRequired(courseName, 'Course title');

    if (codeErr || nameErr) {
      error('Please correct the highlighted errors in the form');
      return;
    }

    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, {
          course_code: courseCode.toUpperCase(),
          course_name: courseName,
          description: description || null,
          credits,
          department,
          semester,
          academic_year: academicYear,
        });
        success(`✓ Course ${courseCode.toUpperCase()} updated successfully`);
      } else {
        await api.createCourse({
          course_code: courseCode.toUpperCase(),
          course_name: courseName,
          description: description || null,
          credits,
          department,
          semester,
          academic_year: academicYear,
          status: 'active',
        });
        success(`✓ Course ${courseCode.toUpperCase()} created successfully`);
      }
      setIsModalOpen(false);
      loadCourses();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Server error: unable to save course');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteCourse(deleteTarget.id);
      success(`✓ Course ${deleteTarget.course_code} removed successfully`);
      setDeleteTarget(null);
      loadCourses();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to delete course');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.course_code.toLowerCase().includes(search.toLowerCase()) ||
      c.course_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()));

    const matchesDept = deptFilter === 'all' || c.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(courses.map((c) => c.department))).filter(Boolean);

  return (
    <div className="management-module">
      <div className="module-toolbar">
        <div className="search-filter-group">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search courses by code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-icon-only"
            onClick={loadCourses}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <PlusCircle size={16} />
          <span>Add Course</span>
        </button>
      </div>

      <div className="dashboard-card p-0">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Department</th>
                <th>Units</th>
                <th>Term</th>
                <th>Academic Year</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">Loading course catalog...</td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">No course records found.</td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono font-bold text-primary">{c.course_code}</td>
                    <td className="font-medium">{c.course_name}</td>
                    <td>{c.department}</td>
                    <td>{c.credits}</td>
                    <td>{c.semester}</td>
                    <td className="font-mono">{c.academic_year}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn-icon text-primary"
                          onClick={() => openEditModal(c)}
                          title="Edit course details"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => setDeleteTarget(c)}
                          title="Delete course"
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

      {/* Create / Edit Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? `Edit Course: ${editingCourse.course_code}` : 'Add New Course'}
        maxWidth="540px"
      >
        <form onSubmit={handleSave} className="form-grid">
          <div className="col-6">
            <ValidatedInput
              label="Course Code (e.g. CS101)"
              value={courseCode}
              onChange={setCourseCode}
              validator={(val) => validateRequired(val, 'Course code')}
              placeholder="CS101"
              required
            />
          </div>

          <div className="col-6">
            <div className="form-field">
              <label className="field-label">Credit Units</label>
              <input
                type="number"
                min={1}
                max={6}
                className="field-input"
                value={credits}
                onChange={(e) => setCredits(parseInt(e.target.value, 10) || 3)}
                required
              />
            </div>
          </div>

          <div className="col-12">
            <ValidatedInput
              label="Course Title"
              value={courseName}
              onChange={setCourseName}
              validator={(val) => validateRequired(val, 'Course title')}
              placeholder="e.g. Advanced Operating Systems"
              required
            />
          </div>

          <div className="col-12">
            <ValidatedInput
              label="Course Description (Optional)"
              value={description}
              onChange={setDescription}
              placeholder="Overview and objectives of this subject..."
            />
          </div>

          <div className="col-12">
            <div className="form-field">
              <label className="field-label">Department</label>
              <select
                className="field-input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="College of Computer Studies">College of Computer Studies</option>
                <option value="College of Engineering">College of Engineering</option>
                <option value="College of Business">College of Business</option>
                <option value="General Education">General Education</option>
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
              {editingCourse ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Confirm Course Deletion"
        message={`Are you sure you want to delete ${deleteTarget?.course_code} - ${deleteTarget?.course_name}? This will remove related enrollments and schedules.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Course'}
        isDanger
      />
    </div>
  );
};
