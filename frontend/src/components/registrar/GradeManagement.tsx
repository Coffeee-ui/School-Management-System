import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Grade, Enrollment } from '../../types/index.js';
import { useNotification } from '../../hooks/useNotification.js';
import { ValidatedInput } from '../common/ValidatedInput.js';
import { Modal } from '../common/Modal.js';
import { ConfirmDialog } from '../common/ConfirmDialog.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { formatDate } from '../../utils/formatters.js';
import { validateGrade, computeGradeRemarks } from '../../utils/validation.js';
import { Award, Search, Edit2, Trash2, RefreshCw } from 'lucide-react';

export const GradeManagement: React.FC = () => {
  const { success, error } = useNotification();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Grade | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form states
  const [enrollmentId, setEnrollmentId] = useState<number | ''>('');
  const [gradeValue, setGradeValue] = useState<string>('1.75');

  const loadData = async () => {
    setLoading(true);
    try {
      const [gradesData, enrollData] = await Promise.all([
        api.getGrades(),
        api.getEnrollments().catch(() => []),
      ]);
      setGrades(gradesData);
      setEnrollments(enrollData);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to fetch grades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingGrade(null);
    // Find first enrollment without grade
    const unencoded = enrollments.filter(
      (en) => !grades.some((g) => g.enrollment_id === en.id)
    );
    setEnrollmentId(unencoded[0]?.id || enrollments[0]?.id || '');
    setGradeValue('1.75');
    setIsModalOpen(true);
  };

  const openEditModal = (g: Grade) => {
    setEditingGrade(g);
    setEnrollmentId(g.enrollment_id);
    setGradeValue(String(g.grade));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const gradeErr = validateGrade(gradeValue);
    if (gradeErr || !enrollmentId) {
      error(gradeErr || 'Please select an enrollment record');
      return;
    }

    try {
      if (editingGrade) {
        await api.updateGrade(editingGrade.id, {
          grade: Number(gradeValue),
        });
        success(`✓ Grade updated to ${Number(gradeValue).toFixed(2)}`);
      } else {
        await api.createGrade({
          enrollment_id: Number(enrollmentId),
          grade: Number(gradeValue),
        });
        success(`✓ Grade encoded successfully`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Server error: unable to encode grade');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteGrade(deleteTarget.id);
      success(`✓ Grade record deleted`);
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to delete grade record');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredGrades = grades.filter((g) => {
    const s = search.toLowerCase();
    return (
      g.student_id.toLowerCase().includes(s) ||
      (g.student_name && g.student_name.toLowerCase().includes(s)) ||
      (g.course_code && g.course_code.toLowerCase().includes(s)) ||
      (g.course_name && g.course_name.toLowerCase().includes(s)) ||
      g.remarks.toLowerCase().includes(s)
    );
  });

  const numericGrade = Number(gradeValue);
  const previewRemarks = !isNaN(numericGrade) && numericGrade >= 1.0 && numericGrade <= 5.0
    ? computeGradeRemarks(numericGrade)
    : '—';

  return (
    <div className="management-module">
      <div className="module-toolbar">
        <div className="search-filter-group">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search grades by student, subject, or remark..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
          <Award size={16} />
          <span>Encode Grade</span>
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
                <th>Grade</th>
                <th>Remarks</th>
                <th>Encoded By</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-4">Loading encoded grades...</td>
                </tr>
              ) : filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-4">No grade records found.</td>
                </tr>
              ) : (
                filteredGrades.map((g) => (
                  <tr key={g.id}>
                    <td className="font-mono font-bold text-primary">{g.student_id}</td>
                    <td className="font-medium">{g.student_name}</td>
                    <td className="font-mono font-semibold">{g.course_code}</td>
                    <td>{g.course_name}</td>
                    <td>{g.credits || 3}</td>
                    <td className="font-mono font-bold text-lg">{Number(g.grade).toFixed(2)}</td>
                    <td><StatusBadge status={g.remarks} /></td>
                    <td className="text-muted">{g.encoded_by}</td>
                    <td>{formatDate(g.updated_at)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn-icon text-primary"
                          onClick={() => openEditModal(g)}
                          title="Update grade"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-danger"
                          onClick={() => setDeleteTarget(g)}
                          title="Delete grade"
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

      {/* Encode / Edit Grade Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGrade ? `Update Grade #${editingGrade.id}` : 'Encode Student Grade'}
        maxWidth="500px"
      >
        <form onSubmit={handleSave} className="form-grid">
          {!editingGrade && (
            <div className="col-12">
              <div className="form-field">
                <label className="field-label">Student Enrollment Record</label>
                <select
                  className="field-input"
                  value={enrollmentId}
                  onChange={(e) => setEnrollmentId(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">-- Select Student Enrollment --</option>
                  {enrollments.map((en) => {
                    const alreadyGraded = grades.some((g) => g.enrollment_id === en.id);
                    return (
                      <option key={en.id} value={en.id} disabled={alreadyGraded}>
                        {en.student_id} ({en.student_name}) — {en.course_code} ({en.course_name})
                        {alreadyGraded ? ' [GRADED]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

          <div className="col-8">
            <ValidatedInput
              label="Grade (Scale: 1.00 - 5.00)"
              type="number"
              value={gradeValue}
              onChange={setGradeValue}
              validator={validateGrade}
              placeholder="1.00 - 5.00"
              required
            />
          </div>

          <div className="col-4">
            <div className="form-field">
              <label className="field-label">Computed Remark</label>
              <div className="remark-preview-pill">
                <StatusBadge status={previewRemarks} />
              </div>
            </div>
          </div>

          <div className="col-12 grade-scale-hint">
            <span className="hint-title">Apex Institute Grading Standards:</span>
            <span className="hint-item">1.00-1.25: Excellent</span>
            <span className="hint-item">1.50-1.75: Very Good</span>
            <span className="hint-item">2.00-2.25: Good</span>
            <span className="hint-item">2.50-2.75: Satisfactory</span>
            <span className="hint-item">3.00: Passing</span>
            <span className="hint-item">4.00: Conditional</span>
            <span className="hint-item">5.00: Failed</span>
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
              {editingGrade ? 'Save Grade' : 'Encode Grade'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Confirm Grade Deletion"
        message={`Are you sure you want to remove the encoded grade for ${deleteTarget?.student_name} in ${deleteTarget?.course_code}?`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Grade'}
        isDanger
      />
    </div>
  );
};
