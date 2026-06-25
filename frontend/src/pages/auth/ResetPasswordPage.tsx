import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi, ApiError } from '../../lib/api';

type Strength = { score: number; label: string; color: string };

function getPasswordStrength(pwd: string): Strength {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map: Strength[] = [
    { score: 0, label: 'Too weak', color: 'bg-red-600' },
    { score: 1, label: 'Weak', color: 'bg-red-500' },
    { score: 2, label: 'Fair', color: 'bg-orange-500' },
    { score: 3, label: 'Good', color: 'bg-yellow-500' },
    { score: 4, label: 'Strong', color: 'bg-green-500' },
    { score: 5, label: 'Excellent', color: 'bg-emerald-400' },
  ];
  return map[score];
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Reset token is missing from the URL. Please use the link from your email.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (strength.score < 3) {
      setError('Please choose a stronger password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card animate-fade-in text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-950/40 border border-red-900/60 mx-auto mb-4">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="auth-title text-red-400">Invalid link</h1>
          <p className="text-xs text-gray-500 mt-2 mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link to="/forgot-password" className="btn btn-primary w-full text-center block">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 mx-auto mb-4">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <h1 className="auth-title">Set new password</h1>
          <p className="text-xs text-gray-500 mt-1">Choose a strong, unique password</p>
        </div>

        {success ? (
          <div className="text-center py-2">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-950/40 border border-green-900/60 mx-auto mb-4">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-green-400 mb-2">Password updated!</p>
            <p className="text-xs text-gray-500 mb-4">Redirecting you to sign in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group text-left">
              <label>New password</label>
              <div className="auth-input-icon-wrapper">
                <svg className="auth-input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword
                    ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    : <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
              {password && (
                <div className="password-strength-container">
                  <div className="password-strength-bar-wrapper">
                    {[1, 2, 3, 4, 5].map((l) => (
                      <div key={l} className={`password-strength-bar ${l <= strength.score ? strength.color : ''}`} />
                    ))}
                  </div>
                  <span className="password-strength-label" style={{ color: strength.score >= 3 ? '#10b981' : '#ef4444' }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group text-left">
              <label>Confirm password</label>
              <div className="auth-input-icon-wrapper">
                <svg className="auth-input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] text-red-400 mt-1">Passwords do not match.</p>
              )}
            </div>

            {error && (
              <div className="text-xs bg-red-950/40 border border-red-900/60 text-red-400 p-3 rounded-lg">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>Updating…</>
              ) : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
