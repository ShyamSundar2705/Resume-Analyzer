import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import { sendChatMessage } from "../api";

const SESSION_KEY = "lastAnalysis";
function saveAnalysis(data) { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (_) {} }
function loadAnalysis() { try { const r = sessionStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; } catch (_) { return null; } }

// ── ScoreGauge ────────────────────────────────────────────────
function ScoreGauge({ score, isDark }) {
  const r = 80, circ = 2 * Math.PI * r, fill = circ - (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg className="w-44 h-44 transform -rotate-90">
        <circle cx="88" cy="88" fill="transparent" r={r} stroke="currentColor"
          className={isDark ? "text-white opacity-5" : "text-slate-200"} strokeWidth="12" />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx="88" cy="88" fill="transparent" r={r} stroke="url(#gaugeGrad)"
          strokeDasharray={circ} strokeDashoffset={fill}
          strokeLinecap="round" strokeWidth="12"
          style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <div className="flex items-baseline gap-0.5">
          <span className={`text-5xl font-mono font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>{score}</span>
          <span className={`text-sm font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>/100</span>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Match Score</span>
      </div>
    </div>
  );
}

// ── SubScoreBar ───────────────────────────────────────────────
function SubScoreBar({ label, value, isDark }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
        <span className="text-sm font-mono font-bold text-primary">{value}%</span>
      </div>
      <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
        <div className="h-full bg-gradient-to-r from-primary to-accent-purple rounded-full transition-all duration-1000"
          style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ── GapRow ────────────────────────────────────────────────────
function GapRow({ skill, status, severity, recommendation, isDark }) {
  const SEV_STYLES_DARK = {
    critical:     "bg-red-950/40 text-red-400 border border-red-500/30",
    important:    "bg-amber-950/40 text-amber-400 border border-amber-500/30",
    nice_to_have: "bg-purple-950/40 text-purple-400 border border-purple-500/30",
  };
  const SEV_STYLES_LIGHT = {
    critical:     "bg-red-50 text-red-600 border border-red-200",
    important:    "bg-amber-50 text-amber-600 border border-amber-200",
    nice_to_have: "bg-violet-50 text-violet-600 border border-violet-200",
  };
  const DOT = { "Missing": "bg-red-500", "Partial Match": "bg-orange-500", "Weak Match": "bg-violet-500" };
  const sevStyles = isDark ? SEV_STYLES_DARK : SEV_STYLES_LIGHT;

  return (
    <tr className={`border-b transition-colors ${isDark ? "border-white/5 hover:bg-white/[0.02]" : "border-slate-100 hover:bg-slate-50"}`}>
      <td className={`px-6 py-5 font-semibold text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`}>{skill}</td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${DOT[status] || "bg-slate-400"}`} />
          <span className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>{status}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest ${sevStyles[severity] || sevStyles.nice_to_have}`}>
          {severity.replace("_", " ")}
        </span>
      </td>
      <td className={`px-6 py-5 text-right text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{recommendation}</td>
    </tr>
  );
}

// ── ChatPanel ─────────────────────────────────────────────────
function ChatPanel({ analysis, isDark }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: `Hi! I've analyzed your resume for **${analysis?.job_title || "this role"}**. You scored **${analysis?.match_score || 0}/100**. Ask me anything about your results, or say "write me a cover letter" to generate one!`,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (messageText) => {
    const text = messageText || input;
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const history = newMessages.slice(-8).map(m => ({ role: m.role, content: m.content.replace(/\*\*/g, "") }));
      const data = await sendChatMessage(text, history.slice(0, -1), analysis);
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Sorry, something went wrong: ${e.message}` }]);
    } finally { setLoading(false); }
  };

  const renderContent = (content) =>
    content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");

  // Panel tokens
  const p = isDark ? {
    panel:     "bg-[#12121c] border-white/5",
    hdrBorder: "border-white/5 bg-white/[0.02]",
    hdrTitle:  "text-slate-100",
    hdrSub:    "text-slate-500",
    moreBtn:   "hover:bg-white/5 text-slate-400",
    aiMsg:     "bg-white/[0.07] border border-white/10 text-slate-200",
    inputWrap: "bg-background-dark/80 border-white/5",
    inputBox:  "bg-white/5 border-white/10 focus-within:border-primary/50",
    inputText: "text-slate-200 placeholder:text-slate-600",
    quickBtn:  "text-slate-500 hover:text-primary",
  } : {
    panel:     "bg-white border-border-light shadow-card-light",
    hdrBorder: "border-slate-100 bg-slate-50/80",
    hdrTitle:  "text-slate-900",
    hdrSub:    "text-slate-400",
    moreBtn:   "hover:bg-slate-100 text-slate-400",
    aiMsg:     "bg-slate-50 border border-slate-200 text-slate-700",
    inputWrap: "bg-white border-slate-100",
    inputBox:  "bg-slate-50 border-slate-200 focus-within:border-primary/50",
    inputText: "text-slate-800 placeholder:text-slate-400",
    quickBtn:  "text-slate-400 hover:text-primary",
  };

  return (
    <div className={`border rounded-2xl flex flex-col h-full overflow-hidden ${p.panel}`}>
      {/* Header */}
      <div className={`p-5 border-b flex items-center justify-between ${p.hdrBorder}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
          </div>
          <div>
            <h4 className={`font-bold text-sm ${p.hdrTitle}`}>Resume Assistant</h4>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${p.hdrSub}`}>AI Analysis Online</span>
            </div>
          </div>
        </div>
        <button className={`p-2 rounded-lg transition-colors ${p.moreBtn}`}>
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-1.5 ${m.role === "user" ? "items-end ml-auto" : "items-start"} max-w-[90%]`}>
            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === "assistant" ? `${p.aiMsg} chat-bubble-ai` : "bg-primary text-white shadow-lg shadow-primary/20 chat-bubble-user"
              }`}
              dangerouslySetInnerHTML={{ __html: renderContent(m.content) }}
            />
            <span className={`text-[10px] font-mono px-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {m.role === "assistant" ? "Assistant" : "You"} · just now
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex flex-col items-start gap-1.5 max-w-[90%]">
            <div className={`p-4 rounded-2xl chat-bubble-ai ${p.aiMsg}`}>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`p-5 border-t backdrop-blur-sm ${p.inputWrap}`}>
        <div className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${p.inputBox}`}>
          <input
            className={`bg-transparent border-none focus:ring-0 text-sm flex-1 pl-3 outline-none ${p.inputText}`}
            placeholder="Ask about the resume..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            disabled={loading}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="bg-primary disabled:opacity-40 text-white w-9 h-9 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-all shadow-md shrink-0">
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
          {[
            { icon: "edit_note",        label: "Summarize",   msg: "Summarize the key findings of this analysis" },
            { icon: "description",      label: "Cover Letter",msg: `Write me a tailored cover letter for the ${analysis?.job_title} role` },
            { icon: "tips_and_updates", label: "Top Tips",    msg: "What are the top 3 things I should improve on my resume?" },
          ].map(btn => (
            <button key={btn.label} onClick={() => send(btn.msg)}
              className={`text-[10px] font-bold transition-colors flex items-center gap-1.5 uppercase tracking-widest ${p.quickBtn}`}>
              <span className="material-symbols-outlined text-[14px]">{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── DashboardPage ─────────────────────────────────────────────
export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const analysis = (() => {
    const fromState = location.state?.analysis;
    if (fromState) { saveAnalysis(fromState); return fromState; }
    return loadAnalysis();
  })();

  useEffect(() => { if (!analysis) navigate("/home", { replace: true }); }, []);
  if (!analysis) return null;

  const gapRows = [
    ...(analysis.skill_gaps?.critical     || []).map(s => ({ skill: s, status: "Missing",       severity: "critical",     recommendation: "Immediate training required" })),
    ...(analysis.skill_gaps?.important    || []).map(s => ({ skill: s, status: "Partial Match", severity: "important",    recommendation: "Assess during deep-dive" })),
    ...(analysis.skill_gaps?.nice_to_have || []).map(s => ({ skill: s, status: "Weak Match",    severity: "nice_to_have", recommendation: "Mentorship candidate" })),
  ];

  // ── Page tokens ───────────────────────────────────────────────
  const tk = isDark ? {
    page:         "bg-[#0d0d14]",
    eyebrow:      "text-accent-purple",
    titleBase:    "text-slate-100",
    sub:          "text-slate-400",
    card:         "glass-card",
    cardHdr:      "border-white/5",
    cardHdrTitle: "text-slate-100",
    cardHdrSub:   "text-slate-500",
    statBox:      "bg-white/5 border-white/5",
    statLabel:    "text-slate-500",
    statVal:      "text-slate-100",
    insightBox:   "bg-primary/5 border-primary/15",
    insightTxt:   "text-slate-300",
    tblHead:      "bg-white/5 text-slate-500",
    skillHard:    "bg-primary/10 border-primary/20 text-primary",
    skillSoft:    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    skillOther:   "bg-amber-500/10 border-amber-500/20 text-amber-400",
    skillsLabel:  "text-slate-400",
    backBtn:      "text-slate-500 hover:text-white",
  } : {
    page:         "bg-background-light",
    eyebrow:      "text-primary/70",
    titleBase:    "text-slate-900",
    sub:          "text-slate-500",
    card:         "bg-white border border-border-light shadow-card-light",
    cardHdr:      "border-slate-100",
    cardHdrTitle: "text-slate-900",
    cardHdrSub:   "text-slate-400",
    statBox:      "bg-surface-light-2 border-border-light",
    statLabel:    "text-slate-400",
    statVal:      "text-slate-900",
    insightBox:   "bg-primary/6 border-primary/15",
    insightTxt:   "text-slate-600",
    tblHead:      "bg-slate-50 text-slate-400",
    skillHard:    "bg-primary/10 border-primary/20 text-primary",
    skillSoft:    "bg-emerald-50 border-emerald-200 text-emerald-600",
    skillOther:   "bg-amber-50 border-amber-200 text-amber-600",
    skillsLabel:  "text-slate-500",
    backBtn:      "text-slate-400 hover:text-slate-900",
  };

  const insightMsg = analysis.match_score >= 75
    ? "Strong alignment with core requirements. Recommend proceeding to technical interview."
    : analysis.match_score >= 50
    ? "Moderate alignment. Address the critical skill gaps before applying."
    : "Significant gaps identified. Focus on the critical skills listed below before applying.";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${tk.page}`}>
      <Navbar activePage="dashboard" />

      <main className="max-w-[1440px] mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-12 gap-10 items-start">

          {/* ── Left (60%) ── */}
          <div className="col-span-12 lg:col-span-7 space-y-10">

            {/* Header */}
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${tk.eyebrow}`}>Analysis Details</span>
              <h2 className={`text-4xl font-serif tracking-tight mt-1 ${tk.titleBase}`}>
                Analysis for{" "}
                <em className="not-italic text-primary font-serif italic">{analysis.job_title}</em> Role
              </h2>
              <p className={`text-sm ${tk.sub}`}>Detailed talent matching and gap assessment</p>
            </div>

            {/* Match Analysis */}
            <section className={`rounded-xl overflow-hidden ${tk.card}`}>
              <div className={`p-5 border-b flex justify-between items-center ${tk.cardHdr}`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${tk.cardHdrTitle}`}>
                  <span className="material-symbols-outlined text-primary">monitoring</span>
                  Match Analysis
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${tk.cardHdrSub}`}>
                  Last updated: just now
                </span>
              </div>

              <div className="p-8 flex flex-col xl:flex-row items-center gap-12">
                <ScoreGauge score={analysis.match_score} isDark={isDark} />

                <div className="flex-1 space-y-6 w-full">
                  {/* Stat boxes */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Keywords", value: `${analysis.skill_gaps?.present?.length || 0}/${(analysis.skill_gaps?.present?.length || 0) + (analysis.skill_gaps?.critical?.length || 0)}` },
                      { label: "Experience", value: `${analysis.experience_years || 0} Yrs`, icon: "check_circle" },
                      { label: "ATS Score", value: `${analysis.sub_scores?.ats_score || 0}%`, sub: "Good", subColor: "text-primary bg-primary/10" },
                    ].map(stat => (
                      <div key={stat.label} className={`p-4 rounded-xl border ${tk.statBox}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${tk.statLabel}`}>{stat.label}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-mono font-bold ${tk.statVal}`}>{stat.value}</span>
                          {stat.sub && <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${stat.subColor}`}>{stat.sub}</span>}
                          {stat.icon && <span className="material-symbols-outlined text-green-500 text-base">{stat.icon}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bars */}
                  <div className="space-y-4">
                    <SubScoreBar label="Skills Match"        value={analysis.sub_scores?.skills || 0}     isDark={isDark} />
                    <SubScoreBar label="Industry Experience" value={analysis.sub_scores?.experience || 0} isDark={isDark} />
                    <SubScoreBar label="ATS Compatibility"   value={analysis.sub_scores?.ats_score || 0}  isDark={isDark} />
                  </div>

                  {/* Insight */}
                  <div className={`border rounded-xl p-4 ${tk.insightBox}`}>
                    <p className={`text-sm leading-relaxed ${tk.insightTxt}`}>
                      <span className="text-primary font-semibold">AI Insight: </span>
                      {insightMsg}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Skill Gap Table */}
            <section className={`rounded-xl overflow-hidden ${tk.card}`}>
              <div className={`p-5 border-b flex justify-between items-center ${tk.cardHdr}`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${tk.cardHdrTitle}`}>
                  <span className="material-symbols-outlined text-orange-500">warning</span>
                  Skill Gap Analysis
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${tk.cardHdrSub}`}>
                  {gapRows.length} gap{gapRows.length !== 1 ? "s" : ""} identified
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className={`text-[10px] font-bold uppercase tracking-widest ${tk.tblHead}`}>
                    <tr>
                      <th className="px-6 py-4">Skill</th>
                      <th className="px-6 py-4">Match Status</th>
                      <th className="px-6 py-4">Severity</th>
                      <th className="px-6 py-4 text-right">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gapRows.map((row, i) => <GapRow key={i} {...row} isDark={isDark} />)}
                    {gapRows.length === 0 && (
                      <tr>
                        <td colSpan={4} className={`px-6 py-8 text-center ${tk.sub}`}>
                          No skill gaps detected 🎉
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Extracted Skills */}
            <section className={`rounded-xl p-6 ${tk.card}`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${tk.skillsLabel}`}>
                Extracted Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {(analysis.extracted_skills || []).map(s => (
                  <span key={s.skill} className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${
                    s.category === "hard_skill" ? tk.skillHard
                    : s.category === "soft_skill" ? tk.skillSoft
                    : tk.skillOther
                  }`}>
                    {s.skill}
                  </span>
                ))}
                {(!analysis.extracted_skills || analysis.extracted_skills.length === 0) && (
                  <span className={`text-sm ${tk.sub}`}>No skills extracted</span>
                )}
              </div>
            </section>

            <button onClick={() => navigate("/home")}
              className={`text-sm transition-colors flex items-center gap-2 ${tk.backBtn}`}>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Analyze another resume
            </button>
          </div>

          {/* ── Right: Chat ── */}
          <aside className="col-span-12 lg:col-span-5 h-[calc(100vh-112px)] sticky top-24">
            <ChatPanel analysis={analysis} isDark={isDark} />
          </aside>
        </div>
      </main>
    </div>
  );
}
