import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { SafeUser, UserRole, UserStatus } from '../../types/index.js';
import { useNotification } from '../../hooks/useNotification.js';
import { ValidatedInput } from '../common/ValidatedInput.js';
import { Modal } from '../common/Modal.js';
import { ConfirmDialog } from '../common/ConfirmDialog.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatDate, formatRole } from '../../utils/formatters.js';
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from '../../utils/validation.js';
import { UserPlus, Search, Edit2, Trash2, Key, RefreshCw } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { success, error } = useNotification();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SafeUser | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form states
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('student');
  const [status, setStatus] = useState<UserStatus>('active');
  const [studentId, setStudentId] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to fetch user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('student');
    setStatus('active');
    setStudentId('');
    setEmployeeId('');
    setIsCreateOpen(true);
  };

  const openEditModal = (u: SafeUser) => {
    setSelectedUser(u);
    setUsername(u.username);
    setEmail(u.email);
    setRole(u.role);
    setStatus(u.status);
    setStudentId(u.student_id || '');
    setEmployeeId(u.employee_id || '');
    setIsEditOpen(true);
  };

  const openPasswordResetModal = (u: SafeUser) => {
    setSelectedUser(u);
    setNewPassword('');
    setIsPasswordResetOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const uErr = validateRequired(username, 'Username');
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    if (uErr || eErr || pErr) {
      error('Please correct the highlighted errors in the form');
      return;
    }

    try {
      await api.createUser({
        username,
        email,
        password,
        role,
        status,
        student_id: studentId.trim() || null,
        employee_id: employeeId.trim() || null,
      });
      success(`✓ User account @${username} created successfully`);
      setIsCreateOpen(false);
      loadUsers();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to create user account');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const uErr = validateRequired(username, 'Username');
    const eErr = validateEmail(email);

    if (uErr || eErr) {
      error('Please correct the highlighted errors in the form');
      return;
    }

    try {
      await api.updateUser(selectedUser.id, {
        username,
        email,
        role,
        status,
        student_id: studentId.trim() || null,
        employee_id: employeeId.trim() || null,
      });
      success(`✓ User account @${username} updated`);
      setIsEditOpen(false);
      loadUsers();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to update user account');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const pErr = validatePassword(newPassword);
    if (pErr) {
      error(pErr);
      return;
    }

    try {
      await api.updateUser(selectedUser.id, {
        password: newPassword,
      });
      success(`✓ Password for @${selectedUser.username} reset successfully`);
      setIsPasswordResetOpen(false);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteUser(deleteTarget.id);
      success(`✓ User @${deleteTarget.username} deleted`);
      setDeleteTarget(null);
      loadUsers();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.student_id && u.student_id.toLowerCase().includes(search.toLowerCase())) ||
      (u.employee_id && u.employee_id.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
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
              placeholder="Search users by username, email, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Institutional Roles</option>
            <option value="admin">Administrator</option>
            <option value="registrar">Registrar</option>
            <option value="hr">Human Resources</option>
            <option value="employee">Employee / Faculty</option>
            <option value="student">Student</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-icon-only"
            onClick={loadUsers}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <UserPlus size={16} />
          <span>Create Account</span>
        </button>
      </div>

      <div className="dashboard-card p-0">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Institutional Role</th>
                <th>Linked Institutional ID</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">Loading user accounts...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">No accounts matching criteria.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="font-mono text-muted">#{u.id}</td>
                    <td className="font-semibold text-primary">@{u.username}</td>
                    <td>{u.email}</td>
                    <td><span className="role-tag">{formatRole(u.role)}</span></td>
                    <td className="font-mono">{u.student_id || u.employee_id || '—'}</td>
                    <td><StatusBadge status={u.status} /></td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn-icon text-primary"
                          onClick={() => openEditModal(u)}
                          title="Edit role and status"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-warning"
                          onClick={() => openPasswordResetModal(u)}
                          title="Reset account password"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => setDeleteTarget(u)}
                          title="Delete user account"
                          disabled={u.username === 'admin'}
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

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New User Account"
        maxWidth="520px"
      >
        <form onSubmit={handleCreate} className="form-grid">
          <div className="col-12">
            <ValidatedInput
              label="Username"
              value={username}
              onChange={setUsername}
              validator={(val) => validateRequired(val, 'Username')}
              placeholder="e.g. jsmith"
              required
            />
          </div>

          <div className="col-12">
            <ValidatedInput
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              validator={validateEmail}
              placeholder="user@apex.edu or user@gmail.com"
              required
            />
          </div>

          <div className="col-12">
            <ValidatedInput
              label="Password (min 8 chars, 1 uppercase, 1 number)"
              type="password"
              value={password}
              onChange={setPassword}
              validator={validatePassword}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="col-6">
            <div className="form-field">
              <label className="field-label">Institutional Role</label>
              <select
                className="field-input"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="student">Student</option>
                <option value="employee">Employee / Faculty</option>
                <option value="hr">Human Resources</option>
                <option value="registrar">Registrar</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <div className="col-6">
            <div className="form-field">
              <label className="field-label">Account Status</label>
              <select
                className="field-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Linked Student ID (Optional)"
              value={studentId}
              onChange={setStudentId}
              placeholder="STU-2024-XXXX"
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Linked Employee ID (Optional)"
              value={employeeId}
              onChange={setEmployeeId}
              placeholder="EMP-2024-XXXX"
            />
          </div>

          <div className="col-12 modal-footer-actions mt-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create User
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit User: @${selectedUser?.username}`}
        maxWidth="500px"
      >
        <form onSubmit={handleEdit} className="form-grid">
          <div className="col-12">
            <ValidatedInput
              label="Username"
              value={username}
              onChange={setUsername}
              validator={(val) => validateRequired(val, 'Username')}
              required
            />
          </div>

          <div className="col-12">
            <ValidatedInput
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              validator={validateEmail}
              required
            />
          </div>

          <div className="col-6">
            <div className="form-field">
              <label className="field-label">Role</label>
              <select
                className="field-input"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="student">Student</option>
                <option value="employee">Employee / Faculty</option>
                <option value="hr">Human Resources</option>
                <option value="registrar">Registrar</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <div className="col-6">
            <div className="form-field">
              <label className="field-label">Status</label>
              <select
                className="field-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Linked Student ID"
              value={studentId}
              onChange={setStudentId}
              placeholder="STU-YYYY-XXXX"
            />
          </div>

          <div className="col-6">
            <ValidatedInput
              label="Linked Employee ID"
              value={employeeId}
              onChange={setEmployeeId}
              placeholder="EMP-YYYY-XXXX"
            />
          </div>

          <div className="col-12 modal-footer-actions mt-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={isPasswordResetOpen}
        onClose={() => setIsPasswordResetOpen(false)}
        title={`Reset Password for @${selectedUser?.username}`}
        maxWidth="440px"
      >
        <form onSubmit={handleResetPassword} className="form-grid">
          <div className="col-12">
            <ValidatedInput
              label="New Secure Password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              validator={validatePassword}
              placeholder="Must include 1 uppercase & 1 number"
              helpText="Minimum 8 characters, at least 1 uppercase and 1 number"
              required
            />
          </div>

          <div className="col-12 modal-footer-actions mt-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsPasswordResetOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-warning">
              Reset Password
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Confirm User Account Deletion"
        message={`Are you sure you want to delete the user account @${deleteTarget?.username}? This action is irreversible.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete User'}
        isDanger
      />
    </div>
  );
};
