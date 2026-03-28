import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import { getUploadUrl, uploadToS3 } from "../api";

export default function HomePage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const fileInputRef = useRef();
  const [file, setFile] = useState(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = (selected) => {
    if (!selected) return;
    const allowed = ["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(selected.type)) { setError("Only PDF and DOCX files are supported."); return; }
    if (selected.size > 5 * 1024 * 1024) { setError("File must be under 5 MB."); return; }
    setError(""); setFile(selected);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files[0]); };

  const handleAnalyze = async () => {
    if (!file) { setError("Please upload a resume first."); return; }
    if (!jobTitle.trim()) { setError("Please enter a job title."); return; }
    setError("");
    navigate("/processing", { state: { file, jobTitle, jobDescription } });
  };

  // ── Tokens ─────────────────────────────────────────────────────
  const tk = isDark ? {
    page:       "bg-[#0d0d14]",
    badge:      "bg-slate-800/50 border-white/5 text-slate-400",
    heroText:   "from-white to-slate-400",
    heroSub:    "text-slate-400",
    dropZone:   dragging ? "border-primary/60 bg-primary/5" : "border-white/10 hover:border-primary/40 bg-white/[0.02]",
    dropText:   "text-white",
    dropSub:    "text-slate-500",
    browseBtn:  "bg-slate-800/80 hover:bg-slate-700 text-white border border-white/5",
    stepLabel:  "text-white font-serif text-2xl",
    stepMono:   "text-slate-500",
    jdLabel:    "text-slate-500",
    jdTA:       "bg-white/[0.02] border-white/10 text-slate-200 placeholder:text-slate-600 focus:border-primary/40",
    featureCard:"glass-card-solid",
    featureDesc:"text-slate-400",
  } : {
    page:       "bg-background-light",
    badge:      "bg-primary/8 border-primary/15 text-primary/70",
    heroText:   "from-slate-900 to-slate-600",
    heroSub:    "text-slate-500",
    dropZone:   dragging ? "border-primary/50 bg-primary/4" : "border-slate-200 hover:border-primary/40 bg-white",
    dropText:   "text-slate-800",
    dropSub:    "text-slate-400",
    browseBtn:  "bg-surface-light-2 hover:bg-slate-200 text-slate-700 border border-border-light",
    stepLabel:  "text-slate-900 font-serif text-2xl",
    stepMono:   "text-slate-400",
    jdLabel:    "text-slate-500",
    jdTA:       "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/10",
    featureCard:"bg-white border border-border-light shadow-card-light",
    featureDesc:"text-slate-500",
  };

  const inputTk = isDark
    ? "input-dark px-4 h-12 mb-4 text-base"
    : "input-dark px-4 h-12 mb-4 text-base";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${tk.page}`}>
      <Navbar activePage="home" />

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-24 w-full">

        {/* Hero */}
        <section className="text-center mb-10">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono mb-8 tracking-widest uppercase ${tk.badge}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/60" />
            </span>
            Powered by GPT-4o AI Analyzer
          </div>
          <h1 className={`font-serif text-5xl md:text-7xl mb-8 leading-[1.1] tracking-tight bg-gradient-to-b bg-clip-text text-transparent ${tk.heroText}`}>
            Analyze your resume <br className="hidden md:block" /> against any job in seconds.
          </h1>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${tk.heroSub}`}>
            Get instant feedback and match scores using our advanced AI analyzer to optimize your job application strategy.
          </p>
        </section>

        {/* Upload Card */}
        <section className={`glass-card-solid rounded-3xl p-6 md:p-12 relative overflow-hidden ${!isDark ? "shadow-[0_2px_8px_rgba(99,102,241,0.08),0_8px_32px_rgba(0,0,0,0.08)]" : "shadow-2xl"}`}>
          {/* Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-3xl rounded-full -mr-48 -mt-48 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-purple/5 blur-3xl rounded-full -ml-48 -mb-48 pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-12">

            {/* Step 1 — Upload */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className={tk.stepLabel}>Upload Resume</h3>
                <span className={`font-mono text-[10px] uppercase tracking-widest ${tk.stepMono}`}>Step 1 of 2</span>
              </div>
              <div
                className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-16 px-6 cursor-pointer transition-all ${tk.dropZone}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])} />
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
                </div>
                {file ? (
                  <>
                    <p className={`text-xl font-medium mb-1 text-primary`}>{file.name}</p>
                    <p className={`text-sm ${tk.dropSub}`}>{(file.size/1024/1024).toFixed(2)} MB · Click to change</p>
                  </>
                ) : (
                  <>
                    <p className={`text-xl font-medium mb-1 ${tk.dropText}`}>Drop your resume here</p>
                    <p className={`text-sm ${tk.dropSub}`}>Supports PDF and DOCX files (Max 5MB)</p>
                  </>
                )}
                <button type="button"
                  className={`mt-8 px-8 py-2.5 text-sm font-bold rounded-lg transition-all ${tk.browseBtn}`}
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  Browse Files
                </button>
              </div>
            </div>

            {/* Step 2 — Job info */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className={tk.stepLabel}>Job Title</h3>
                <span className={`font-mono text-[10px] uppercase tracking-widest ${tk.stepMono}`}>Step 2 of 2</span>
              </div>
              <input className={inputTk}
                placeholder="e.g. Senior Software Engineer, Data Analyst..."
                value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              <label className={`text-sm mb-2 block ${tk.jdLabel}`}>
                Job Description <span className={isDark ? "text-slate-600" : "text-slate-400"}>(Optional)</span>
              </label>
              <textarea
                className={`w-full min-h-[160px] border rounded-2xl p-6 placeholder:text-slate-400 focus:ring-0 focus:outline-none transition-all resize-none text-base leading-relaxed ${tk.jdTA}`}
                placeholder="Paste the job description here to see how you match (optional)"
                value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
            </div>

            {/* Analyze */}
            <div className="pt-2">
              {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
              <button onClick={handleAnalyze}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 group transition-all transform hover:-translate-y-0.5"
                style={{ boxShadow: "0 4px 16px rgba(99,102,241,0.35), 0 1px 3px rgba(99,102,241,0.3)" }}>
                <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">auto_awesome</span>
                <span className="text-lg">Analyze Resume</span>
              </button>
              <p className={`text-center text-[10px] mt-6 font-mono tracking-widest uppercase ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Average processing time: &lt; 8 seconds
              </p>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="grid md:grid-cols-3 gap-6 mt-20">
          {[
            { icon: "search_insights", color: "text-primary",   title: "ATS Score",      desc: "See exactly how ATS systems parse your resume and identify potential formatting issues." },
            { icon: "track_changes",   color: "text-amber-500", title: "Keyword Gap",    desc: "Identify missing keywords and skills that are crucial for the specific role you're targeting." },
            { icon: "auto_awesome_motion", color: "text-emerald-500", title: "AI Suggestions", desc: "Get bullet-point specific rewrite suggestions to make your achievements more impactful." },
          ].map((card) => (
            <div key={card.title} className={`p-8 rounded-2xl transition-all hover:-translate-y-0.5 ${tk.featureCard}`}>
              <span className={`material-symbols-outlined text-3xl mb-5 block ${card.color}`}>{card.icon}</span>
              <h4 className={`font-serif text-xl mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}>{card.title}</h4>
              <p className={`text-sm leading-relaxed ${tk.featureDesc}`}>{card.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
