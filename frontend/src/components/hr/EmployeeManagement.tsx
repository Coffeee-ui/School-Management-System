import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Employee, EmployeeStatus } from '../../types/index.js';
import { useNotification } from '../../hooks/useNotification.js';
import { ValidatedInput } from '../common/ValidatedInput.js';
import { Modal } from '../common/Modal.js';
import { ConfirmDialog } from '../common/ConfirmDialog.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatDate } from '../../utils/formatters.js';
import {
  validateEmployeeId,
  validateContactNumber,
  validateEmail,
  validateCalendarDate,
  validateRequired,
} from '../../utils/validation.js';
import { UserPlus, Search, Edit2, Trash2, RefreshCw } from 'lucide-react';

export const EmployeeManagement: React.FC = () => {
  const { success, error } = useNotification();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form states
  const [employeeId, setEmployeeId] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [middleName, setMiddleName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');
  const [hireDate, setHireDate] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [status, setStatus] = useState<EmployeeStatus>('active');

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setEmployeeId('');
    setFirstName('');
    setLastName('');
    setMiddleName('');
    setEmail('');
    setContactNumber('');
    setDateOfBirth('');
    setGender('Male');
    setHireDate(new Date().toISOString().split('T')[0]);
    setPosition('');
    setDepartment('College of Computer Studies');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeId(emp.employee_id);
    setFirstName(emp.first_name);
    setLastName(emp.last_name);
    setMiddleName(emp.middle_name || '');
    setEmail(emp.email);
    setContactNumber(emp.contact_number);
    setDateOfBirth(emp.date_of_birth);
    setGender(emp.gender);
    setHireDate(emp.hire_date);
    setPosition(emp.position);
    setDepartment(emp.department);
    setStatus(emp.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Authoritative field validations
    const idErr = validateEmployeeId(employeeId);
    const fnErr = validateRequired(firstName, 'First name');
    const lnErr = validateRequired(lastName, 'Last name');
    const emailErr = validateEmail(email);
    const phoneErr = validateContactNumber(contactNumber);
    const dobErr = validateCalendarDate(dateOfBirth);
    const hireErr = validateCalendarDate(hireDate);
    const posErr = validateRequired(position, 'Position');
    const deptErr = validateRequired(department, 'Department');

    if (idErr || fnErr || lnErr || emailErr || phoneErr || dobErr || hireErr || posErr || deptErr) {
      error('Please correct the highlighted errors in the form');
      return;
    }

    try {
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, {
          employee_id: employeeId,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName || null,
          email,
          contact_number: contactNumber,
          date_of_birth: dateOfBirth,
          gender,
          hire_date: hireDate,
          position,
          department,
          status,
        });
        success(`✓ Employee record ${employeeId} updated successfully`);
      } else {
        await api.createEmployee({
          employee_id: employeeId,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName || null,
          email,
          contact_number: contactNumber,
          date_of_birth: dateOfBirth,
          gender,
          hire_date: hireDate,
          position,
          department,
          status,
        });
        success(`✓ Employee ${employeeId} created successfully`);
      }
      setIsModalOpen(false);
      loadEmployees();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Server error: unable to save employee');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteEmployee(deleteTarget.id);
      success(`✓ Employee ${deleteTarget.employee_id} deleted successfully`);
      setDeleteTarget(null);
      loadEmployees();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to delete employee');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      emp.first_name.toLowerCase().includes(search.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase());

    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);

  return (
    <div className="management-module">
      <div className="module-toolbar">
        <div className="search-filter-group">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by ID, name, email, or role..."
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
            onClick={loadEmployees}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <UserPlus size={16} />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="dashboard-card p-0">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Full Name</th>
                <th>Department</th>
                <th>Position</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Hire Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">Loading employee directory...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">No employee records found.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="font-mono font-bold text-primary">{emp.employee_id}</td>
                    <td className="font-medium">
                      {emp.first_name} {emp.middle_name ? `${emp.middle_name} ` : ''}{emp.last_name}
                    </td>
                    <td>{emp.department}</td>
                    <td>{emp.position}</td>
                    <td className="font-mono">{emp.contact_number}</td>
                    <td>{emp.email}</td>
                    <td>{formatDate(emp.hire_date)}</td>
                    <td><StatusBadge status={emp.status} /></td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn-icon text-primary"
                          onClick={() => openEditModal(emp)}
                          title="Edit employee record"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => setDeleteTarget(emp)}
                          title="Delete employee"
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

      {/* Create / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? `Edit Employee Record: ${editingEmployee.employee_id}` : 'Create New Employee'}
        maxWidth="640px"
      >
        <form onSubmit={handleSave} className="form-grid">
          <div className="col-12">
            <ValidatedInput
              label="Employee ID (Format: EMP-YYYY-XXXX)"
              value={employeeId}
              onChange={setEmployeeId}
              validator={validateEmployeeId}
              placeholder="EMP-2024-0001"
              required
              disabled={Boolean(editingEmployee)}
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="First Name"
              value={firstName}
              onChange={setFirstName}
              validator={(val) => validateRequired(val, 'First name')}
              placeholder="e.g. John"
              required
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Last Name"
              value={lastName}
              onChange={setLastName}
              validator={(val) => validateRequired(val, 'Last name')}
              placeholder="e.g. Smith"
              required
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Middle Name (Optional)"
              value={middleName}
              onChange={setMiddleName}
              placeholder="e.g. David"
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              validator={validateEmail}
              placeholder="user@apex.edu"
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
              placeholder="1985-05-20"
              required
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Hire Date (YYYY-MM-DD)"
              value={hireDate}
              onChange={setHireDate}
              validator={validateCalendarDate}
              placeholder="2020-01-15"
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
            <ValidatedInput
              label="Position / Role Title"
              value={position}
              onChange={setPosition}
              validator={(val) => validateRequired(val, 'Position')}
              placeholder="e.g. Associate Professor, Security Officer"
              required
            />
          </div>

          <div className="col-6">
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
                <option value="Campus Security Office">Campus Security Office</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Registrar Office">Registrar Office</option>
                <option value="Administration">Administration</option>
              </select>
            </div>
          </div>

          {editingEmployee && (
            <div className="col-6">
              <div className="form-field">
                <label className="field-label">Status</label>
                <select
                  className="field-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                  <option value="terminated">Terminated</option>
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
              {editingEmployee ? 'Update Employee' : 'Create Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Confirm Employee Deletion"
        message={`Are you sure you want to delete employee record for ${deleteTarget?.first_name} ${deleteTarget?.last_name} (${deleteTarget?.employee_id})? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Employee'}
        isDanger
      />
    </div>
  );
};
