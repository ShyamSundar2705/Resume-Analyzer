import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const DEMO_RESUMES = [
  { name: "Senior_SWE_Resume.pdf", type: "PDF Document", icon: "picture_as_pdf", iconColor: "bg-red-500/10 text-red-400", date: "May 12, 2026", status: "analyzed" },
  { name: "Product_Designer_v2.pdf", type: "PDF Document", icon: "picture_as_pdf", iconColor: "bg-red-500/10 text-red-400", date: "April 20, 2026", status: "analyzed" },
  { name: "Junior_Dev_Role.docx", type: "Word Document", icon: "description", iconColor: "bg-blue-500/10 text-blue-400", date: "March 15, 2026", status: "pending" },
];

const STATUS_STYLES = {
  analyzed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = DEMO_RESUMES.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar activePage="profile" />

      <main className="flex-1 px-6 py-12 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* ── Left: Profile card ── */}
          <div className="lg:col-span-4 space-y-12">
            <section className="flex flex-col items-center text-center lg:items-start lg:text-left">

              {/* Avatar */}
              <div className="relative mb-6">
                <div className="size-36 rounded-full border-2 border-white/5 p-1.5 bg-gradient-to-b from-white/10 to-transparent">
                  <div className="size-full rounded-full bg-gradient-to-tr from-primary to-accent-purple flex items-center justify-center text-white text-4xl font-serif shadow-2xl">
                    AJ
                  </div>
                </div>
                <button className="absolute bottom-2 right-2 bg-primary p-2 rounded-full text-white shadow-xl hover:scale-110 transition-transform ring-4 ring-background-dark">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </div>

              {/* Info */}
              <div>
                <h1 className="font-serif text-4xl text-slate-100">Alex Johnson</h1>
                <p className="text-slate-400 font-medium mt-1">Senior Full Stack Engineer</p>
                <p className="text-slate-500 text-sm mt-0.5">alex.j@example.com</p>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-wrap gap-3 w-full">
                <button
                  onClick={() => navigate("/settings")}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium px-4 py-2.5 rounded-lg transition-all text-sm"
                >
                  <span className="material-symbols-outlined text-base">settings</span>
                  <span>Edit Profile</span>
                </button>
                <button className="flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 p-2.5 rounded-lg transition-all" title="Share">
                  <span className="material-symbols-outlined text-base">share</span>
                </button>
              </div>

              {/* Stats */}
              <div className="w-full grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-white/5">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Resumes</p>
                  <p className="font-serif text-3xl text-slate-100">{DEMO_RESUMES.length}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Total Insights</p>
                  <p className="font-serif text-3xl text-slate-100">48</p>
                </div>
              </div>
            </section>

            {/* Skills */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Key Expertise</h3>
                <button className="text-slate-500 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["REACT", "NODE.JS", "SYSTEM DESIGN", "TYPESCRIPT", "AWS", "TAILWIND", "KUBERNETES"].map((skill, i) => (
                  <span
                    key={skill}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${i === 0
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-white/5 border-white/10 text-slate-400"
                      }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* ── Right: Resume history ── */}
          <div className="lg:col-span-8 space-y-12 lg:border-l lg:border-white/5 lg:pl-16">
            <section>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <h3 className="font-serif text-3xl text-slate-100">Resume History</h3>
                  <p className="text-slate-500 text-sm mt-1">Manage and track your analyzed documents</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                    <input
                      className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all w-40 sm:w-56 placeholder:text-slate-600"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => navigate("/home")}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Upload
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-slate-500 text-[10px] uppercase tracking-[0.15em] font-bold">
                      <th className="px-8 py-5">File Details</th>
                      <th className="px-6 py-5">Analysis Date</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-8 py-5 text-right">Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((resume) => (
                      <tr key={resume.name} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-lg ${resume.iconColor}`}>
                              <span className="material-symbols-outlined text-xl">{resume.icon}</span>
                            </div>
                            <div>
                              <span className="text-[15px] font-semibold text-slate-100 block group-hover:text-primary transition-colors tracking-tight">
                                {resume.name}
                              </span>
                              <span className="text-[11px] text-slate-500 uppercase tracking-wider">{resume.type}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-sm text-slate-400">{resume.date}</span>
                        </td>
                        <td className="px-6 py-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${STATUS_STYLES[resume.status]}`}>
                            {resume.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate("/dashboard")}
                              className="p-2 text-slate-400 hover:text-primary transition-all"
                              title="View Insights"
                            >
                              <span className="material-symbols-outlined text-xl">bar_chart</span>
                            </button>
                            <button className="p-2 text-slate-400 hover:text-white transition-all" title="Download">
                              <span className="material-symbols-outlined text-xl">download</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-500">No resumes found.</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="p-5 bg-white/[0.01] border-t border-white/5 flex justify-center">
                  <button className="text-[10px] font-bold text-slate-500 hover:text-primary uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
                    <span>See Full History</span>
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}