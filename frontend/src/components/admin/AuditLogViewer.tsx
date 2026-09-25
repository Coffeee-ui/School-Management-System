import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { AuditLog, AuditStats } from '../../types/index.js';
import { useNotification } from '../../hooks/useNotification.js';
import { formatDateTime } from '../../utils/formatters.js';
import { Download, Search, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { error } = useNotification();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 25;

  const loadLogs = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.getAuditLogs({
          search: search || undefined,
          action: actionFilter || undefined,
          resource: resourceFilter || undefined,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        api.getAuditStats().catch(() => null),
      ]);

      setLogs(logsRes.logs);
      setTotal(logsRes.total);
      if (statsRes) setStats(statsRes);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, resourceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const handleExportCsv = () => {
    const exportUrl = api.getAuditExportUrl({
      search: search || undefined,
      action: actionFilter || undefined,
      resource: resourceFilter || undefined,
    });
    window.open(exportUrl, '_blank');
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="audit-log-viewer">
      {/* Top Stats Overview */}
      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card">
            <div className="kpi-icon-wrapper kpi-primary">
              <ShieldAlert size={24} />
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Total System Audit Events</span>
              <span className="kpi-value font-mono">{stats.totalLogs}</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper kpi-success">
              <BarChart2 size={24} />
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Past 24h Activity</span>
              <span className="kpi-value font-mono">{stats.recentActivityCount}</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper kpi-info">
              <RefreshCw size={24} />
            </div>
            <div className="kpi-data">
              <span className="kpi-label">Primary Active Action</span>
              <span className="kpi-value">{stats.actionCounts[0]?.action || 'None'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="module-toolbar">
        <form onSubmit={handleSearchSubmit} className="search-filter-group">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by action, details, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="REGISTER_CLAIM">REGISTER_CLAIM</option>
            <option value="CREATE_STUDENT">CREATE_STUDENT</option>
            <option value="UPDATE_STUDENT">UPDATE_STUDENT</option>
            <option value="CREATE_EMPLOYEE">CREATE_EMPLOYEE</option>
            <option value="UPDATE_EMPLOYEE">UPDATE_EMPLOYEE</option>
            <option value="CREATE_COURSE">CREATE_COURSE</option>
            <option value="ENCODE_GRADE">ENCODE_GRADE</option>
            <option value="UPDATE_GRADE">UPDATE_GRADE</option>
            <option value="CREATE_SCHEDULE">CREATE_SCHEDULE</option>
            <option value="CREATE_USER">CREATE_USER</option>
          </select>

          <select
            className="filter-select"
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Resources</option>
            <option value="auth">auth</option>
            <option value="students">students</option>
            <option value="employees">employees</option>
            <option value="courses">courses</option>
            <option value="schedules">schedules</option>
            <option value="enrollments">enrollments</option>
            <option value="grades">grades</option>
            <option value="users">users</option>
          </select>

          <button type="submit" className="btn btn-secondary">
            Filter
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-icon-only"
            onClick={loadLogs}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </form>

        <button type="button" className="btn btn-outline-success" onClick={handleExportCsv}>
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="dashboard-card p-0">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Timestamp</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">Loading audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">No audit logs match criteria.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-muted">#{log.id}</td>
                    <td className="font-mono text-xs whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    <td className="font-semibold text-primary">@{log.username}</td>
                    <td><span className="role-tag">{log.role}</span></td>
                    <td>
                      <span className={`action-tag action-${log.action.toLowerCase()}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="font-mono">{log.resource}</td>
                    <td className="text-sm max-w-xs truncate" title={log.details || ''}>
                      {log.details || '—'}
                    </td>
                    <td className="font-mono text-xs text-muted">{log.ip_address}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <span className="pagination-info">
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total} records
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="page-indicator">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
