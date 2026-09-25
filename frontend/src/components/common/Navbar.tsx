import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useNotification } from '../../hooks/useNotification.js';
import { formatRole } from '../../utils/formatters.js';
import { LogOut, GraduationCap, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';

interface NavbarProps {
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefreshData }) => {
  const { user, profile, demoMode, logout } = useAuth();
  const { success, error } = useNotification();

  const handleLogout = async () => {
    try {
      await logout();
      success('Logged out successfully');
    } catch {
      // Force reload if error
      window.location.reload();
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all demo data back to default institutional records?')) return;
    try {
      await api.resetDemoDatabase();
      success('Demo database has been reset to defaults');
      if (onRefreshData) onRefreshData();
      else window.location.reload();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to reset demo data');
    }
  };

  const getDisplayName = () => {
    if (!user) return '';
    if (profile) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user.username;
  };

  const getIdBadge = () => {
    if (user?.student_id) return user.student_id;
    if (user?.employee_id) return user.employee_id;
    return `@${user?.username}`;
  };

  return (
    <header className="app-navbar">
      <div className="navbar-brand">
        <div className="brand-logo">
          <GraduationCap size={24} className="brand-icon" />
        </div>
        <div className="brand-text">
          <span className="brand-title">Apex Institute</span>
          <span className="brand-subtitle">School Management Portal</span>
        </div>
      </div>

      <div className="navbar-center">
        {demoMode ? (
          <div className="demo-mode-pill" title="Demonstration mode active (configured via backend environment)">
            <Sparkles size={14} />
            <span>DEMO MODE</span>
          </div>
        ) : (
          <div className="normal-mode-pill" title="Standard institutional operation (configured via backend environment)">
            <ShieldCheck size={14} />
            <span>INSTITUTIONAL MODE</span>
          </div>
        )}
      </div>

      <div className="navbar-actions">
        {demoMode && (
          <button
            type="button"
            className="btn btn-sm btn-outline-warning"
            onClick={handleResetDemo}
            title="Reset demo data to initial state"
          >
            <RefreshCw size={14} />
            <span>Reset Demo DB</span>
          </button>
        )}

        {user && (
          <div className="user-profile-summary">
            <div className="user-avatar">
              {getDisplayName().charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{getDisplayName()}</span>
              <div className="user-meta">
                <span className="user-role-badge">{formatRole(user.role)}</span>
                <span className="user-id-text">{getIdBadge()}</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn-icon logout-btn"
          onClick={handleLogout}
          title="Sign out of your session"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
