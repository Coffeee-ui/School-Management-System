import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Student, StudentStatus } from '../../types/index.js';
import { useNotification } from '../../hooks/useNotification.js';
import { ValidatedInput } from '../common/ValidatedInput.js';
import { Modal } from '../common/Modal.js';
import { ConfirmDialog } from '../common/ConfirmDialog.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatDate } from '../../utils/formatters.js';
import {
  validateStudentId,
  validateContactNumber,
  validateEmail,
  validateCalendarDate,
  validateRequired,
} from '../../utils/validation.js';
import { UserPlus, Search, Edit2, Trash2, RefreshCw } from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const { success, error } = useNotification();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [programFilter, setProgramFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form states
  const [studentId, setStudentId] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [middleName, setMiddleName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');
  const [address, setAddress] = useState<string>('');
  const [program, setProgram] = useState<string>('BS Computer Science');
  const [yearLevel, setYearLevel] = useState<number>(1);
  const [status, setStatus] = useState<StudentStatus>('enrolled');

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const openCreateModal = () => {
    setEditingStudent(null);
    setStudentId('');
    setFirstName('');
    setLastName('');
    setMiddleName('');
    setEmail('');
    setContactNumber('');
    setDateOfBirth('');
    setGender('Male');
    setAddress('');
    setProgram('BS Computer Science');
    setYearLevel(1);
    setStatus('enrolled');
    setIsModalOpen(true);
  };

  const openEditModal = (stu: Student) => {
    setEditingStudent(stu);
    setStudentId(stu.student_id);
    setFirstName(stu.first_name);
    setLastName(stu.last_name);
    setMiddleName(stu.middle_name || '');
    setEmail(stu.email);
    setContactNumber(stu.contact_number);
    setDateOfBirth(stu.date_of_birth);
    setGender(stu.gender);
    setAddress(stu.address);
    setProgram(stu.program);
    setYearLevel(stu.year_level);
    setStatus(stu.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Authoritative validations
    const idErr = validateStudentId(studentId);
    const fnErr = validateRequired(firstName, 'First name');
    const lnErr = validateRequired(lastName, 'Last name');
    const emailErr = validateEmail(email);
    const phoneErr = validateContactNumber(contactNumber);
    const dobErr = validateCalendarDate(dateOfBirth);
    const addrErr = validateRequired(address, 'Address');

    if (idErr || fnErr || lnErr || emailErr || phoneErr || dobErr || addrErr) {
      error('Please correct the highlighted errors in the form');
      return;
    }

    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          student_id: studentId,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName || null,
          email,
          contact_number: contactNumber,
          date_of_birth: dateOfBirth,
          gender,
          address,
          program,
          year_level: yearLevel,
          status,
        });
        success(`✓ Student record ${studentId} updated successfully`);
      } else {
        await api.createStudent({
          student_id: studentId,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName || null,
          email,
          contact_number: contactNumber,
          date_of_birth: dateOfBirth,
          gender,
          address,
          program,
          year_level: yearLevel,
          status,
        });
        success(`✓ Student ${studentId} enrolled successfully`);
      }
      setIsModalOpen(false);
      loadStudents();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Server error: unable to save student');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteStudent(deleteTarget.id);
      success(`✓ Student ${deleteTarget.student_id} removed successfully`);
      setDeleteTarget(null);
      loadStudents();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStudents = students.filter((stu) => {
    const matchesSearch =
      stu.student_id.toLowerCase().includes(search.toLowerCase()) ||
      stu.first_name.toLowerCase().includes(search.toLowerCase()) ||
      stu.last_name.toLowerCase().includes(search.toLowerCase()) ||
      stu.email.toLowerCase().includes(search.toLowerCase()) ||
      stu.program.toLowerCase().includes(search.toLowerCase());

    const matchesProgram = programFilter === 'all' || stu.program === programFilter;
    return matchesSearch && matchesProgram;
  });

  const programs = Array.from(new Set(students.map((s) => s.program))).filter(Boolean);

  return (
    <div className="management-module">
      <div className="module-toolbar">
        <div className="search-filter-group">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search students by ID, name, email, or program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
          >
            <option value="all">All Academic Programs</option>
            {programs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-icon-only"
            onClick={loadStudents}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <UserPlus size={16} />
          <span>Register Student</span>
        </button>
      </div>

      <div className="dashboard-card p-0">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Full Name</th>
                <th>Program</th>
                <th>Year</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Date of Birth</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">Loading student records...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">No student records found.</td>
                </tr>
              ) : (
                filteredStudents.map((stu) => (
                  <tr key={stu.id}>
                    <td className="font-mono font-bold text-primary">{stu.student_id}</td>
                    <td className="font-medium">
                      {stu.first_name} {stu.middle_name ? `${stu.middle_name} ` : ''}{stu.last_name}
                    </td>
                    <td>{stu.program}</td>
                    <td>Year {stu.year_level}</td>
                    <td className="font-mono">{stu.contact_number}</td>
                    <td>{stu.email}</td>
                    <td>{formatDate(stu.date_of_birth)}</td>
                    <td><StatusBadge status={stu.status} /></td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn-icon text-primary"
                          onClick={() => openEditModal(stu)}
                          title="Edit student record"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => setDeleteTarget(stu)}
                          title="Delete student"
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

      {/* Create / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? `Edit Student: ${editingStudent.student_id}` : 'Enroll New Student'}
        maxWidth="640px"
      >
        <form onSubmit={handleSave} className="form-grid">
          <div className="col-12">
            <ValidatedInput
              label="Student ID (Format: STU-YYYY-XXXX)"
              value={studentId}
              onChange={setStudentId}
              validator={validateStudentId}
              placeholder="STU-2024-0001"
              required
              disabled={Boolean(editingStudent)}
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="First Name"
              value={firstName}
              onChange={setFirstName}
              validator={(val) => validateRequired(val, 'First name')}
              placeholder="e.g. Maria"
              required
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Last Name"
              value={lastName}
              onChange={setLastName}
              validator={(val) => validateRequired(val, 'Last name')}
              placeholder="e.g. Santos"
              required
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Middle Name (Optional)"
              value={middleName}
              onChange={setMiddleName}
              placeholder="e.g. Clara"
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              validator={validateEmail}
              placeholder="student@gmail.com"
              required
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Contact Number (11 digits, starts with 09)"
              value={contactNumber}
              onChange={setContactNumber}
              validator={validateContactNumber}
              placeholder="09123456789"
              required
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Date of Birth (YYYY-MM-DD)"
              value={dateOfBirth}
              onChange={setDateOfBirth}
              validator={validateCalendarDate}
              placeholder="2005-08-15"
              required
            />
          </div>

          <div className="col-6">
            <div className="form-field">
              <label className="field-label">Gender</label>
              <select
                className="field-input"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="col-6">
            <div className="form-field">
              <label className="field-label">Year Level</label>
              <select
                className="field-input"
                value={yearLevel}
                onChange={(e) => setYearLevel(Number(e.target.value))}
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>
          </div>

          <div className="col-12">
            <div className="form-field">
              <label className="field-label">Academic Program</label>
              <select
                className="field-input"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              >
                <option value="BS Computer Science">BS Computer Science</option>
                <option value="BS Information Technology">BS Information Technology</option>
                <option value="BS Civil Engineering">BS Civil Engineering</option>
                <option value="BS Electrical Engineering">BS Electrical Engineering</option>
                <option value="BS Business Administration">BS Business Administration</option>
                <option value="BS Accountancy">BS Accountancy</option>
              </select>
            </div>
          </div>

          <div className="col-12">
            <ValidatedInput
              label="Home Address"
              value={address}
              onChange={setAddress}
              validator={(val) => validateRequired(val, 'Home address')}
              placeholder="House/Unit #, Street, Barangay, City"
              required
            />
          </div>

          {editingStudent && (
            <div className="col-6">
              <div className="form-field">
                <label className="field-label">Status</label>
                <select
                  className="field-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StudentStatus)}
                >
                  <option value="enrolled">Enrolled</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                  <option value="dropped">Dropped</option>
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
              {editingStudent ? 'Update Student' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Confirm Student Deletion"
        message={`Are you sure you want to delete the student record for ${deleteTarget?.first_name} ${deleteTarget?.last_name} (${deleteTarget?.student_id})? This will also remove associated enrollments and grades.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Record'}
        isDanger
      />
    </div>
  );
};
