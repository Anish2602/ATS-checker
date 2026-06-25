import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setSent(true); // Always show success to prevent email enumeration
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-yellow-600/20 border border-yellow-500/30 mx-auto mb-4">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="auth-title">Reset password</h1>
          <p className="text-xs text-gray-500 mt-1">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {sent ? (
          <div className="text-center py-2">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-950/40 border border-green-900/60 mx-auto mb-4">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 7L2 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-200 mb-2">Check your inbox</p>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              If an account with <strong className="text-gray-300">{email}</strong> exists, a
              password reset link has been sent. The link expires in 1 hour.
            </p>
            <Link to="/login" className="btn btn-primary w-full text-center block">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group text-left">
              <label>Email address</label>
              <div className="auth-input-icon-wrapper">
                <svg className="auth-input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-10 7L2 7" />
                </svg>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-xs bg-red-950/40 border border-red-900/60 text-red-400 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>Sending…</>
              ) : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="text-xs text-blue-400 hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
