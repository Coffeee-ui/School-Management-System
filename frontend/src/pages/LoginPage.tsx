import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useNotification } from '../hooks/useNotification.js';
import { ValidatedInput } from '../components/common/ValidatedInput.js';
import { validateRequired, validatePassword } from '../utils/validation.js';
import { DemoPreset } from '../types/index.js';
import { api } from '../services/api.js';
import { GraduationCap, LogIn, Sparkles, UserCheck, Shield, Key } from 'lucide-react';

interface LoginPageProps {
  onNavigateRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateRegister }) => {
  const { login, demoMode } = useAuth();
  const { success, error } = useNotification();

  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [presets, setPresets] = useState<DemoPreset[]>([]);

  useEffect(() => {
    if (demoMode) {
      api.getDemoPresets().then((res) => {
        setPresets(res.presets);
      }).catch(() => {});
    }
  }, [demoMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const idErr = validateRequired(identifier, 'Username, Email, Student ID, or Employee ID');
    const pwdErr = validateRequired(password, 'Password');

    if (idErr || pwdErr) {
      error(idErr || pwdErr || 'Please provide both credentials');
      return;
    }

    setSubmitting(true);
    try {
      await login(identifier, password);
      success('Authentication successful! Welcome to Apex Institute.');
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyPreset = (preset: DemoPreset) => {
    setIdentifier(preset.username);
    setPassword(preset.password);
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <GraduationCap size={36} />
          </div>
          <h1 className="auth-title">Apex Institute</h1>
          <p className="auth-subtitle">School Management Portal & Central Access</p>
        </div>

        {demoMode && (
          <div className="demo-banner-box">
            <div className="demo-banner-title">
              <Sparkles size={16} />
              <span>Demo Mode Active</span>
            </div>
            <p className="demo-banner-desc">
              Select an institutional role preset below for one-click demo login:
            </p>
            <div className="demo-presets-grid">
              {presets.map((p) => (
                <button
                  key={`${p.role}-${p.username}`}
                  type="button"
                  className={`demo-preset-btn ${identifier === p.username ? 'active' : ''}`}
                  onClick={() => handleApplyPreset(p)}
                >
                  <span className="preset-title">{p.title}</span>
                  <span className="preset-user font-mono">@{p.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <ValidatedInput
            label="Institutional Identifier"
            value={identifier}
            onChange={setIdentifier}
            validator={(val) => validateRequired(val, 'Login identifier')}
            placeholder="Username, Email, Student ID, or Employee ID"
            helpText="Accepts: Username, Email, STU-YYYY-XXXX, or EMP-YYYY-XXXX"
            required
            autoComplete="username"
          />

          <ValidatedInput
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            validator={(val) => validateRequired(val, 'Password')}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg mt-3"
            disabled={submitting}
          >
            <LogIn size={18} />
            <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="auth-footer">
          <div className="auth-link-prompt">
            <span>New Student or Faculty member?</span>
            <button
              type="button"
              className="link-button"
              onClick={onNavigateRegister}
            >
              Claim Profile & Activate Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
