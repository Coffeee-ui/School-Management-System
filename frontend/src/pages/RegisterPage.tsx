import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useNotification } from '../hooks/useNotification.js';
import { ValidatedInput } from '../components/common/ValidatedInput.js';
import {
  validateRequired,
  validatePassword,
  validateEmail,
} from '../utils/validation.js';
import { GraduationCap, UserCheck, ArrowLeft, Lock } from 'lucide-react';

interface RegisterPageProps {
  onNavigateLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateLogin }) => {
  const { registerAndClaim } = useAuth();
  const { success, error } = useNotification();

  const [profileId, setProfileId]       = useState<string>('');
  const [dateOfBirth, setDateOfBirth]   = useState<string>('');
  const [username, setUsername]         = useState<string>('');
  const [email, setEmail]               = useState<string>('');
  const [password, setPassword]         = useState<string>('');
  const [confirmPassword, setConfirmPw] = useState<string>('');
  const [submitting, setSubmitting]     = useState<boolean>(false);

  const validateConfirmPassword = (val: string): string | null => {
    if (!val) return 'Please confirm your password';
    if (val !== password) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = [
      validateRequired(profileId, 'Student/Employee ID'),
      validateRequired(dateOfBirth, 'Date of birth'),
      validateRequired(username, 'Username'),
      validateEmail(email),
      validatePassword(password),
      validateConfirmPassword(confirmPassword),
    ].filter(Boolean);

    if (errs.length > 0) {
      error(errs[0] as string);
      return;
    }

    setSubmitting(true);
    try {
      await registerAndClaim({ profileId, dateOfBirth, username, email, password });
      success('Account activated successfully! Welcome to Apex Institute.');
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Account activation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container" style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <div className="auth-logo-badge">
            <UserCheck size={36} />
          </div>
          <h1 className="auth-title">Claim Your Profile</h1>
          <p className="auth-subtitle">
            Activate your account by verifying your existing student or employee record
          </p>
        </div>

        <div className="alert alert-info" style={{ marginBottom: 'var(--space-5)' }}>
          <Lock size={16} style={{ flexShrink: 0 }} />
          <span>
            You must already be registered in the institutional database. Your <strong>Student/Employee ID</strong> and <strong>Date of Birth</strong> are used to verify your identity.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <ValidatedInput
            label="Institutional ID"
            value={profileId}
            onChange={setProfileId}
            validator={(val) => validateRequired(val, 'Student/Employee ID')}
            placeholder="e.g. STU-2024-0001 or EMP-2024-0001"
            helpText="Your Student ID (STU-YYYY-XXXX) or Employee ID (EMP-YYYY-XXXX)"
            required
          />

          <ValidatedInput
            label="Date of Birth"
            type="date"
            value={dateOfBirth}
            onChange={setDateOfBirth}
            validator={(val) => validateRequired(val, 'Date of birth')}
            helpText="Must match the date of birth in your institutional record"
            required
          />

          <hr className="divider" />

          <ValidatedInput
            label="Username"
            value={username}
            onChange={setUsername}
            validator={(val) => validateRequired(val, 'Username')}
            placeholder="Choose a unique username"
            required
            autoComplete="username"
          />

          <ValidatedInput
            label="Email Address"
            type="email"
            value={email}
            onChange={setEmail}
            validator={validateEmail}
            placeholder="Enter your email address"
            required
            autoComplete="email"
          />

          <ValidatedInput
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            validator={validatePassword}
            placeholder="Create a strong password"
            helpText="Minimum 8 characters"
            required
            autoComplete="new-password"
          />

          <ValidatedInput
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPw}
            validator={validateConfirmPassword}
            placeholder="Re-enter your password"
            required
            autoComplete="new-password"
          />

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg mt-3"
            disabled={submitting}
          >
            <UserCheck size={18} />
            <span>{submitting ? 'Activating Account...' : 'Activate Account'}</span>
          </button>
        </form>

        <div className="auth-footer">
          <div className="auth-link-prompt">
            <span>Already have an account?</span>
            <button
              type="button"
              className="link-button"
              onClick={onNavigateLogin}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowLeft size={14} /> Back to Sign In
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
