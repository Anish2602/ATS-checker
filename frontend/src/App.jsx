import React, { useState, useEffect } from 'react';
// @ts-ignore
import { atsApi } from './lib/api';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  BookOpen,
  AlertCircle,
  Copy,
  Check,
  Briefcase,
  ShieldCheck,
  Globe,
  Sparkles,
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

export default function App() {
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

  // Workspace layout: 'split' | 'setup' | 'report'
  const [workspaceView, setWorkspaceView] = useState('split');

  // Old /login, /signup, /verify-email, ... links land on the dashboard; tidy the URL.
  useEffect(() => {
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }
  }, []);

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

  return (
    <div className="app-wrapper animate-fade-in">
      <main className="main-content-layout">

        {/* Workspace Header */}
        <header className="workspace-header">
          <div className="workspace-title-section" style={{ flexWrap: 'wrap' }}>
            <div className="brand" style={{ fontSize: '1.25rem' }}>
              <Zap size={22} fill="currentColor" />
              <span>ATS Optimize</span>
            </div>
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
              ATS Match Analytics
            </h2>
          </div>

          {/* Workspace tab selector (visible once results exist) */}
          {results && (
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
                        { name: 'Keyword Alignment', value: results.overall_scores.keyword_match, color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' },
                        { name: 'Formatting Check',  value: results.overall_scores.formatting,     color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' },
                        { name: 'Experience Match',  value: results.overall_scores.experience,     color: '#facc15', bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.2)'  },
                        { name: 'Sections Check',    value: results.overall_scores.projects,       color: '#c084fc', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)' }
                      ].map((m) => (
                        <div key={m.name} style={{ background: m.bg, border: `1px solid ${m.border}` }} className="flex flex-col items-center gap-3 p-4 rounded-xl text-center">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{m.name}</span>
                          <div className="relative w-20 h-20 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                              <path stroke="#1f2937" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path stroke={m.color} strokeWidth="3" strokeDasharray={`${m.value}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="absolute text-sm font-black" style={{ color: m.color }}>{Math.round(m.value)}%</div>
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
                          <div key={f.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', padding:'0.5rem 0.6rem', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px' }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#d1d5db', marginBottom:'2px' }}>{f.label}</div>
                              <div style={{ fontSize:'0.68rem', color:'#6b7280' }}>{f.desc}</div>
                            </div>
                            <div style={{ fontSize:'0.7rem', fontWeight:800, letterSpacing:'0.06em', padding:'2px 8px', borderRadius:'5px', whiteSpace:'nowrap', color: f.check ? '#4ade80' : '#f87171', background: f.check ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)' }}>
                              {f.check ? 'PASS' : 'WARN'}
                            </div>
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
                          <div key={idx} style={{ padding:'0.5rem 0.6rem', background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:'8px' }}>
                            <div style={{ fontSize:'0.65rem', fontWeight:900, color:'#f87171', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'4px' }}>Critical Fix</div>
                            <div style={{ fontSize:'0.75rem', fontWeight:600, color:'#e5e7eb', lineHeight:1.4 }}>{item.check || item.message}</div>
                          </div>
                        ))}

                        {results.action_plan.high_priority.map((item, idx) => (
                          <div key={idx} style={{ padding:'0.5rem 0.6rem', background:'rgba(202,138,4,0.08)', border:'1px solid rgba(202,138,4,0.2)', borderRadius:'8px' }}>
                            <div style={{ fontSize:'0.65rem', fontWeight:900, color:'#facc15', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'4px' }}>High Priority</div>
                            <div style={{ fontSize:'0.75rem', fontWeight:600, color:'#e5e7eb', lineHeight:1.4 }}>{item.check || item.message}</div>
                          </div>
                        ))}

                        {results.action_plan.medium_priority.map((item, idx) => (
                          <div key={idx} style={{ padding:'0.5rem 0.6rem', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px' }}>
                            <div style={{ fontSize:'0.65rem', fontWeight:900, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'4px' }}>Optimization</div>
                            <div style={{ fontSize:'0.75rem', fontWeight:600, color:'#e5e7eb', lineHeight:1.4 }}>{item.check || item.message}</div>
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

      </main>
    </div>
  );
}
