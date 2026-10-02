import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useNotification } from '../../hooks/useNotification.js';
import { api } from '../../services/api.js';
import { DemoPreset } from '../../types/index.js';
import { Sparkles, X, ChevronRight, RefreshCw } from 'lucide-react';

/**
 * DemoSwitcher — Floating demo control panel.
 *
 * Behaviour:
 *  - Rendered only when `demoMode === true` (backend-controlled via APP_MODE=demo).
 *  - Hidden by default; revealed by a small trigger button fixed to the
 *    bottom-right of the viewport.
 *  - Lets the user switch between demo role accounts without visiting the
 *    login page. Uses the existing api.login() and AuthContext.login()
 *    flow — no separate auth system.
 *  - Closes automatically after a successful role switch.
 *  - Escape key and click-outside also close the panel.
 */
export const DemoSwitcher: React.FC = () => {
  const { demoMode, user, login } = useAuth();
  const { success, error } = useNotification();

  const [open, setOpen] = useState<boolean>(false);
  const [presets, setPresets] = useState<DemoPreset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState<boolean>(false);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);
  const [resetting, setResetting] = useState<boolean>(false);

  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch presets once when demoMode becomes true
  const fetchPresets = useCallback(async () => {
    if (presets.length > 0) return; // already loaded
    setLoadingPresets(true);
    try {
      const res = await api.getDemoPresets();
      setPresets(res.presets);
    } catch {
      // Silently fail — demo mode may have been disabled server-side
    } finally {
      setLoadingPresets(false);
    }
  }, [presets.length]);

  useEffect(() => {
    if (demoMode) {
      fetchPresets();
    }
  }, [demoMode, fetchPresets]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  // Close on click-outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Delay attaching to prevent the trigger-button click from immediately closing
    const t = setTimeout(() => document.addEventListener('mousedown', handleClick), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open]);

  // Only render in demo mode
  if (!demoMode) return null;

  const handleSwitchRole = async (preset: DemoPreset) => {
    if (switchingRole) return; // prevent double-click
    setSwitchingRole(preset.role);
    try {
      await login(preset.username, preset.password);
      success(`Switched to ${preset.title} (${preset.role.toUpperCase()})`);
      setOpen(false);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Role switch failed');
    } finally {
      setSwitchingRole(null);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all demo data back to default institutional records?')) return;
    setResetting(true);
    try {
      await api.resetDemoDatabase();
      success('Demo database reset to defaults');
      setOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Failed to reset demo data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      {/* ── Floating trigger button ─────────────────────────────────────── */}
      <button
        id="demo-switcher-trigger"
        type="button"
        className={`demo-switcher-trigger${open ? ' demo-switcher-trigger--active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title="Open demo role switcher"
        aria-label="Demo role switcher"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Sparkles size={14} />
        <span className="demo-switcher-trigger-label">DEMO</span>
      </button>

      {/* ── Floating panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          ref={panelRef}
          id="demo-switcher-panel"
          className="demo-switcher-panel"
          role="dialog"
          aria-label="Demo account switcher"
          aria-modal="false"
        >
          {/* Panel header */}
          <div className="demo-switcher-header">
            <div className="demo-switcher-header-left">
              <Sparkles size={13} className="demo-switcher-header-icon" />
              <span className="demo-switcher-header-title">Demo Switcher</span>
            </div>
            <button
              type="button"
              className="demo-switcher-close"
              onClick={() => setOpen(false)}
              aria-label="Close demo switcher"
            >
              <X size={14} />
            </button>
          </div>

          {/* Current session badge */}
          {user && (
            <div className="demo-switcher-current">
              <span className="demo-switcher-current-label">Active:</span>
              <span className="demo-switcher-current-role">{user.role.toUpperCase()}</span>
              <span className="demo-switcher-current-user">@{user.username}</span>
            </div>
          )}

          {/* Role list */}
          <div className="demo-switcher-roles">
            {loadingPresets ? (
              <div className="demo-switcher-loading">
                <div className="spinner" style={{ width: 14, height: 14 }} />
                <span>Loading presets…</span>
              </div>
            ) : (
              presets.map((preset) => {
                const isActive = user?.username === preset.username;
                const isSwitching = switchingRole === preset.role;
                return (
                  <button
                    key={`demo-${preset.role}`}
                    id={`demo-role-${preset.role}`}
                    type="button"
                    className={`demo-switcher-role-btn${isActive ? ' demo-switcher-role-btn--active' : ''}`}
                    onClick={() => handleSwitchRole(preset)}
                    disabled={isActive || Boolean(switchingRole)}
                    title={preset.description}
                  >
                    <div className="demo-switcher-role-left">
                      <span className="demo-switcher-role-pill">{preset.role}</span>
                      <div className="demo-switcher-role-info">
                        <span className="demo-switcher-role-title">{preset.title}</span>
                        <span className="demo-switcher-role-user font-mono">
                          @{preset.username}
                        </span>
                      </div>
                    </div>
                    <div className="demo-switcher-role-right">
                      {isSwitching ? (
                        <div className="spinner" style={{ width: 13, height: 13 }} />
                      ) : isActive ? (
                        <span
                          className="demo-switcher-active-dot"
                          aria-label="Currently active role"
                        />
                      ) : (
                        <ChevronRight
                          size={13}
                          className="demo-switcher-chevron"
                        />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer: Reset Demo DB */}
          <div className="demo-switcher-footer">
            <button
              id="demo-switcher-reset"
              type="button"
              className="demo-switcher-reset-btn"
              onClick={handleResetDemo}
              disabled={resetting}
              title="Re-seed the database to its default demo state"
            >
              <RefreshCw size={11} />
              <span>{resetting ? 'Resetting…' : 'Reset Demo DB'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
