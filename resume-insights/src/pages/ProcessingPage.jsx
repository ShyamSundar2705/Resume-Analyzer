import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getUploadUrl, uploadToS3, analyzeResume } from "../api";

const STEPS = [
  { key: "uploading",  label: "Uploading Resume",      desc: "Encrypting and sending to secure S3 storage" },
  { key: "extracting", label: "Extracting Skills",      desc: "Scanning experience for keywords and tech stack..." },
  { key: "matching",   label: "Matching Jobs",          desc: "Running ML similarity scoring against job requirements" },
  { key: "feedback",   label: "Generating AI Feedback", desc: "Preparing customized resume optimization tips" },
];
const STATUS = { pending: "pending", active: "active", done: "done" };

export default function ProcessingPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();
  const { isDark } = useTheme();
  const { file, jobTitle, jobDescription } = location.state || {};

  const [stepStatuses, setStepStatuses] = useState({
    uploading: STATUS.active, extracting: STATUS.pending,
    matching: STATUS.pending, feedback: STATUS.pending,
  });
  const [progress, setProgress] = useState(5);
  const [error, setError] = useState("");

  const setStep = (key, status) => setStepStatuses((prev) => ({ ...prev, [key]: status }));

  useEffect(() => {
    if (!file || !jobTitle) { navigate("/home"); return; }
    runPipeline();
  }, []);

  const runPipeline = async () => {
    try {
      setStep("uploading", STATUS.active); setProgress(10);
      const { upload_url, file_key } = await getUploadUrl(file.name, file.type);
      await uploadToS3(upload_url, file);
      setStep("uploading", STATUS.done); setProgress(30);

      setStep("extracting", STATUS.active); setProgress(45);
      setStep("extracting", STATUS.done);
      setStep("matching", STATUS.active); setProgress(65);

      const result = await analyzeResume(file_key, jobTitle, jobDescription, user?.email || "anonymous", file.name || "resume");
      setStep("matching", STATUS.done); setProgress(85);

      setStep("feedback", STATUS.active); setProgress(95);
      await new Promise((r) => setTimeout(r, 600));
      setStep("feedback", STATUS.done); setProgress(100);

      try { sessionStorage.setItem("lastAnalysis", JSON.stringify(result)); } catch (_) {}
      setTimeout(() => navigate("/dashboard", { state: { analysis: result } }), 500);
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
    }
  };

  // ── Tokens ──────────────────────────────────────────────────────
  const tk = isDark ? {
    page:       "bg-[#0d0d14] text-slate-100",
    header:     "border-slate-800 bg-[#0d0d14]",
    logoText:   "text-white",
    title:      "text-white",
    sub:        "text-slate-400",
    trackBg:    "text-slate-800",
    tipWrap:    "text-slate-400",
    tipCard:    "bg-primary/10 border-primary/20",
    tipText:    "text-slate-300",
    errCard:    "bg-red-500/10 border-red-500/30",
    stepDone:   "bg-green-500/10 text-green-500 border-green-500/20",
    stepActive: "bg-primary/10 text-primary border-primary/20",
    stepPend:   "bg-slate-800 text-slate-400 border-transparent",
    stepTitle:  "text-white",
    stepDesc:   "text-slate-400",
    stepBarBg:  "bg-slate-800",
    badgeDone:  "text-green-500 bg-green-500/5 border-green-500/20",
    badgeAct:   "text-primary bg-primary/5 border-primary/20",
    badgePend:  "text-slate-400 bg-slate-400/5 border-slate-400/20",
  } : {
    page:       "bg-background-light text-slate-900",
    header:     "border-border-light bg-white/90 backdrop-blur-md shadow-nav-light",
    logoText:   "text-slate-900",
    title:      "text-slate-900",
    sub:        "text-slate-500",
    trackBg:    "text-slate-200",
    tipWrap:    "text-slate-500",
    tipCard:    "bg-primary/8 border-primary/15",
    tipText:    "text-slate-700",
    errCard:    "bg-red-50 border-red-200",
    stepDone:   "bg-emerald-50 text-emerald-600 border-emerald-200",
    stepActive: "bg-primary/10 text-primary border-primary/25",
    stepPend:   "bg-slate-100 text-slate-400 border-slate-200",
    stepTitle:  "text-slate-900",
    stepDesc:   "text-slate-500",
    stepBarBg:  "bg-slate-200",
    badgeDone:  "text-emerald-600 bg-emerald-50 border-emerald-200",
    badgeAct:   "text-primary bg-primary/8 border-primary/20",
    badgePend:  "text-slate-400 bg-slate-100 border-slate-200",
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${tk.page}`}>

      {/* Header */}
      <header className={`flex items-center justify-between border-b px-6 md:px-10 py-4 ${tk.header}`}>
        <div className="flex items-center gap-3">
          <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg">
            <span className="material-symbols-outlined text-primary">rocket_launch</span>
          </div>
          <h2 className={`text-xl font-bold ${tk.logoText}`}>ResumeAI</h2>
        </div>
        <div className="hidden md:block text-right">
          <p className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>Analyzing...</p>
          <p className={`text-xs ${tk.sub}`}>Please don't close this window</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-4xl mx-auto w-full">

        {/* Title */}
        <div className="text-center mb-16">
          <h1 className={`text-5xl md:text-6xl font-serif mb-6 leading-tight ${tk.title}`}>
            Analyzing Your Resume...
          </h1>
          <p className={`text-xl max-w-xl mx-auto font-medium ${tk.sub}`}>
            Our AI is processing your experience to find the perfect job matches and career insights.
          </p>
        </div>

        {/* Circular gauge */}
        <div className="relative mb-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-[100px] scale-150 opacity-40" />
          <div className="relative size-56 md:size-72 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              <circle className={tk.trackBg} cx="50" cy="50" fill="transparent" r="45" stroke="currentColor" strokeWidth="5" />
              <circle cx="50" cy="50" fill="transparent" r="45" stroke="#6366f1"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 - (progress/100) * 2 * Math.PI * 45}`}
                strokeLinecap="round" strokeWidth="5"
                style={{ transition: "stroke-dashoffset 0.8s ease" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl md:text-6xl font-bold text-primary font-mono tracking-tight">{progress}%</span>
              <span className={`text-[10px] uppercase tracking-[0.2em] font-bold mt-2 ${tk.sub}`}>Analysis Progress</span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className={`w-full max-w-xl rounded-3xl p-8 md:p-10 ${isDark ? "glass-card shadow-2xl" : "bg-white border border-border-light shadow-card-light"}`}>
          <div className="space-y-8">
            {STEPS.map((step) => {
              const status = stepStatuses[step.key];
              return (
                <div key={step.key} className={`flex items-start gap-5 transition-opacity duration-500 ${status === STATUS.pending ? "opacity-40" : "opacity-100"}`}>
                  <div className={`mt-1 flex-shrink-0 size-7 rounded-full flex items-center justify-center border ${
                    status === STATUS.done ? tk.stepDone : status === STATUS.active ? tk.stepActive : tk.stepPend
                  }`}>
                    {status === STATUS.done
                      ? <span className="material-symbols-outlined text-[18px]">check</span>
                      : status === STATUS.active
                      ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                      : <span className="material-symbols-outlined text-[18px]">radio_button_unchecked</span>}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${tk.stepTitle}`}>{step.label}</h3>
                    <p className={`text-sm ${tk.stepDesc}`}>{step.desc}</p>
                    {status === STATUS.active && (
                      <div className={`mt-4 h-1.5 w-full rounded-full overflow-hidden ${tk.stepBarBg}`}>
                        <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase border ${
                    status === STATUS.done ? tk.badgeDone : status === STATUS.active ? tk.badgeAct : tk.badgePend
                  }`}>
                    {status === STATUS.done ? "Done" : status === STATUS.active ? "Active" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={`mt-8 border rounded-2xl p-5 max-w-md ${tk.errCard}`}>
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={() => navigate("/home")} className="mt-3 text-xs text-primary hover:underline">
              ← Go back and try again
            </button>
          </div>
        )}

        {/* Tip */}
        {!error && (
          <div className="mt-16 flex flex-col items-center gap-5">
            <div className={`flex items-center gap-2.5 text-sm font-medium ${tk.tipWrap}`}>
              <span className="material-symbols-outlined text-[20px] text-primary/60">info</span>
              <span>This usually takes less than 30 seconds. Please don't close the window.</span>
            </div>
            <div className={`border rounded-2xl p-5 max-w-md ${tk.tipCard}`}>
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary shrink-0">lightbulb</span>
                <p className={`text-sm leading-relaxed ${tk.tipText}`}>
                  <strong>Pro Tip:</strong> Resumes with tailored skill descriptions are 3x more likely
                  to pass initial ATS screening. Our matches are optimized for this.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
