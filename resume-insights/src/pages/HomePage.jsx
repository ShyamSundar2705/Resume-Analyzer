import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getUploadUrl, uploadToS3 } from "../api";

export default function HomePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const [file, setFile] = useState(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = (selected) => {
    if (!selected) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(selected.type)) { setError("Only PDF and DOCX files are supported."); return; }
    if (selected.size > 5 * 1024 * 1024) { setError("File must be under 5 MB."); return; }
    setError("");
    setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) { setError("Please upload a resume first."); return; }
    if (!jobTitle.trim()) { setError("Please enter a job title."); return; }
    setError("");

    // Navigate to processing page, pass state through router
    navigate("/processing", {
      state: { file, jobTitle, jobDescription },
    });
  };

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar activePage="home" />

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-24 w-full">

        {/* Hero */}
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-white/5 text-slate-400 text-[10px] font-mono mb-8 tracking-widest uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/60" />
            </span>
            Powered by GPT-4o AI Analyzer
          </div>
          <h1 className="font-serif text-5xl md:text-7xl mb-8 leading-[1.1] tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Analyze your resume <br className="hidden md:block" /> against any job in seconds.
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Get instant feedback and match scores using our advanced AI analyzer to optimize your job application strategy.
          </p>
        </section>

        {/* Upload Card */}
        <section className="glass-card-solid rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-3xl rounded-full -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-purple/5 blur-3xl rounded-full -ml-48 -mb-48" />

          <div className="relative z-10 flex flex-col gap-12">

            {/* Step 1 — Upload */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-2xl">Upload Resume</h3>
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Step 1 of 2</span>
              </div>
              <div
                className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-16 px-6 cursor-pointer transition-all ${dragging ? "border-primary/60 bg-primary/5" : "border-white/10 hover:border-primary/40 bg-white/[0.02]"
                  }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
                </div>
                {file ? (
                  <>
                    <p className="text-xl font-medium mb-1 text-primary">{file.name}</p>
                    <p className="text-slate-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-medium mb-1">Drop your resume here</p>
                    <p className="text-slate-500 text-sm">Supports PDF and DOCX files (Max 5MB)</p>
                  </>
                )}
                <button
                  type="button"
                  className="mt-8 px-8 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-all border border-white/5"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  Browse Files
                </button>
              </div>
            </div>

            {/* Step 2 — Job title + JD */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-2xl">
                  Job Title
                </h3>
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Step 2 of 2</span>
              </div>
              <input
                className="input-dark px-4 h-12 mb-4 text-base"
                placeholder="e.g. Senior Software Engineer, Data Analyst..."
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
              <label className="text-slate-500 text-sm mb-2 block">
                Job Description <span className="text-slate-600">(Optional)</span>
              </label>
              <textarea
                className="w-full min-h-[160px] bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-slate-200 placeholder:text-slate-600 focus:border-primary/40 focus:ring-0 transition-all resize-none text-base leading-relaxed outline-none"
                placeholder="Paste the job description here to see how you match (optional)"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* Analyze button */}
            <div className="pt-2">
              {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
              <button
                onClick={handleAnalyze}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group transition-all transform hover:-translate-y-0.5"
              >
                <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">auto_awesome</span>
                <span className="text-lg">Analyze Resume</span>
              </button>
              <p className="text-center text-slate-500 text-[10px] mt-6 font-mono tracking-widest uppercase">
                Average processing time: &lt; 8 seconds
              </p>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            { icon: "search_insights", color: "text-primary", title: "ATS Score", desc: "See exactly how ATS systems parse your resume and identify potential formatting issues." },
            { icon: "track_changes", color: "text-amber-500", title: "Keyword Gap", desc: "Identify missing keywords and skills that are crucial for the specific role you're targeting." },
            { icon: "auto_awesome_motion", color: "text-green-500", title: "AI Suggestions", desc: "Get bullet-point specific rewrite suggestions to make your achievements more impactful." },
          ].map((card) => (
            <div key={card.title} className="glass-card-solid p-8 rounded-2xl">
              <span className={`material-symbols-outlined text-3xl mb-6 block ${card.color}`}>{card.icon}</span>
              <h4 className="font-serif text-xl mb-3">{card.title}</h4>
              <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}