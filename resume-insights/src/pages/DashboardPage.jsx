import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { sendChatMessage, generateCoverLetter } from "../api";

// ── Sub-components ────────────────────────────────────────────

function ScoreGauge({ score }) {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const fill = circ - (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg className="w-44 h-44 transform -rotate-90">
        <circle cx="88" cy="88" fill="transparent" r={r} stroke="currentColor" className="text-white opacity-5" strokeWidth="12" />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5b4cf5" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle
          cx="88" cy="88" fill="transparent" r={r}
          stroke="url(#gaugeGrad)"
          strokeDasharray={circ}
          strokeDashoffset={fill}
          strokeLinecap="round" strokeWidth="12"
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <div className="flex items-baseline gap-0.5">
          <span className="text-5xl font-mono font-bold tracking-tight">{score}</span>
          <span className="text-sm font-mono text-slate-500">/100</span>
        </div>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Match Score</span>
      </div>
    </div>
  );
}

function SubScoreBar({ label, value }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
        <span className="text-sm font-mono font-bold text-primary">{value}%</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent-purple rounded-full transition-all duration-1000"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

const SEV_STYLES = {
  critical: "bg-red-950/40 text-red-400 border border-red-500/30",
  important: "bg-amber-950/40 text-amber-400 border border-amber-500/30",
  nice_to_have: "bg-purple-950/40 text-purple-400 border border-purple-500/30",
};
const DOT_COLORS = { Missing: "bg-red-500", "Partial Match": "bg-orange-500", "Weak Match": "bg-accent-purple" };

function GapRow({ skill, status, severity, recommendation }) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="px-6 py-5 font-semibold text-sm">{skill}</td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${DOT_COLORS[status] || "bg-slate-500"}`} />
          <span className="text-xs font-medium">{status}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest ${SEV_STYLES[severity] || SEV_STYLES.nice_to_have}`}>
          {severity.replace("_", " ")}
        </span>
      </td>
      <td className="px-6 py-5 text-right text-xs text-slate-500">{recommendation}</td>
    </tr>
  );
}

// ── Chat Panel ────────────────────────────────────────────────
function ChatPanel({ analysis }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I've analyzed your resume for **${analysis?.job_title || "this role"}**. You scored **${analysis?.match_score || 0}/100**. Ask me anything about your results, or say "write me a cover letter" to generate one!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const history = newMessages.slice(-8).map((m) => ({ role: m.role, content: m.content.replace(/\*\*/g, "") }));
      const data = await sendChatMessage(input, history.slice(0, -1), analysis);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, something went wrong: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCoverLetter = async () => {
    setInput("Write me a tailored cover letter for this role");
    await send();
  };

  const renderContent = (content) =>
    content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");

  return (
    <div className="bg-sidebar-dark border border-white/5 rounded-2xl flex flex-col h-full shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
          </div>
          <div>
            <h4 className="font-bold text-sm">Resume Assistant</h4>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Analysis Online</span>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-slate-400">more_vert</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-1.5 ${m.role === "user" ? "items-end ml-auto" : "items-start"} max-w-[90%]`}>
            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed ${m.role === "assistant"
                ? "bg-white/[0.07] border border-white/10 text-slate-200 chat-bubble-ai"
                : "bg-primary text-white shadow-lg shadow-primary/10 chat-bubble-user"
                }`}
              dangerouslySetInnerHTML={{ __html: renderContent(m.content) }}
            />
            <span className="text-[10px] text-slate-500 font-mono px-1">
              {m.role === "assistant" ? "Assistant" : "You"} · just now
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex flex-col items-start gap-1.5 max-w-[90%]">
            <div className="bg-white/[0.07] border border-white/10 p-4 rounded-2xl chat-bubble-ai">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-5 border-t border-white/5 bg-background-dark/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 focus-within:border-primary/50 transition-all">
          <input
            className="bg-transparent border-none focus:ring-0 text-sm flex-1 pl-3 text-slate-200 placeholder:text-slate-600 outline-none"
            placeholder="Ask about the resume..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-primary disabled:opacity-40 text-white w-9 h-9 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-all shadow-md shrink-0"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
          {[
            { icon: "edit_note", label: "Summarize", msg: "Summarize the key findings of this analysis" },
            { icon: "description", label: "Cover Letter", action: handleCoverLetter },
            { icon: "tips_and_updates", label: "Top Tips", msg: "What are the top 3 things I should improve on my resume?" },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => {
                if (btn.action) { btn.action(); }
                else { setInput(btn.msg); }
              }}
              className="text-[10px] font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-1.5 uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-[14px]">{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────
export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Use real API data from ProcessingPage, or fall back to demo data
  const analysis = location.state?.analysis || {
    job_title: "Senior Software Engineer",
    match_score: 85,
    sub_scores: { skills: 92, experience: 85, ats_score: 78 },
    extracted_skills: [
      { skill: "React", category: "hard_skill" },
      { skill: "Node.js", category: "hard_skill" },
      { skill: "TypeScript", category: "hard_skill" },
      { skill: "AWS", category: "hard_skill" },
      { skill: "System Design", category: "hard_skill" },
      { skill: "Leadership", category: "soft_skill" },
    ],
    skill_gaps: {
      critical: ["Kubernetes (K8s)"],
      important: ["PostgreSQL Architecture"],
      nice_to_have: ["Python Testing Frameworks"],
      present: ["React", "Node.js", "TypeScript"],
    },
    experience_years: 6,
  };

  const gapRows = [
    ...analysis.skill_gaps.critical.map((s) => ({ skill: s, status: "Missing", severity: "critical", recommendation: "Immediate training required" })),
    ...analysis.skill_gaps.important.map((s) => ({ skill: s, status: "Partial Match", severity: "important", recommendation: "Assess during deep-dive" })),
    ...analysis.skill_gaps.nice_to_have.map((s) => ({ skill: s, status: "Weak Match", severity: "nice_to_have", recommendation: "Mentorship candidate" })),
  ];

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar activePage="dashboard" />

      <main className="max-w-[1440px] mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-12 gap-10 items-start">

          {/* ── Left column (60%) ── */}
          <div className="col-span-12 lg:col-span-7 space-y-12">

            {/* Page header */}
            <div className="flex flex-col gap-1">
              <span className="section-eyebrow">Analysis Details</span>
              <h2 className="text-4xl font-serif tracking-tight mt-1">
                Analysis for{" "}
                <em className="not-italic text-primary font-serif italic">{analysis.job_title}</em> Role
              </h2>
              <p className="text-slate-400 text-sm">Detailed talent matching and gap assessment</p>
            </div>

            {/* Match Analysis */}
            <section className="glass-card rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">monitoring</span>
                  Match Analysis
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last updated: just now</span>
              </div>

              <div className="p-8 flex flex-col xl:flex-row items-center gap-12">
                <ScoreGauge score={analysis.match_score} />

                <div className="flex-1 space-y-6 w-full">
                  {/* Stat boxes */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Keywords", value: `${analysis.skill_gaps.present.length}/${analysis.skill_gaps.present.length + analysis.skill_gaps.critical.length}`, sub: "+2", subColor: "text-green-500 bg-green-500/10" },
                      { label: "Experience", value: `${analysis.experience_years} Yrs`, icon: "check_circle" },
                      { label: "ATS Score", value: `${analysis.sub_scores.ats_score}%`, sub: "Good", subColor: "text-primary bg-primary/10" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">{stat.label}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-mono font-bold">{stat.value}</span>
                          {stat.sub && <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${stat.subColor}`}>{stat.sub}</span>}
                          {stat.icon && <span className="material-symbols-outlined text-green-500 text-base">{stat.icon}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sub-score bars */}
                  <div className="space-y-4">
                    <SubScoreBar label="Skills Match" value={analysis.sub_scores.skills} />
                    <SubScoreBar label="Industry Experience" value={analysis.sub_scores.experience} />
                    <SubScoreBar label="ATS Compatibility" value={analysis.sub_scores.ats_score} />
                  </div>

                  {/* Insight */}
                  <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <span className="text-primary font-semibold">AI Insight:</span> Candidate shows strong alignment with core technical requirements.
                      Proficiency in <span className="text-accent-purple font-medium">React</span> and{" "}
                      <span className="text-accent-purple font-medium">System Design</span> exceeds expectations.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Skill Gap Table */}
            <section className="glass-card rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500">warning</span>
                  Skill Gap Analysis
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {gapRows.length} gap{gapRows.length !== 1 ? "s" : ""} identified
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Skill</th>
                      <th className="px-6 py-4">Match Status</th>
                      <th className="px-6 py-4">Severity</th>
                      <th className="px-6 py-4 text-right">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {gapRows.map((row, i) => <GapRow key={i} {...row} />)}
                    {gapRows.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No skill gaps detected 🎉</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Extracted skills */}
            <section className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Extracted Skills</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.extracted_skills.map((s) => (
                  <span
                    key={s.skill}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${s.category === "hard_skill"
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : s.category === "soft_skill"
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}
                  >
                    {s.skill}
                  </span>
                ))}
              </div>
            </section>

            <button
              onClick={() => navigate("/home")}
              className="text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Analyze another resume
            </button>
          </div>

          {/* ── Right column: Chat (40%) ── */}
          <aside className="col-span-12 lg:col-span-5 h-[calc(100vh-112px)] sticky top-24">
            <ChatPanel analysis={analysis} />
          </aside>
        </div>
      </main>
    </div>
  );
}