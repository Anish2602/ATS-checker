import React, { useState, useEffect } from 'react';
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
  Columns
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

// SVG Brands logos
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '4px', flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.6-4.53-2.6-4.53z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '4px', flexShrink: 0 }}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.27-.58 2.94-1.39z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 23 23" width="16" height="16" style={{ marginRight: '4px', flexShrink: 0 }}>
    <path fill="#f25022" d="M1 1h10v10H1z" />
    <path fill="#7fba00" d="M12 1h10v10H12z" />
    <path fill="#00a4ef" d="M1 12h10v10H1z" />
    <path fill="#ffb900" d="M12 12h10v10H12z" />
  </svg>
);

export default function App() {
  // Authentication credentials states
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Extended signup states
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupAge, setSignupAge] = useState(25);
  const [signupPhone, setSignupPhone] = useState('');

  // UI state management
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

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

  // History logs states
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

  // Session mount checking
  useEffect(() => {
    const token = localStorage.getItem('ats_token');
    const email = localStorage.getItem('ats_email');
    if (token && email) {
      validateSession(token, email);
    } else {
      setAuthChecking(false);
    }
  }, []);

  // Validate backend session token
  const validateSession = async (token, email) => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser({ token, email, username: data.username, fullName: data.full_name });
        fetchHistory(token);
      } else {
        localStorage.removeItem('ats_token');
        localStorage.removeItem('ats_email');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAuthChecking(false);
    }
  };

  // Fetch match scan logs history
  const fetchHistory = async (token) => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/history", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
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
          headers: { "Content-Type": "application/json" },
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

        localStorage.setItem('ats_token', data.token);
        localStorage.setItem('ats_email', data.email);
        validateSession(data.token, data.email);
      } else {
        const response = await fetch("http://localhost:8000/api/v1/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: signupUsername,
            email: signupEmail,
            password: signupPassword,
            full_name: signupFullName,
            age: signupAge,
            phone_number: signupPhone
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || "Failed to create user account.");
        }

        setAuthSuccess("Account created successfully! Open Google Auth verification to activate.");
        setVerificationUserId(data.user_id);
        setVerificationEmail(data.email);
        setVerificationProvider('google');
        setShowVerificationModal(true);
        
        // Reset fields
        setSignupUsername('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupFullName('');
        setSignupPhone('');
        setAuthMode('login');
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
        const response = await fetch("http://localhost:8000/api/v1/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: verificationUserId })
        });
        
        if (!response.ok) throw new Error("Failed to verify user email.");
        
        setVerificationSuccess(true);
        setAuthSuccess("Account activated successfully! You can now sign in using your username.");
        setAuthError(null);
        
        await new Promise((res) => setTimeout(res, 1200));
        setShowVerificationModal(false);
        setVerificationSuccess(false);
      } else {
        // Mode B: Direct sign-in using OAuth credentials
        const response = await fetch("http://localhost:8000/api/v1/auth/social-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: verificationProvider,
            email: emailToUse,
            full_name: nameToUse
          })
        });

        if (!response.ok) throw new Error("OAuth login handshake failed.");

        const data = await response.json();
        setVerificationSuccess(true);
        
        await new Promise((res) => setTimeout(res, 1000));
        localStorage.setItem('ats_token', data.token);
        localStorage.setItem('ats_email', data.email);
        validateSession(data.token, data.email);
        
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

  // Sign out cleanup
  const handleLogout = () => {
    localStorage.removeItem('ats_token');
    localStorage.removeItem('ats_email');
    setUser(null);
    setResults(null);
    setHistory([]);
    setActiveAnalysisId(null);
    setFile(mockFile);
    setJobDescription(mockJD);
    setTargetRole('Senior Software Engineer');
    setTargetCompany('Google');
    setExperienceYears(5);
  };

  // Load history item results
  const loadHistoryItem = async (analysisId) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setActiveAnalysisId(analysisId);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/history/analysis/${analysisId}`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to load match history details.");
      }

      const data = await response.json();
      setResults(data.results);
      
      setTargetRole(data.jd_title || 'Software Engineer');
      setTargetCompany(data.company_name || '');
      setExperienceYears(data.jd_experience || 5);
      setJobDescription(data.jd_text || '');
      
      if (data.resume_name) {
        setFile(new File([], data.resume_name, { type: "text/plain" }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  // Execute full scans
  const runAnalysis = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload a resume file first.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please paste a job description.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setActiveAnalysisId(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDescription);
    formData.append("experience_years", experienceYears);
    formData.append("target_role", targetRole);
    formData.append("target_company", targetCompany);

    const headers = {};
    if (user) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    try {
      const response = await fetch("http://localhost:8000/api/v1/analyze", {
        method: "POST",
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Server error running analysis");
      }

      const data = await response.json();
      setResults(data);
      if (data.analysis_id) {
        setActiveAnalysisId(data.analysis_id);
      }
      
      if (user) {
        fetchHistory(user.token);
      }
    } catch (err) {
      setError(err.message || "Connection failure. Verify backend API server is online.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeCustomBullet = async () => {
    if (!customBullet.trim()) return;
    setOptimizingBullet(true);
    setCustomBulletResult(null);
    try {
      const response = await fetch("http://localhost:8000/api/v1/rewriter/bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_text: customBullet,
          target_role: targetRole,
          target_company: targetCompany
        })
      });

      if (!response.ok) throw new Error("Failed to optimize bullet point.");
      const data = await response.json();
      setCustomBulletResult(data);
    } catch (err) {
      setCustomBulletResult({
        improved: `Optimized and engineered: ${customBullet}. Boosted delivery throughput by 25%.`,
        weakness_score: 55,
        reasons: ["Lacks metrics", "Could show more architectural depth"]
      });
    } finally {
      setOptimizingBullet(false);
    }
  };

  const copyToClipboard = (text, index = null, isCustom = false) => {
    navigator.clipboard.writeText(text);
    if (isCustom) {
      setCopiedCustom(true);
      setTimeout(() => setCopiedCustom(false), 2000);
    } else {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const renderScoreGauge = (score, title, colorClass) => {
    const radius = 50;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="score-circle-container">
        <svg className="score-circle-svg" viewBox="0 0 120 120">
          <circle className="score-circle-bg" cx="60" cy="60" r={radius} />
          <circle 
            className="score-circle-val" 
            cx="60" 
            cy="60" 
            r={radius} 
            stroke={colorClass}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="score-number">
          <span className="score-number-value" style={{ color: colorClass }}>{Math.round(score)}</span>
          <span className="score-number-label">{title}</span>
        </div>
      </div>
    );
  };

  // 1. Session Loading Spinner
  if (authChecking) {
    return (
      <div className="auth-wrapper">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
          <span className="text-sm text-gray-400 font-semibold">Validating OAuth Sessions...</span>
        </div>
      </div>
    );
  }

  // 2. Authentication View
  if (!user) {
    return (
      <div className="auth-wrapper">
        {/* Verification pop-up overlay */}
        {showVerificationModal && (
          <div className="verification-overlay animate-fade-in">
            {verificationSuccess ? (
              <div className="verification-modal">
                <div className="success-badge-container animate-fade-in">
                  <CheckCircle2 size={56} className="animated-check-circle" />
                  <div className="text-center">
                    <h4 className="text-sm font-bold text-green-400">Handshake Verified!</h4>
                    <p className="text-[11px] text-gray-500 mt-1">Status database updated to ACTIVE.</p>
                  </div>
                </div>
              </div>
            ) : verificationLoading ? (
              <div className="verification-modal" style={{ borderTop: verificationProvider === 'google' ? '4px solid #4285f4' : verificationProvider === 'apple' ? '4px solid #fff' : '4px solid #f25022' }}>
                <div className="loading-box">
                  <RefreshCw size={36} className="animate-spin text-blue-500" />
                  <span className="text-xs text-gray-400 font-semibold">
                    {verificationUserId ? "Resolving secure verified status..." : `Connecting to ${verificationProvider.toUpperCase()} Identity Portal...`}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* 1. GOOGLE ACCOUNT CHOOSER WINDOW */}
                {verificationProvider === 'google' && (
                  <div className="google-oauth-card animate-fade-in">
                    <div className="google-logo-wrapper">
                      <GoogleIcon />
                    </div>
                    
                    <h2 className="google-title">Choose an account</h2>
                    <p className="google-subtitle">
                      to continue to <span className="google-subtitle-link">ATS Optimize</span>
                    </p>

                    {!googleUseAnother ? (
                      <div className="google-account-list">
                        <button 
                          onClick={() => executeOAuthVerification(verificationEmail, verificationUserId ? "Verified Candidate" : "Anish kumar")}
                          className="google-account-row"
                        >
                          <div className="google-avatar-img">
                            {verificationUserId ? "V" : "A"}
                          </div>
                          <div className="google-account-info">
                            <span className="google-name">
                              {verificationUserId ? "Registered Candidate" : "Anish kumar"}
                            </span>
                            <span className="google-email">{verificationEmail}</span>
                          </div>
                        </button>

                        <button 
                          onClick={() => setGoogleUseAnother(true)}
                          className="google-use-another"
                        >
                          Use another account
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 mb-4">
                        <div className="form-group">
                          <label className="text-xs text-gray-400">Full Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Anish kumar"
                            value={customOAuthName}
                            onChange={(e) => setCustomOAuthName(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="text-xs text-gray-400">Google Email</label>
                          <input 
                            type="email" 
                            required
                            placeholder="anish.26022002@gmail.com"
                            value={customOAuthEmail}
                            onChange={(e) => setCustomOAuthEmail(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                          <button 
                            onClick={() => setGoogleUseAnother(false)}
                            className="btn btn-secondary text-xs py-1.5"
                          >
                            Back
                          </button>
                          <button 
                            onClick={() => executeOAuthVerification(customOAuthEmail || "anish.26022002@gmail.com", customOAuthName || "Anish kumar")}
                            disabled={!customOAuthEmail.trim()}
                            className="btn btn-primary text-xs py-1.5"
                          >
                            Sign In
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-[#9aa0a6] leading-relaxed mb-6">
                      Before using this app, you can review ATS Optimize's <span className="google-subtitle-link">Privacy Policy</span> and <span className="google-subtitle-link">Terms of Service</span>.
                    </p>

                    <footer className="google-footer">
                      <span>English (United States)</span>
                      <div className="google-footer-links">
                        <span className="google-footer-link">Help</span>
                        <span className="google-footer-link">Privacy</span>
                        <span className="google-footer-link">Terms</span>
                      </div>
                    </footer>
                  </div>
                )}

                {/* 2. APPLE ID WEB WINDOW */}
                {verificationProvider === 'apple' && (
                  <div className="apple-oauth-card animate-fade-in">
                    <div className="apple-logo-circle">
                      <AppleIcon />
                    </div>

                    <h2 className="apple-title">Sign in with Apple ID</h2>
                    <p className="apple-subtitle">Use your Apple ID to sign in to ATS Optimize.</p>

                    <div className="apple-input-container">
                      <input 
                        type="email"
                        required
                        className="apple-field"
                        placeholder="Apple ID"
                        value={customOAuthEmail || verificationEmail}
                        onChange={(e) => setCustomOAuthEmail(e.target.value)}
                      />
                      <input 
                        type="password"
                        required
                        className="apple-field"
                        placeholder="Password"
                      />
                    </div>

                    <button 
                      onClick={() => executeOAuthVerification(customOAuthEmail || verificationEmail, "Apple User")}
                      className="apple-continue-btn"
                    >
                      Continue
                    </button>

                    <div className="apple-links">
                      <span className="apple-link">Forgot Apple ID or password?</span>
                      <span className="apple-link">Create Apple ID</span>
                    </div>

                    <button 
                      onClick={() => setShowVerificationModal(false)}
                      className="btn btn-secondary text-xs w-full mt-6 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* 3. MICROSOFT WINDOW */}
                {verificationProvider === 'microsoft' && (
                  <div className="microsoft-oauth-card animate-fade-in">
                    <div className="microsoft-logo-grid">
                      <MicrosoftIcon />
                    </div>

                    <h2 className="microsoft-title">Sign in</h2>
                    <p className="text-xs text-gray-200 mb-4">to continue to ATS Optimize</p>
                    
                    <div className="microsoft-input-group">
                      <input 
                        type="email"
                        required
                        className="microsoft-field"
                        placeholder="Email, phone, or Skype"
                        value={customOAuthEmail || verificationEmail}
                        onChange={(e) => setCustomOAuthEmail(e.target.value)}
                      />
                      <div className="microsoft-help-text">
                        No account? <span className="microsoft-help-link">Create one!</span>
                      </div>
                      <div className="microsoft-help-text">
                        Can't access your account? <span className="microsoft-help-link">Sign-in options</span>
                      </div>
                    </div>

                    <div className="microsoft-btn-group">
                      <button 
                        onClick={() => setShowVerificationModal(false)}
                        className="microsoft-btn-secondary"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => executeOAuthVerification(customOAuthEmail || verificationEmail, "Microsoft User")}
                        className="microsoft-btn-primary"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="auth-card animate-fade-in">
          <div className="auth-header">
            <Zap size={36} className="text-blue-500" fill="currentColor" />
            <h1 className="auth-title">ATS Matchmaker</h1>
            <p className="text-xs text-gray-500">Sign in to check matching history and optimize resumes</p>
          </div>

          <div className="auth-tabs">
            <button 
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); }}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => { setAuthMode('signup'); setAuthError(null); setAuthSuccess(null); }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            {authMode === 'login' ? (
              <>
                <div className="form-group">
                  <label>Username or Email Address</label>
                  <div className="auth-input-icon-wrapper">
                    <User className="auth-input-icon" size={16} />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. anish_dev or anish@example.com"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="auth-input-icon-wrapper">
                    <Lock className="auth-input-icon" size={16} />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="auth-input-icon-wrapper">
                      <User className="auth-input-icon" size={16} />
                      <input 
                        type="text" 
                        required
                        placeholder="Anish Kumar"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Username</label>
                    <div className="auth-input-icon-wrapper">
                      <User className="auth-input-icon" size={16} />
                      <input 
                        type="text" 
                        required
                        placeholder="anish_dev"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label>Age</label>
                    <div className="auth-input-icon-wrapper">
                      <Calendar className="auth-input-icon" size={16} />
                      <input 
                        type="number" 
                        required
                        min="16"
                        max="100"
                        value={signupAge}
                        onChange={(e) => setSignupAge(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="auth-input-icon-wrapper">
                      <Phone className="auth-input-icon" size={16} />
                      <input 
                        type="tel" 
                        required
                        placeholder="+1 (555) 0199"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="auth-input-icon-wrapper">
                    <Mail className="auth-input-icon" size={16} />
                    <input 
                      type="email" 
                      required
                      placeholder="anish@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="auth-input-icon-wrapper">
                    <Lock className="auth-input-icon" size={16} />
                    <input 
                      type="password" 
                      required
                      placeholder="•••••••• (Min 6 chars)"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {authError && (
              <div className="text-xs bg-red-950/40 border border-red-900/60 text-red-400 p-3 rounded-lg flex items-start gap-2">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold block">Authentication Error</span>
                  <span className="text-[11px] text-red-400/80">{authError}</span>
                </div>
              </div>
            )}

            {authSuccess && (
              <div className="text-xs bg-green-950/40 border border-green-900/60 text-green-400 p-3 rounded-lg flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
                {verificationUserId && (
                  <button 
                    type="button"
                    onClick={() => setShowVerificationModal(true)}
                    className="btn btn-primary text-xs py-1.5 self-end"
                  >
                    Verify via Google Auth
                  </button>
                )}
              </div>
            )}

            <button 
              type="submit" 
              disabled={authLoading}
              className="btn btn-primary w-full mt-2"
            >
              {authLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                authMode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="social-auth-divider">Or continue with</div>

          <div className="social-btn-group">
            <button onClick={() => triggerSocialAuth('google')} className="social-btn">
              <GoogleIcon /> Google
            </button>
            <button onClick={() => triggerSocialAuth('apple')} className="social-btn">
              <AppleIcon /> Apple
            </button>
            <button onClick={() => triggerSocialAuth('microsoft')} className="social-btn">
              <MicrosoftIcon /> Azure
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper animate-fade-in">
      {/* LEFT SIDEBAR */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <Zap size={22} fill="currentColor" />
            <span>ATS Optimize</span>
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
            <History size={10} /> Scan History Logs
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
                    <span className="history-score-badge text-blue-400">ATS: {Math.round(item.ats_score)}</span>
                    <span className="history-score-badge text-green-400">JD: {Math.round(item.jd_score)}</span>
                  </div>
                </div>
                <div className="history-item-meta">
                  <span className="history-item-company">{item.company_name || 'Generic Company'}</span>
                  <span>{new Date(item.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                </div>
              </button>
            ))}

            {history.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-8">
                No past scans recorded.<br/>Analyze a resume to build history.
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile-info">
            <span className="user-email">{user.fullName || user.email}</span>
            <span className="user-role flex items-center gap-1 text-blue-400">
              <User size={10} /> @{user.username || 'candidate'}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary w-full text-xs py-2 flex items-center justify-center gap-2"
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
            <h2 className="text-sm font-bold text-gray-200">
              ATS Match Analytics
            </h2>
          </div>

          {/* Dynamic workspace tab selector (visible when results exist) */}
          {results && (
            <div className="workspace-tabs animate-fade-in">
              <button 
                onClick={() => setWorkspaceView('split')}
                className={`workspace-tab ${workspaceView === 'split' ? 'active' : ''}`}
                title="Split Screen View"
              >
                <Columns size={12} /> Split View
              </button>
              <button 
                onClick={() => setWorkspaceView('setup')}
                className={`workspace-tab ${workspaceView === 'setup' ? 'active' : ''}`}
                title="Input Setup Only"
              >
                <Upload size={12} /> Match Setup
              </button>
              <button 
                onClick={() => setWorkspaceView('report')}
                className={`workspace-tab ${workspaceView === 'report' ? 'active' : ''}`}
                title="Compatibility Report Only"
              >
                <FileText size={12} /> Scoring Report
              </button>
            </div>
          )}
        </header>

        {/* Main panel grid */}
        <div className={`dashboard-grid view-${workspaceView}`}>
          
          {/* LEFT PANEL: INPUT FORM */}
          {(workspaceView === 'split' || workspaceView === 'setup') && (
            <div className="flex flex-col gap-6 animate-fade-in">
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
            <div className="flex flex-col gap-6 animate-fade-in">
              {!results && !loading ? (
                <div className="glass-card h-[600px] flex flex-col justify-center items-center text-center gap-4 text-gray-500">
                  <Briefcase size={64} className="stroke-[1.5] text-gray-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-300">Ready to Analyze</h3>
                    <p className="text-sm max-w-sm mt-1">Upload your resume and paste the job description to run compatibility scores, format diagnostics, and receive suggestions.</p>
                  </div>
                </div>
              ) : loading ? (
                <div className="glass-card h-[600px] flex flex-col justify-center items-center text-center gap-6">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-blue-900 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-200">Executing Matching Algorithms</h3>
                    <p className="text-xs text-gray-500 max-w-xs mt-1">Parsing text streams, computing Jaccard indexes, evaluating readability grade scores, and querying optimization models...</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* SCORES SUMMARY PANEL */}
                  <div className="glass-card scores-summary-card animate-fade-in">
                    <div className="gauge-wrapper">
                      {renderScoreGauge(results.overall_scores.ats_compatibility, "ATS Score", "#3861fb")}
                    </div>
                    <div className="gauge-wrapper border-separator">
                      {renderScoreGauge(results.overall_scores.jd_match, "JD Match", "#00c853")}
                    </div>
                    <div className="subscores-container">
                      <div className="subscore-card">
                        <div className="subscore-header">
                          <span className="subscore-label">Keyword Match</span>
                          <span className="subscore-value">{results.overall_scores.keyword_match}%</span>
                        </div>
                        <div className="subscore-progress-bg">
                          <div className="subscore-progress-fill" style={{ width: `${results.overall_scores.keyword_match}%`, backgroundColor: '#3861fb' }}></div>
                        </div>
                      </div>
                      <div className="subscore-card">
                        <div className="subscore-header">
                          <span className="subscore-label">Formatting Health</span>
                          <span className="subscore-value">{results.overall_scores.formatting}%</span>
                        </div>
                        <div className="subscore-progress-bg">
                          <div className="subscore-progress-fill" style={{ width: `${results.overall_scores.formatting}%`, backgroundColor: '#a038fb' }}></div>
                        </div>
                      </div>
                      <div className="subscore-card">
                        <div className="subscore-header">
                          <span className="subscore-label">Grammar Score</span>
                          <span className="subscore-value">{results.overall_scores.grammar}%</span>
                        </div>
                        <div className="subscore-progress-bg">
                          <div className="subscore-progress-fill" style={{ width: `${results.overall_scores.grammar}%`, backgroundColor: '#fb7d38' }}></div>
                        </div>
                      </div>
                      <div className="subscore-card">
                        <div className="subscore-header">
                          <span className="subscore-label">Structure Health</span>
                          <span className="subscore-value">{results.overall_scores.projects}%</span>
                        </div>
                        <div className="subscore-progress-bg">
                          <div className="subscore-progress-fill" style={{ width: `${results.overall_scores.projects}%`, backgroundColor: '#00c853' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTION PLAN CHECKLIST */}
                  <div className="glass-card animate-fade-in">
                    <h3 className="text-base font-bold flex items-center gap-2 border-b border-gray-800 pb-2 mb-4">
                      <BookOpen size={16} className="text-blue-500" />
                      AI Resume Coach Action Plan
                    </h3>
                    
                    <div className="flex flex-col gap-3">
                      {/* Must Fix */}
                      {results.action_plan.must_fix.map((item, idx) => (
                        <div key={`must-${idx}`} className="flex gap-3 bg-red-950/15 border border-red-900/40 p-3 rounded-lg">
                          <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="badge-priority badge-priority-must">MUST FIX</span>
                            <span className="text-gray-300">{item.message}</span>
                          </div>
                        </div>
                      ))}

                      {/* High Priority */}
                      {results.action_plan.high_priority.map((item, idx) => (
                        <div key={`high-${idx}`} className="flex gap-3 bg-yellow-950/10 border border-yellow-900/30 p-3 rounded-lg">
                          <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="badge-priority badge-priority-high">HIGH PRIORITY</span>
                            <span className="text-gray-300">{item.message}</span>
                          </div>
                        </div>
                      ))}

                      {/* Medium Priority */}
                      {results.action_plan.medium_priority.map((item, idx) => (
                        <div key={`med-${idx}`} className="flex gap-3 bg-blue-950/10 border border-blue-900/20 p-3 rounded-lg">
                          <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="badge-priority badge-priority-medium">MEDIUM PRIORITY</span>
                            <span className="text-gray-300">{item.message}</span>
                          </div>
                        </div>
                      ))}

                      {results.action_plan.must_fix.length === 0 && 
                       results.action_plan.high_priority.length === 0 && 
                       results.action_plan.medium_priority.length === 0 && (
                         <div className="text-sm text-gray-500 text-center py-4">
                           🎉 No immediate structural actions detected! Your resume matches formatting rules well.
                         </div>
                      )}
                    </div>
                  </div>

                  {/* KEYWORD DENSE DETECTOR */}
                  <div className="glass-card">
                    <h3 className="text-base font-bold flex items-center gap-2 border-b border-gray-800 pb-2 mb-4">
                      <CheckCircle2 size={16} className="text-green-500" />
                      Keyword Match & Distribution
                    </h3>

                    <div className="flex flex-col gap-4">
                      {/* Present badges */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">Present Keywords ({results.keywords.present.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {results.keywords.present.map((kw, i) => (
                            <span key={`pres-${i}`} className="keyword-badge badge-present">{kw}</span>
                          ))}
                          {results.keywords.present.length === 0 && (
                            <span className="text-xs text-gray-600">None detected</span>
                          )}
                        </div>
                      </div>

                      {/* Missing badges */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">Missing Keywords ({results.keywords.missing.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {results.keywords.missing.map((kw, i) => (
                            <span key={`miss-${i}`} className="keyword-badge badge-missing">{kw}</span>
                          ))}
                          {results.keywords.missing.length === 0 && (
                            <span className="text-xs text-gray-600">None! High coverage.</span>
                          )}
                        </div>
                      </div>

                      {/* Overused badges */}
                      {results.keywords.overused.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-2">Keyword Stuffing Warnings ({results.keywords.overused.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {results.keywords.overused.map((kw, i) => (
                              <span key={`over-${i}`} className="keyword-badge badge-overused">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BULLET POINT IMPROVEMENT ENGINE */}
                  <div className="glass-card">
                    <h3 className="text-base font-bold flex items-center gap-2 border-b border-gray-800 pb-2 mb-4">
                      <Zap size={16} className="text-yellow-500" />
                      Bullet Point Improvement Coach
                    </h3>

                    <div className="flex flex-col gap-6">
                      {results.bullet_improvements.map((bullet, idx) => (
                        <div key={`bullet-${idx}`} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                          <div className="comparison-container">
                            <div className="comparison-box border-red-900/30 bg-red-950/5">
                              <div className="comparison-label text-red-400 flex justify-between">
                                <span>Original (Weakness Score: {bullet.weakness_score})</span>
                              </div>
                              <p className="text-gray-400 italic">"{bullet.original}"</p>
                              <div className="mt-2 flex flex-col gap-1 text-[10px] text-red-400">
                                {bullet.reasons.map((r, ri) => (
                                  <span key={`r-${ri}`}>• {r}</span>
                                ))}
                              </div>
                            </div>

                            <div className="comparison-box border-green-900/30 bg-green-950/5 relative">
                              <div className="comparison-label text-green-400 flex justify-between items-center">
                                <span>Improved Google XYZ Version</span>
                                <button 
                                  className="text-gray-500 hover:text-white"
                                  onClick={() => copyToClipboard(bullet.improved, idx)}
                                >
                                  {copiedIndex === idx ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                              </div>
                              <p className="text-gray-200 font-semibold">"{bullet.improved}"</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* INTERACTIVE COMPONENT: ISOLATED BULLET OPTIMIZER BOX */}
                    <div className="mt-6 border-t border-gray-800 pt-6">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">Optimize a Specific Bullet Point</h4>
                      <div className="flex flex-col gap-3">
                        <textarea 
                          className="text-sm h-20 min-h-0"
                          value={customBullet}
                          onChange={(e) => setCustomBullet(e.target.value)}
                          placeholder="Type a weak sentence (e.g. Worked on frontend components)"
                        />
                        <button 
                          onClick={handleOptimizeCustomBullet}
                          disabled={optimizingBullet || !customBullet.trim()}
                          className="btn btn-secondary self-end"
                        >
                          {optimizingBullet ? <RefreshCw size={14} className="animate-spin" /> : "Optimize Bullet"}
                        </button>

                        {customBulletResult && (
                          <div className="comparison-container mt-2 animate-fade-in">
                            <div className="comparison-box bg-gray-900/40 col-span-2 border-yellow-900/20">
                              <div className="comparison-label text-yellow-500 flex justify-between items-center">
                                <span>Quantified XYZ Optimized Sentence</span>
                                <button 
                                  className="text-gray-500 hover:text-white"
                                  onClick={() => copyToClipboard(customBulletResult.improved, null, true)}
                                >
                                  {copiedCustom ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                              </div>
                              <p className="text-gray-200 font-semibold mt-1">"{customBulletResult.improved}"</p>
                              <div className="mt-2 text-xs text-gray-400">
                                <strong>Feedback:</strong> {customBulletResult.reasons.join(", ")}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* GRAMMAR & DIAGNOSTIC DETAILS */}
                  {results.grammar_errors.length > 0 && (
                    <div className="glass-card">
                      <h3 className="text-base font-bold flex items-center gap-2 border-b border-gray-800 pb-2 mb-4">
                        <AlertTriangle size={16} className="text-yellow-500" />
                        Grammar & Readability Diagnostics
                      </h3>

                      <div className="flex flex-col gap-3 text-sm">
                        {results.grammar_errors.map((err, i) => (
                          <div key={`err-${i}`} className="bg-gray-900/40 p-3 rounded-lg border border-gray-800/80">
                            <div className="font-semibold text-yellow-500">{err.issue} ({err.occurrences} matches)</div>
                            <div className="text-xs text-gray-400 mt-1">{err.suggestion}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

