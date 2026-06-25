import React, { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import { useAuth } from './contexts/AuthContext';
// @ts-ignore
import { atsApi, userApi, API_BASE } from './lib/api';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Zap, 
  BookOpen, 
  AlertCircle,
  Copy,
  Check,
  Briefcase,
  LogOut,
  History,
  Lock,
  Mail,
  User,
  Phone,
  Calendar,
  ShieldCheck,
  Globe,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Columns,
  Settings,
  Key,
  Trash2,
  LockKeyhole
} from 'lucide-react';

const mockResumeContent = `Anish Kumar - Software Engineer
Email: anish@example.com

Summary:
Experienced developer responsible for developing APIs for internal applications and frontend styling. Worked on backend development.

Skills:
Python, JavaScript, React, SQL, Git, HTML, CSS.

Experience:
Software Engineer at TechCorp
2022 - Present
- Developed APIs for internal applications.
- Worked on backend development.
- Wrote unit tests for codebase.
- Helped with frontend styling.

Education:
Bachelor of Science in Computer Science - State University`;

const mockFile = typeof window !== 'undefined' ? new File([mockResumeContent], "mock_resume.txt", { type: "text/plain" }) : null;
const mockJD = `Looking for a Senior Software Engineer with strong experience in Python, JavaScript, and React. Experience with Go, Docker, Kubernetes, and SQL is required. Responsibilities include building backend APIs and designing frontend interfaces.`;
const localWorkspaceUser = {
  id: 'local-workspace',
  email: 'local@workspace',
  username: 'workspace',
  first_name: 'Local',
  last_name: 'Workspace',
  subscription_plan: 'Local',
  ats_credits: 'Unlimited'
};

// SVG Brands logos
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '6px', flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.6-4.53-2.6-4.53z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '6px', flexShrink: 0 }}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.27-.58 2.94-1.39z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 23 23" width="16" height="16" style={{ marginRight: '6px', flexShrink: 0 }}>
    <path fill="#f25022" d="M1 1h10v10H1z" />
    <path fill="#7fba00" d="M12 1h10v10H12z" />
    <path fill="#00a4ef" d="M1 12h10v10H1z" />
    <path fill="#ffb900" d="M12 12h10v10H12z" />
  </svg>
);

export default function App() {
  // Real auth from AuthContext (provided by main.tsx)
  const { user, logout: authLogout, refreshUser } = useAuth();

  // Routing Path state
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Legacy auth states (kept for UI compatibility — now driven by AuthContext)
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Extended signup states
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');

  // Password reset/forgot states
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');

  // UI state management
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);
  const [authChecking, setAuthChecking] = useState(false);

  // Verification overlay simulation states
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationUserId, setVerificationUserId] = useState(null);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationProvider, setVerificationProvider] = useState('google'); // 'google', 'apple', 'microsoft'
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [customOAuthEmail, setCustomOAuthEmail] = useState('');
  const [customOAuthName, setCustomOAuthName] = useState('');
  const [googleUseAnother, setGoogleUseAnother] = useState(false);

  // Profile data states
  const [resumesList, setResumesList] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeAnalysisId, setActiveAnalysisId] = useState(null);

  // Active dashboard inputs
  const [file, setFile] = useState(mockFile);
  const [jobDescription, setJobDescription] = useState(mockJD);
  const [targetRole, setTargetRole] = useState('Senior Software Engineer');
  const [targetCompany, setTargetCompany] = useState('Google');
  const [experienceYears, setExperienceYears] = useState(5);
  
  // Matchmaker execution states
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Bullet rewriter states
  const [customBullet, setCustomBullet] = useState('');
  const [optimizingBullet, setOptimizingBullet] = useState(false);
  const [customBulletResult, setCustomBulletResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedCustom, setCopiedCustom] = useState(false);

  // Sidebar & Workspace layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [workspaceView, setWorkspaceView] = useState('split');

  // Custom Router navigation
  const navigateTo = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    setAuthError(null);
    setAuthSuccess(null);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auth routes are handled by React Router in main.tsx — no redirect needed here.

  // Load backend session and scan history on mount
  useEffect(() => {
    validateSession();
    fetchHistory();
  }, []);

  // Fetch Google Identity services script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Auto-trigger verification query at top-level
  useEffect(() => {
    if (currentPath === '/verify-email') {
      const token = new URLSearchParams(window.location.search).get("token");
      if (token) {
        setAuthLoading(true);
        setAuthError(null);
        setAuthSuccess(null);
        fetch("http://localhost:8000/api/v1/auth/verify-email", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: JSON.stringify({ token })
        })
        .then(async (res) => {
          const data = await res.json();
          if (res.ok) {
            setAuthSuccess(data.message || "Email verified successfully!");
            setAuthError(null);
          } else {
            setAuthError(data.detail || "Activation token has expired or is invalid.");
            setAuthSuccess(null);
          }
        })
        .catch(() => setAuthError("Network server failure."))
        .finally(() => setAuthLoading(false));
      } else {
        setAuthError("Verification token parameter is missing from URL.");
      }
    }
  }, [currentPath]);

  // Refresh user data from the backend (credits, profile, etc.)
  const validateSession = useCallback(async () => {
    try {
      await refreshUser();
    } catch { /* AuthContext handles errors */ }
  }, [refreshUser]);

  // Fetch match scan logs history
  const fetchHistory = useCallback(async () => {
    try {
      const data = await userApi.getHistory();
      setHistory(data || []);
    } catch { setHistory([]); }
  }, []);

  // Fetch user uploaded resumes list
  const fetchUserResumes = useCallback(async () => {
    try {
      const data = await userApi.getResumes();
      setResumesList(data || []);
    } catch { setResumesList([]); }
  }, []);

  // Password complexity strength evaluation (production meter)
  const calculatePasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score, label: 'Empty', color: 'bg-gray-800' };
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const results = [
      { score: 0, label: 'Too Weak', color: 'bg-red-600' },
      { score: 1, label: 'Weak', color: 'bg-red-500' },
      { score: 2, label: 'Fair', color: 'bg-orange-500' },
      { score: 3, label: 'Good', color: 'bg-yellow-500' },
      { score: 4, label: 'Strong', color: 'bg-green-500' },
      { score: 5, label: 'Excellent', color: 'bg-emerald-400' }
    ];
    return results[score];
  };

  // Credentials form submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (authMode === 'login') {
        const response = await fetch("http://localhost:8000/api/v1/auth/login", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: JSON.stringify({ username: loginUsername, password: loginPassword })
        });

        const data = await response.json();
        if (!response.ok) {
          // If unverified, display simulated verification prompt
          if (response.status === 403 && data.detail?.code === "EMAIL_UNVERIFIED") {
            setVerificationUserId(data.detail.user_id);
            setVerificationEmail(data.detail.email);
            setVerificationProvider('google');
            setShowVerificationModal(true);
            throw new Error("Account email requires Google Auth verification.");
          }
          throw new Error(data.detail || "Invalid credentials.");
        }

        setUser(data.user);
        validateSession();
        navigateTo('/');
      } else {
        const strength = calculatePasswordStrength(signupPassword);
        if (strength.score < 3) {
          throw new Error("Please select a stronger password.");
        }

        const response = await fetch("http://localhost:8000/api/v1/auth/signup", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: JSON.stringify({
            email: signupEmail,
            password: signupPassword,
            first_name: signupFirstName,
            last_name: signupLastName,
            username: signupUsername || null
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || "Failed to create user account.");
        }

        setAuthSuccess("Account created successfully! A verification email has been sent. Please check your inbox.");
        
        // Clear fields
        setSignupEmail('');
        setSignupPassword('');
        setSignupFirstName('');
        setSignupLastName('');
        setSignupUsername('');
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Launch Simulated Social Auth (Google / Apple / Microsoft)
  const triggerSocialAuth = (provider) => {
    setAuthError(null);
    setVerificationProvider(provider);
    setVerificationUserId(null); // Direct login flow
    
    // Set brand defaults
    if (provider === 'google') {
      setVerificationEmail("anish.26022002@gmail.com");
      setCustomOAuthName("Anish kumar");
    } else if (provider === 'apple') {
      setVerificationEmail("anish.26022002@icloud.com");
      setCustomOAuthName("Anish kumar");
    } else {
      setVerificationEmail("anish.26022002@outlook.com");
      setCustomOAuthName("Anish kumar");
    }
    
    setGoogleUseAnother(false);
    setCustomOAuthEmail('');
    setShowVerificationModal(true);
  };

  // Execute Simulated OAuth Callbacks
  const executeOAuthVerification = async (overrideEmail = null, overrideName = null) => {
    setVerificationLoading(true);
    
    const emailToUse = overrideEmail || verificationEmail;
    const nameToUse = overrideName || (verificationUserId ? "Verified User" : `OAuth ${verificationProvider.charAt(0).toUpperCase() + verificationProvider.slice(1)} User`);

    // Simulate API delay for premium spinner feel
    await new Promise((res) => setTimeout(res, 1800));

    try {
      if (verificationUserId) {
        // Mode A: Verifying an existing username/password account
        const response = await fetch("http://localhost:8000/api/v1/auth/verify-email", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: JSON.stringify({ token: "mock_verification_token_" + verificationUserId })
        });
        
        if (!response.ok) throw new Error("Failed to verify user email.");
        
        setVerificationSuccess(true);
        setAuthSuccess("Account activated successfully! You can now sign in using your password.");
        setAuthError(null);
        
        await new Promise((res) => setTimeout(res, 1200));
        setShowVerificationModal(false);
        setVerificationSuccess(false);
        navigateTo('/login');
      } else {
        // Mode B: Direct sign-in using OAuth credentials
        const providerPrefix = verificationProvider === 'google' ? 'mock_google_' : 'mock_apple_';
        const mockOAuthToken = providerPrefix + emailToUse;

        const response = await fetch(`http://localhost:8000/api/v1/auth/${verificationProvider}`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: JSON.stringify(
            verificationProvider === 'google'
              ? { id_token: mockOAuthToken }
              : { identity_token: mockOAuthToken, full_name: nameToUse }
          )
        });

        if (!response.ok) throw new Error("OAuth login handshake failed.");

        const data = await response.json();
        setVerificationSuccess(true);
        
        await new Promise((res) => setTimeout(res, 1000));
        setUser(data.user);
        validateSession();
        navigateTo('/');
        setShowVerificationModal(false);
        setVerificationSuccess(false);
      }
    } catch (err) {
      setAuthError(err.message);
      setShowVerificationModal(false);
    } finally {
      setVerificationLoading(false);
    }
  };

  // Sign out — calls backend to revoke refresh token, then clears state
  const handleLogout = async () => {
    await authLogout();
    setResults(null);
    setHistory([]);
    setResumesList([]);
    setActiveAnalysisId(null);
    setFile(mockFile);
    setJobDescription(mockJD);
    // React Router in main.tsx will redirect to /login via ProtectedRoute
  };

  // Forgot Password request
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ email: forgotEmail })
      });
      if (!response.ok) throw new Error("Failed to process request.");
      setAuthSuccess("Password reset instructions dispatched. If this account exists, a link will land shortly in your inbox.");
      setForgotEmail('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Reset Password request
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    if (resetPassword !== resetConfirm) {
      setAuthError("Passwords do not match.");
      setAuthLoading(false);
      return;
    }

    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setAuthError("Password reset token is missing from URL.");
      setAuthLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/reset-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ token, new_password: resetPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Reset process failed.");
      
      setAuthSuccess("Password changed successfully! You will now be redirected to the sign in page.");
      setResetPassword('');
      setResetConfirm('');
      setTimeout(() => navigateTo('/login'), 3000);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Dynamic profile updates
  const handleProfileUpdate = async (first, last) => {
    setAuthLoading(true);
    try {
      await userApi.updateProfile({ first_name: first, last_name: last });
      await validateSession();
      setAuthSuccess("Profile updated successfully!");
    } catch (e) {
      console.error(e);
    } finally {
      setAuthLoading(false);
    }
  };

  // Delete User account
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you absolutely sure you want to permanently delete your account? This deletes all history and uploaded resumes, and cannot be undone.")) {
      return;
    }
    try {
      await userApi.deleteAccount();
      await authLogout();
    } catch (e) {
      console.error(e);
    }
  };

  // Run ATS analysis scan
  const runAnalysis = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select or drag a resume file first.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please input the target Job Description context.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDescription);
    formData.append("experience_years", experienceYears);
    formData.append("target_role", targetRole);
    formData.append("target_company", targetCompany);

    try {
      const data = await atsApi.analyze(formData);
      setResults(data);
      setWorkspaceView('split');
      fetchHistory();
      fetchUserResumes();
      validateSession(); // Refresh credits remaining
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load a single past scorecard details from history list
  const loadHistoryItem = async (analysisId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetch(`${API_BASE}/history/analysis/${analysisId}`, {
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      }).then(async r => { if (!r.ok) throw new Error('Failed to load record.'); return r.json(); });
      setResults(data.results);
      setTargetRole(data.jd_title || "Software Engineer");
      setTargetCompany(data.company_name || "");
      setJobDescription(data.jd_text || "");
      setActiveAnalysisId(analysisId);
      setWorkspaceView('report');
      navigateTo('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle uploaded resume files selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  // Optimize a custom bullet point inside rewriter
  const runBulletOptimization = async (e) => {
    e.preventDefault();
    if (!customBullet.trim()) return;

    setOptimizingBullet(true);
    setCustomBulletResult(null);

    try {
      const data = await atsApi.rewriteBullet({
        original_text: customBullet,
        target_role: targetRole,
        target_company: targetCompany
      });
      setCustomBulletResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setOptimizingBullet(false);
    }
  };

  // Copier feedback helpers
  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyCustomToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCustom(true);
    setTimeout(() => setCopiedCustom(false), 2000);
  };

  // Auth-gating is handled by ProtectedRoute in main.tsx — render dashboard directly.

  // --- AUTHENTICATED SYSTEM VIEWS ---

  return (
    <div className="app-wrapper animate-fade-in">
      
      {/* LEFT SIDEBAR */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="brand" onClick={() => navigateTo('/')} style={{ cursor: 'pointer' }}>
            <Zap size={22} fill="currentColor" />
            <span>ATS Optimize</span>
          </div>
        </div>

        {/* Global Navigation Links */}
        <div className="sidebar-nav-group">
          <button 
            onClick={() => navigateTo('/')} 
            className={`sidebar-nav-btn ${currentPath === '/' ? 'active' : ''}`}
          >
            <Zap size={14} /> Match Analyzer
          </button>
        </div>

        {/* Scan history logs snippet */}
        <div className="sidebar-header" style={{ borderBottom: 'none', paddingTop: '1rem', paddingBottom: '0.25rem' }}>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
            Recent Scans
          </span>
        </div>

        <div className="sidebar-content">
          <div className="history-list">
            {history.map((item) => (
              <button
                key={item.analysis_id}
                onClick={() => loadHistoryItem(item.analysis_id)}
                className={`history-item ${activeAnalysisId === item.analysis_id ? 'active' : ''}`}
              >
                <div className="history-item-header">
                  <span className="history-item-title">{item.jd_title || "Unnamed JD"}</span>
                  <div className="history-item-scores">
                    <span className="history-score-badge text-blue-400">{Math.round(item.ats_score)}%</span>
                  </div>
                </div>
                <div className="history-item-meta font-mono">
                  <span>{item.company_name || 'Generic'}</span>
                  <span>{new Date(item.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                </div>
              </button>
            ))}

            {history.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-8">
                No past scans.
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile-info">
            <span className="user-email">{user?.email || 'Guest'}</span>
            <span className="user-role flex items-center gap-1 text-blue-400">
              <User size={10} /> {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.subscription_plan || 'Free'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary w-full text-xs py-2 flex items-center justify-center gap-2 hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 transition-all"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN APP PANEL */}
      <main className="main-content-layout">
        
        {/* Workspace Dynamic Header */}
        <header className="workspace-header">
          <div className="workspace-title-section">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="workspace-toggle-btn"
              title={sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
              {currentPath === '/' ? "ATS Match Analytics" : 
               currentPath === '/history' ? "Full Match History Logs" :
               currentPath === '/profile' ? "User Profile & Credits" : 
               "System Configurations"}
            </h2>
          </div>

          {/* Dynamic workspace tab selector (visible when results exist on dashboard) */}
          {currentPath === '/' && results && (
            <div className="workspace-tabs animate-fade-in">
              <button 
                onClick={() => setWorkspaceView('split')}
                className={`workspace-tab ${workspaceView === 'split' ? 'active' : ''}`}
              >
                <Columns size={12} /> Split View
              </button>
              <button 
                onClick={() => setWorkspaceView('setup')}
                className={`workspace-tab ${workspaceView === 'setup' ? 'active' : ''}`}
              >
                <Upload size={12} /> Setup
              </button>
              <button 
                onClick={() => setWorkspaceView('report')}
                className={`workspace-tab ${workspaceView === 'report' ? 'active' : ''}`}
              >
                <FileText size={12} /> Report
              </button>
            </div>
          )}
        </header>

        {/* Dynamic Page Views */}
        
        {currentPath === '/profile' ? (
          <div className="profile-view-container animate-fade-in">
            <div className="profile-card">
              <div className="profile-avatar-large">
                {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.first_name} {user.last_name}</h1>
                <p className="text-sm text-gray-400 mt-1">{user.email}</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs bg-blue-900/30 border border-blue-800 text-blue-400 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                    {user.subscription_plan} Account
                  </span>
                  <span className="text-xs bg-green-900/30 border border-green-800 text-green-400 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                    {user.ats_credits} Free Scan Credits
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-info-grid">
              <div className="profile-detail-card">
                <h3>Edit Metadata</h3>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.target);
                    handleProfileUpdate(fd.get("first_name"), fd.get("last_name"));
                  }} 
                  className="flex flex-col gap-3 mt-2"
                >
                  <div className="form-group text-left">
                    <label className="text-xs text-gray-400">First Name</label>
                    <input 
                      type="text" 
                      name="first_name" 
                      defaultValue={user.first_name}
                      required
                    />
                  </div>
                  <div className="form-group text-left">
                    <label className="text-xs text-gray-400">Last Name</label>
                    <input 
                      type="text" 
                      name="last_name" 
                      defaultValue={user.last_name}
                      required
                    />
                  </div>
                  <button type="submit" disabled={authLoading} className="btn btn-primary text-xs py-2 w-full mt-1">
                    {authLoading ? "Updating..." : "Save Profile Details"}
                  </button>
                </form>
              </div>

              <div className="profile-detail-card">
                <h3>Uploaded Resumes</h3>
                <div className="profile-resumes-list">
                  {resumesList.map((res) => (
                    <div key={res.id} className="profile-resume-item font-sans">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-blue-500" />
                        <span className="truncate max-w-[150px] font-semibold">{res.file_name}</span>
                      </div>
                      <span className="profile-resume-meta font-mono text-[10px]">
                        {new Date(res.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {resumesList.length === 0 && (
                    <span className="text-xs text-gray-500 py-6 text-center">
                      No resume files uploaded.
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="profile-detail-card border-red-900/30 bg-red-950/5 mt-4">
              <h3 className="text-red-400 border-red-900/20">Danger Zone</h3>
              <p className="text-xs text-gray-400 mt-1">
                Deletes all resume analysis histories, uploaded models, JDs, and logs from the PostgreSQL backend permanently.
              </p>
              <button 
                onClick={handleDeleteAccount}
                className="btn bg-red-600 hover:bg-red-700 text-white text-xs py-2 w-[180px] mt-3 flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} /> Delete Account
              </button>
            </div>
          </div>
        ) : currentPath === '/settings' ? (
          <div className="profile-view-container animate-fade-in">
            <div className="profile-detail-card">
              <h3>Reset Password Credentials</h3>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.target);
                  const new_p = fd.get("new_password");
                  const cur_p = fd.get("current_password");
                  
                  setAuthLoading(true);
                  setAuthError(null);
                  setAuthSuccess(null);
                  try {
                    const response = await fetch("http://localhost:8000/api/v1/auth/forgot-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: user.email })
                    });
                    if (response.ok) {
                      setAuthSuccess("Password verification reset dispatched. Please check your email to change your password securely.");
                    } else {
                      setAuthError("Failed to trigger reset flow.");
                    }
                  } catch (err) {
                    setAuthError(err.message);
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                className="flex flex-col gap-4 mt-2"
              >
                <p className="text-xs text-gray-400">
                  Click below to dispatch a secure one-time password reset token to your registered email address.
                </p>

                {authSuccess && <span className="text-xs text-green-400 block font-semibold">{authSuccess}</span>}
                {authError && <span className="text-xs text-red-400 block font-semibold">{authError}</span>}

                <button type="submit" disabled={authLoading} className="btn btn-primary text-xs py-2 mt-2 w-[220px]">
                  {authLoading ? "Dispatching..." : "Send Reset Email Link"}
                </button>
              </form>
            </div>
            
            <div className="profile-detail-card">
              <h3>System Configuration Details</h3>
              <div className="flex flex-col gap-2 text-xs font-mono text-gray-400 mt-2">
                <div>Client Session Origin: {window.location.origin}</div>
                <div>API Server Host: http://localhost:8000</div>
                <div>OAuth Client Scope: Google OneTap SDK, Apple Web Token Portal</div>
                <div>Session Security: JWT Cookie Rotation Enabled</div>
              </div>
            </div>
          </div>
        ) : currentPath === '/history' ? (
          <div className="profile-view-container animate-fade-in" style={{ maxWidth: '100%' }}>
            <p className="text-xs text-gray-400">Explore complete list of scoring matches run under this account:</p>
            <div className="history-grid-container">
              {history.map((item) => (
                <div 
                  key={item.analysis_id} 
                  onClick={() => loadHistoryItem(item.analysis_id)}
                  className="history-grid-card"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="history-grid-card-title truncate max-w-[200px]">{item.jd_title || "Software Engineer"}</span>
                    <span className="text-xs bg-blue-900/30 border border-blue-800 text-blue-400 font-bold px-2 py-0.5 rounded">
                      {Math.round(item.ats_score)}% Match
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">Company: {item.company_name || 'Generic'}</div>
                  <div className="history-grid-card-meta border-t border-gray-900 pt-2 mt-1">
                    <span>JD Fit Score: {Math.round(item.jd_score)}%</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-sm text-gray-500 py-12 text-center col-span-3">
                  No match scans completed yet. Return to Match Analyzer to upload your first resume.
                </div>
              )}
            </div>
          </div>
        ) : (
          
          /* DEFAULT: DASHBOARD PATH ('/') */
          <div className={`dashboard-grid view-${workspaceView}`}>
            
            {/* LEFT PANEL: INPUT FORM */}
            {(workspaceView === 'split' || workspaceView === 'setup') && (
              <div className="flex flex-col gap-6 animate-fade-in text-left">
                <div className="glass-card flex flex-col gap-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 border-b border-gray-800 pb-2">
                    <Upload size={18} className="text-blue-500" />
                    Upload & Match Setup
                  </h2>

                  <form onSubmit={runAnalysis} className="flex flex-col gap-4">
                    {/* File input */}
                    <div className="form-group">
                      <label>Resume File (PDF, DOCX, TXT)</label>
                      <div 
                        className="upload-zone"
                        onClick={() => document.getElementById('file-upload').click()}
                      >
                        <FileText size={32} className={file ? "text-blue-500" : "text-gray-500"} />
                        {file ? (
                          <div className="text-sm font-semibold truncate max-w-full">
                            {file.name}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">
                            Drag & Drop or Click to Select File
                          </div>
                        )}
                        <input 
                          id="file-upload" 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.docx,.txt" 
                          onChange={handleFileChange} 
                        />
                      </div>
                    </div>

                    {/* Target Role input */}
                    <div className="form-group">
                      <label>Target Role / Position</label>
                      <input 
                        type="text" 
                        value={targetRole} 
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. Senior Backend Engineer" 
                      />
                    </div>

                    {/* Target Company input */}
                    <div className="form-group">
                      <label>Target Company</label>
                      <input 
                        type="text" 
                        value={targetCompany} 
                        onChange={(e) => setTargetCompany(e.target.value)}
                        placeholder="e.g. Google, Stripe, AWS" 
                      />
                    </div>

                    {/* Experience Target input */}
                    <div className="form-group">
                      <label>JD Required Experience (Years)</label>
                      <input 
                        type="number" 
                        min="0"
                        max="20"
                        value={experienceYears} 
                        onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                      />
                    </div>

                    {/* Job Description Pasting textarea */}
                    <div className="form-group">
                      <label>Job Description Text</label>
                      <textarea 
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description keywords, roles, and requirements here..."
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="btn btn-primary w-full mt-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          Running Match Scans...
                        </>
                      ) : (
                        <>
                          <Zap size={18} />
                          Run ATS Matchmaker
                        </>
                      )}
                    </button>
                  </form>
                  
                  {error && (
                    <div className="text-sm bg-red-950/40 border border-red-900 text-red-400 p-3 rounded-lg flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RIGHT PANEL: REPORTS & RESULTS */}
            {(workspaceView === 'split' || workspaceView === 'report') && (
              <div className="flex flex-col gap-6 animate-fade-in text-left">
                {!results && !loading ? (
                  <div className="glass-card h-[600px] flex flex-col justify-center items-center text-center gap-4 text-gray-500">
                    <Briefcase size={64} className="stroke-[1.5] text-gray-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300">Ready to Analyze</h3>
                      <p className="text-xs text-gray-500 max-w-xs mt-1 mx-auto">
                        Provide a resume file, job description keywords, and target filters to trigger deep compatibility scans.
                      </p>
                    </div>
                  </div>
                ) : loading ? (
                  <div className="glass-card h-[600px] flex flex-col justify-center items-center text-center gap-4">
                    <RefreshCw size={48} className="animate-spin text-blue-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300">Evaluating Matches</h3>
                      <p className="text-xs text-gray-500 max-w-xs mt-1 mx-auto">
                        Parsing resume grammar, formatting layouts, extracting technical capabilities, and optimizing bullet rewrite candidates...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* SCORES SUMMARY OVERVIEW */}
                    <div className="grid-cols-3">
                      <div className="score-card border-blue-900/40 bg-blue-950/5">
                        <div className="score-header">
                          <span className="score-title">ATS Compatibility</span>
                          <ShieldCheck size={16} className="text-blue-400" />
                        </div>
                        <div className="score-value text-blue-400">
                          {Math.round(results.overall_scores.ats_compatibility)}%
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">Parsability and layout structure validation.</span>
                      </div>

                      <div className="score-card border-green-900/40 bg-green-950/5">
                        <div className="score-header">
                          <span className="score-title">JD Match Accuracy</span>
                          <Sparkles size={16} className="text-green-400" />
                        </div>
                        <div className="score-value text-green-400">
                          {Math.round(results.overall_scores.jd_match)}%
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">Experience relevance & keyword overlaps.</span>
                      </div>

                      <div className="score-card border-purple-900/40 bg-purple-950/5">
                        <div className="score-header">
                          <span className="score-title">Grammar & Syntax</span>
                          <BookOpen size={16} className="text-purple-400" />
                        </div>
                        <div className="score-value text-purple-400">
                          {Math.round(results.overall_scores.grammar)}%
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">Active verbs usage & typo diagnostics.</span>
                      </div>
                    </div>

                    {/* DETAILED SCORE BREAKDOWN RADIAL BAR METERS */}
                    <div className="glass-card">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 pb-2 mb-4 flex items-center gap-1.5">
                        <Columns size={16} /> Compatibility Indicators Breakdown
                      </h3>
                      <div className="grid-cols-4 gap-4">
                        {[
                          { name: 'Keyword Alignment', value: results.overall_scores.keyword_match, color: 'text-green-400' },
                          { name: 'Formatting Check', value: results.overall_scores.formatting, color: 'text-blue-400' },
                          { name: 'Experience Match', value: results.overall_scores.experience, color: 'text-yellow-400' },
                          { name: 'Sections Check', value: results.overall_scores.projects, color: 'text-purple-400' }
                        ].map((m) => (
                          <div key={m.name} className="flex flex-col items-center gap-2 p-3 bg-gray-900/20 border border-gray-800/40 rounded-xl text-center">
                            <span className="text-[11px] font-bold text-gray-400">{m.name}</span>
                            <div className="relative w-16 h-16 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path className="text-gray-800" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className={m.color} strokeWidth="2.5" strokeDasharray={`${m.value}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              </svg>
                              <div className="absolute text-xs font-black">{Math.round(m.value)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* KEYWORDS MATRIX */}
                    <div className="glass-card">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 pb-2 mb-4 flex items-center gap-1.5">
                        <Globe size={16} /> Technical Keywords Match Matrix
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">Add missing hard skills keywords from the job description to improve matching:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          ...(results.keywords?.present || []).map((word) => ({ word, present: true })),
                          ...(results.keywords?.missing || []).map((word) => ({ word, present: false }))
                        ].map((k) => (
                          <span 
                            key={k.word} 
                            className={`keyword-badge ${k.present ? 'badge-present' : 'badge-missing'}`}
                            title={k.present ? "Present in resume" : "Missing from resume"}
                          >
                            {k.word}
                            <span className="text-[9px] font-bold tracking-wider uppercase ml-1.5 opacity-60">
                              {k.present ? 'Match' : 'Missing'}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI-POWERED EXPERIENCE BULLET POINT OPTIMIZER */}
                    <div className="glass-card">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 pb-2 mb-4 flex items-center gap-1.5">
                        <Sparkles size={16} className="text-yellow-400" />
                        AI Experience Bullet Optimizer
                      </h3>
                      <div className="flex flex-col gap-4">
                        {results.bullet_improvements.map((item, idx) => {
                          const original = item.original_text || item.original;
                          const improved = item.optimized_text || item.improved;
                          const reason = item.weakness_reason || (item.reasons || []).join('; ');
                          return (
                          <div key={idx} className="bullet-opt-row">
                            <div className="bullet-opt-header">
                              <span className="bullet-weakness-badge text-yellow-400 bg-yellow-950/20">
                                Weakness: {item.weakness_score}%
                              </span>
                              <span className="text-[11px] font-semibold text-gray-400 italic">"{reason}"</span>
                            </div>
                            <div className="grid-cols-2 mt-2">
                              <div className="p-3 bg-gray-950/40 rounded-lg border border-gray-900">
                                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Original Text</span>
                                <p className="text-xs text-gray-400 leading-relaxed font-mono">"{original}"</p>
                              </div>
                              <div className="p-3 bg-blue-950/20 rounded-lg border border-blue-900/30 relative">
                                <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">Optimized Rewrite</span>
                                <p className="text-xs text-gray-200 leading-relaxed font-mono pr-8">"{improved}"</p>
                                <button 
                                  onClick={() => copyToClipboard(improved, idx)}
                                  className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded transition-all"
                                  title="Copy rewritten bullet to clipboard"
                                >
                                  {copiedIndex === idx ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                </button>
                              </div>
                            </div>
                          </div>
                          );
                        })}

                        {/* ISOLATED MANUAL BULLET OPTIMIZER BOX */}
                        <div className="border-t border-gray-900 pt-4 mt-2">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rewrite Custom Bullet Point</h4>
                          <form onSubmit={runBulletOptimization} className="flex gap-2">
                            <input 
                              type="text" 
                              required
                              placeholder="e.g. Worked on testing APIs to improve backend performance."
                              value={customBullet}
                              onChange={(e) => setCustomBullet(e.target.value)}
                              className="text-xs py-2 bg-gray-900 border border-gray-800 text-gray-300 flex-1 rounded-lg outline-none px-3 focus:border-blue-500"
                            />
                            <button 
                              type="submit" 
                              disabled={optimizingBullet || !customBullet.trim()} 
                              className="btn btn-primary text-xs py-2 shrink-0 px-4 flex items-center gap-1.5"
                            >
                              {optimizingBullet ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                              Rewrite
                            </button>
                          </form>

                          {customBulletResult && (
                            (() => {
                              const improved = customBulletResult.optimized_text || customBulletResult.improved;
                              const reason = customBulletResult.weakness_reason || (customBulletResult.reasons || []).join('; ');
                              return (
                            <div className="grid-cols-2 mt-3 animate-fade-in">
                              <div className="p-3 bg-gray-950/40 rounded-lg border border-gray-900 text-left">
                                <div className="text-[10px] uppercase font-bold text-yellow-500 block mb-1">
                                  Weakness ({customBulletResult.weakness_score}%): {reason}
                                </div>
                              </div>
                              <div className="p-3 bg-blue-950/20 rounded-lg border border-blue-900/30 relative text-left">
                                <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">Optimized Rewrite</span>
                                <p className="text-xs text-gray-200 leading-relaxed font-mono pr-8">"{improved}"</p>
                                <button 
                                  onClick={() => copyCustomToClipboard(improved)}
                                  className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded transition-all"
                                >
                                  {copiedCustom ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                </button>
                              </div>
                            </div>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ATS FORMATTING & GRAMMAR AUDIT REPORT CARDS */}
                    <div className="grid-cols-2">
                      <div className="glass-card">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 pb-2 mb-4 flex items-center gap-1.5">
                          <CheckCircle2 size={16} className="text-green-400" />
                          ATS Layout & Formatting Checks
                        </h3>
                        <div className="flex flex-col gap-3">
                          {[
                            { label: 'Document Parsability', check: !results.formatting.is_scanned, desc: 'Avoid scanned image formats.' },
                            { label: 'Layout Grid Structures', check: !results.formatting.has_tables, desc: 'Tables can break parser outputs.' },
                            { label: 'Image Content Checks', check: !results.formatting.has_images, desc: 'Keep layout clean of graphs or avatars.' },
                            { label: 'Page Limits Audit', check: results.formatting.page_count <= 2, desc: 'Keep content under 2 pages.' }
                          ].map((f) => (
                            <div key={f.label} className="flex justify-between items-start gap-4 p-2 bg-gray-900/10 border border-gray-800/30 rounded-lg">
                              <div>
                                <span className="text-xs font-bold text-gray-300 block">{f.label}</span>
                                <span className="text-[10px] text-gray-500 mt-0.5 block">{f.desc}</span>
                              </div>
                              <span className={`text-xs font-extrabold tracking-wider uppercase px-2 py-0.5 rounded ${f.check ? 'text-green-400 bg-green-950/20' : 'text-red-400 bg-red-950/20'}`}>
                                {f.check ? 'PASS' : 'WARN'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="glass-card">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 pb-2 mb-4 flex items-center gap-1.5">
                          <AlertTriangle size={16} className="text-yellow-400" />
                          Diagnostics & Active coaching Plan
                        </h3>
                        <div className="flex flex-col gap-2.5">
                          {results.action_plan.must_fix.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-3 p-2 bg-red-950/10 border border-red-950/30 rounded-lg">
                              <div>
                                <span className="text-[10px] uppercase font-black text-red-400 block tracking-wider">Critical Fix</span>
                                <span className="text-xs font-bold text-gray-300 mt-0.5 block">{item.check || item.message}</span>
                              </div>
                            </div>
                          ))}

                          {results.action_plan.high_priority.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-3 p-2 bg-yellow-950/10 border border-yellow-950/30 rounded-lg">
                              <div>
                                <span className="text-[10px] uppercase font-black text-yellow-400 block tracking-wider">High Priority</span>
                                <span className="text-xs font-bold text-gray-300 mt-0.5 block">{item.check || item.message}</span>
                              </div>
                            </div>
                          ))}

                          {results.action_plan.medium_priority.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-3 p-2 bg-gray-900/30 border border-gray-800/40 rounded-lg">
                              <div>
                                <span className="text-[10px] uppercase font-black text-gray-400 block tracking-wider">Optimization</span>
                                <span className="text-xs font-bold text-gray-300 mt-0.5 block">{item.check || item.message}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
