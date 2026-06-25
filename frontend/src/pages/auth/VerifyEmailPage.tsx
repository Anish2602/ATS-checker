import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi, ApiError } from '../../lib/api';

type Status = 'loading' | 'success' | 'error' | 'missing';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'missing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    authApi
      .verifyEmail(token)
      .then((data) => {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      })
      .catch((e) => {
        setStatus('error');
        setMessage(e instanceof ApiError ? e.message : 'Verification failed. Please try again.');
      });
  }, [token]);

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fade-in text-center">
        {status === 'loading' && (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-950/40 border border-blue-900/60 mx-auto mb-6">
              <svg className="animate-spin text-blue-400" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            </div>
            <h1 className="auth-title">Verifying your email…</h1>
            <p className="text-xs text-gray-500 mt-2">This will only take a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-950/40 border border-green-900/60 mx-auto mb-6">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="auth-title text-green-400">Email verified!</h1>
            <p className="text-xs text-gray-500 mt-2 mb-8">{message}</p>
            <Link to="/login" className="btn btn-primary w-full text-center block">
              Sign in to your account
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-950/40 border border-red-900/60 mx-auto mb-6">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="auth-title text-red-400">Verification failed</h1>
            <p className="text-xs text-gray-500 mt-2 mb-8 leading-relaxed">{message}</p>
            <div className="flex flex-col gap-3">
              <Link to="/login" className="btn btn-primary w-full text-center block">
                Back to sign in
              </Link>
              <p className="text-xs text-gray-600">
                Need a new link?{' '}
                <Link to="/login" className="text-blue-400 hover:underline">
                  Sign in and request a new one
                </Link>
              </p>
            </div>
          </>
        )}

        {status === 'missing' && (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-950/40 border border-yellow-900/60 mx-auto mb-6">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="auth-title">Invalid verification link</h1>
            <p className="text-xs text-gray-500 mt-2 mb-8">
              No verification token found. Please use the link from your email.
            </p>
            <Link to="/login" className="btn btn-primary w-full text-center block">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
