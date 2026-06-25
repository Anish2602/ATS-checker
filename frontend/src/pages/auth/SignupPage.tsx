import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ApiError } from '../../contexts/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

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

export default function SignupPage() {
  const { signup, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: { credential: string }) => {
        setLoading(true);
        try {
          await loginWithGoogle(response.credential);
          navigate('/', { replace: true });
        } catch (e) {
          setError(e instanceof ApiError ? e.message : 'Google sign-up failed.');
        } finally {
          setLoading(false);
        }
      },
    });
    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: '100%',
        text: 'signup_with',
        shape: 'rectangular',
      });
    }
  }, []);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
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
    try {
      await signup(email, password, fullName.trim());
      setSuccess(
        'Account created! Please check your inbox and verify your email before signing in.',
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 mx-auto mb-4">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="auth-title">Create your account</h1>
          <p className="text-xs text-gray-500 mt-1">Start optimizing your resume today</p>
        </div>

        {/* Google */}
        {GOOGLE_CLIENT_ID ? (
          <div ref={googleBtnRef} className="w-full mb-4" />
        ) : (
          <button
            type="button"
            onClick={() => alert('Configure VITE_GOOGLE_CLIENT_ID in frontend/.env to enable Google sign-up.')}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-gray-700 bg-gray-900/50 hover:bg-gray-800 transition-all text-sm font-medium text-gray-200 mb-4"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-950/40 border border-green-900/60 mx-auto mb-4">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-green-400 mb-2">Check your inbox!</p>
            <p className="text-xs text-gray-500 mb-6">{success}</p>
            <Link to="/login" className="btn btn-primary w-full text-center block">
              Go to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group text-left">
              <label>Full name</label>
              <div className="auth-input-icon-wrapper">
                <svg className="auth-input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Anish Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group text-left">
              <label>Email address</label>
              <div className="auth-input-icon-wrapper">
                <svg className="auth-input-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" />
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

            <div className="form-group text-left">
              <label>Password</label>
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
              className="btn btn-primary w-full mt-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>Creating account…</>
              ) : 'Create account'}
            </button>

            <p className="text-[11px] text-gray-600 text-center">
              By creating an account, you agree to our{' '}
              <span className="text-blue-400 cursor-pointer">Terms of Service</span> and{' '}
              <span className="text-blue-400 cursor-pointer">Privacy Policy</span>.
            </p>
          </form>
        )}

        <p className="text-center text-xs text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
