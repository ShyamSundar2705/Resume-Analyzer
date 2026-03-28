import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getResumeHistory, getUserProfile, getDownloadUrl } from "../api";

const FILE_ICON = {
  pdf:  { icon: "picture_as_pdf", color: "bg-red-500/10 text-red-400" },
  docx: { icon: "description",    color: "bg-blue-500/10 text-blue-400" },
  doc:  { icon: "description",    color: "bg-blue-500/10 text-blue-400" },
};

function getFileIcon(filename = "") {
  const ext = filename.split(".").pop()?.toLowerCase();
  return FILE_ICON[ext] || { icon: "insert_drive_file", color: "bg-slate-500/10 text-slate-400" };
}
function getFileType(filename = "") {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "PDF Document";
  if (ext === "docx" || ext === "doc") return "Word Document";
  return "Document";
}
function formatDate(dateStr) {
  if (!dateStr) return "—";
  try { return new Date(dateStr).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return dateStr; }
}

export default function ProfilePage() {
  const navigate  = useNavigate();
  const { token } = useAuth();
  const { isDark } = useTheme();

  const [profile, setProfile]   = useState(null);
  const [resumes, setResumes]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [showAll, setShowAll]   = useState(false);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        if (!token) { setLoading(false); return; }
        const [profileData, historyData] = await Promise.all([
          getUserProfile(token).catch(() => null),
          getResumeHistory(token).catch(() => []),
        ]);
        setProfile(profileData);
        const uniqueResumes = Array.isArray(historyData)
          ? historyData.reduce((acc, r) => {
              const key = r.analysis_id || r.name;
              if (!acc.find(x => (x.analysis_id || x.name) === key)) acc.push(r);
              return acc;
            }, [])
          : [];
        setResumes(uniqueResumes);
      } catch { setError("Could not load profile data."); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [token]);

  const handleDownload = async (resume) => {
    if (!resume.file_key) { alert(`Cannot download: file_key missing for ${resume.name}.`); return; }
    try {
      setDownloading(resume.file_key);
      const { download_url } = await getDownloadUrl(resume.file_key);
      if (!download_url) throw new Error("No download_url in response");
      window.open(download_url, "_blank");
    } catch (err) { alert("Failed to download: " + err.message); }
    finally { setDownloading(null); }
  };

  const displayName   = profile?.name || profile?.full_name || "User";
  const displayTitle  = profile?.title || "Professional";
  const displayEmail  = profile?.email || "";
  const displaySkills = profile?.skills || [];
  const initials      = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const totalInsights = resumes.filter(r => r.status === "analyzed").length;
  const filteredResumes = resumes
    .filter(r => r.name?.toLowerCase().includes(search.toLowerCase()))
    .slice(0, showAll ? undefined : 5);

  // ── Tokens ──────────────────────────────────────────────────────
  const tk = isDark ? {
    page:        "bg-[#0d0d14]",
    name:        "text-slate-100",
    titleTxt:    "text-slate-400",
    email:       "text-slate-500",
    editBtn:     "bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200",
    shareBtn:    "bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300",
    statDivider: "border-white/5",
    statLabel:   "text-slate-500",
    statVal:     "text-slate-100",
    sectionHdr:  "text-slate-500",
    editRing:    "ring-[#0d0d14]",
    skillOther:  "bg-white/5 border-white/10 text-slate-400",
    skillNone:   "text-slate-600",
    divider:     "border-white/5",
    search:      "bg-white/5 border-white/10 text-slate-300 placeholder:text-slate-600 focus:ring-primary/50",
    histTitle:   "text-slate-100",
    histSub:     "text-slate-500",
    tableWrap:   "glass-card",
    tableHdr:    "border-white/5 bg-white/[0.01] text-slate-500",
    tableRow:    "hover:bg-white/[0.02] divide-white/5",
    tableBorder: "divide-white/5",
    fileName:    "text-slate-100 group-hover:text-primary",
    fileType:    "text-slate-500",
    dateVal:     "text-slate-400",
    statusStyle: { analyzed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", pending: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    optionBtn:   "text-slate-400 hover:text-primary",
    showMore:    "text-slate-500 hover:text-primary bg-white/[0.01] border-white/5",
  } : {
    page:        "bg-background-light",
    name:        "text-slate-900",
    titleTxt:    "text-slate-500",
    email:       "text-slate-400",
    editBtn:     "bg-white hover:bg-surface-light-2 border border-border-light text-slate-700 shadow-sm",
    shareBtn:    "bg-white hover:bg-surface-light-2 border border-border-light text-slate-500 shadow-sm",
    statDivider: "border-slate-100",
    statLabel:   "text-slate-400",
    statVal:     "text-slate-900",
    sectionHdr:  "text-slate-400",
    editRing:    "ring-background-light",
    skillOther:  "bg-white border-border-light text-slate-600 shadow-sm",
    skillNone:   "text-slate-400",
    divider:     "border-slate-100",
    search:      "bg-white border-border-light text-slate-700 placeholder:text-slate-400 focus:ring-primary/30 shadow-sm",
    histTitle:   "text-slate-900",
    histSub:     "text-slate-500",
    tableWrap:   "bg-white border border-border-light shadow-card-light",
    tableHdr:    "border-slate-100 bg-slate-50 text-slate-400",
    tableRow:    "hover:bg-slate-50/80",
    tableBorder: "divide-slate-100",
    fileName:    "text-slate-800 group-hover:text-primary",
    fileType:    "text-slate-400",
    dateVal:     "text-slate-500",
    statusStyle: { analyzed: "bg-emerald-50 text-emerald-600 border-emerald-200", pending: "bg-amber-50 text-amber-600 border-amber-200" },
    optionBtn:   "text-slate-400 hover:text-primary",
    showMore:    "text-slate-400 hover:text-primary bg-slate-50 border-slate-100",
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${tk.page}`}>
        <Navbar activePage="profile" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${tk.page}`}>
      <Navbar activePage="profile" />

      <main className="px-6 py-12 lg:px-12 max-w-7xl mx-auto w-full">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Left */}
          <div className="lg:col-span-4 space-y-12">
            <section className="flex flex-col items-center text-center lg:items-start lg:text-left">

              {/* Avatar */}
              <div className="relative mb-6">
                <div className={`size-36 rounded-full border-2 p-1.5 bg-gradient-to-b from-white/10 to-transparent ${isDark ? "border-white/5" : "border-border-light"}`}>
                  <div className="size-full rounded-full bg-gradient-to-tr from-primary to-accent-purple flex items-center justify-center text-white text-4xl font-serif shadow-2xl">
                    {initials || "?"}
                  </div>
                </div>
                <button onClick={() => navigate("/settings")}
                  className={`absolute bottom-2 right-2 bg-primary p-2 rounded-full text-white shadow-xl hover:scale-110 transition-transform ring-4 ${tk.editRing}`}>
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </div>

              {/* Info */}
              <div>
                <h1 className={`font-serif text-4xl ${tk.name}`}>{displayName}</h1>
                <p className={`font-medium mt-1 ${tk.titleTxt}`}>{displayTitle}</p>
                <p className={`text-sm mt-0.5 ${tk.email}`}>{displayEmail}</p>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-wrap gap-3 w-full">
                <button onClick={() => navigate("/settings")}
                  className={`flex-1 flex items-center justify-center gap-2 font-medium px-4 py-2.5 rounded-lg transition-all text-sm ${tk.editBtn}`}>
                  <span className="material-symbols-outlined text-base">settings</span>
                  Edit Profile
                </button>
                <button className={`flex items-center justify-center p-2.5 rounded-lg transition-all ${tk.shareBtn}`} title="Share">
                  <span className="material-symbols-outlined text-base">share</span>
                </button>
              </div>

              {/* Stats */}
              <div className={`w-full grid grid-cols-2 gap-8 mt-12 pt-8 border-t ${tk.statDivider}`}>
                {[{ label: "Resumes", val: resumes.length }, { label: "Analyzed", val: totalInsights }].map(s => (
                  <div key={s.label}>
                    <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${tk.statLabel}`}>{s.label}</p>
                    <p className={`font-serif text-3xl ${tk.statVal}`}>{s.val}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-[11px] font-bold uppercase tracking-[0.2em] ${tk.sectionHdr}`}>Key Expertise</h3>
                <button onClick={() => navigate("/settings")} className={`hover:text-primary transition-colors ${tk.sectionHdr}`}>
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {displaySkills.length > 0 ? displaySkills.map((skill, i) => (
                  <span key={skill} className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${
                    i === 0 ? "bg-primary/10 border-primary/20 text-primary" : tk.skillOther
                  }`}>
                    {skill.toUpperCase()}
                  </span>
                )) : (
                  <p className={`text-xs ${tk.skillNone}`}>
                    No skills added yet.{" "}
                    <button onClick={() => navigate("/settings")} className="text-primary hover:underline">Add skills in Settings</button>
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Right */}
          <div className={`lg:col-span-8 space-y-12 lg:border-l lg:pl-16 ${tk.statDivider}`}>
            <section>
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <h3 className={`font-serif text-3xl ${tk.histTitle}`}>Resume History</h3>
                  <p className={`text-sm mt-1 ${tk.histSub}`}>Manage and track your analyzed documents</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                    <input
                      className={`border rounded-full pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 transition-all w-40 sm:w-56 ${tk.search}`}
                      placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <button onClick={() => navigate("/home")}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Upload
                  </button>
                </div>
              </div>

              {resumes.length === 0 ? (
                <div className={`rounded-2xl p-12 flex flex-col items-center gap-4 text-center ${isDark ? "glass-card" : "bg-white border border-border-light shadow-card-light"}`}>
                  <span className="material-symbols-outlined text-slate-400 text-5xl">upload_file</span>
                  <p className={`font-medium ${tk.histTitle}`}>No resumes analyzed yet</p>
                  <p className={tk.histSub}>Upload and analyze your first resume to see it here</p>
                  <button onClick={() => navigate("/home")}
                    className="mt-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all">
                    Analyze a Resume
                  </button>
                </div>
              ) : (
                <div className={`rounded-2xl overflow-hidden ${tk.tableWrap}`}>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[600px] text-left">
                      <thead>
                        <tr className={`border-b text-[10px] uppercase tracking-[0.15em] font-bold ${tk.tableHdr}`}>
                          <th className="px-8 py-5 whitespace-nowrap">File Details</th>
                          <th className="px-6 py-5 whitespace-nowrap">Analysis Date</th>
                          <th className="px-6 py-5 whitespace-nowrap">Status</th>
                          <th className="px-8 py-5 text-right whitespace-nowrap">Options</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${tk.tableBorder}`}>
                        {filteredResumes.map((resume, idx) => {
                          const { icon, color } = getFileIcon(resume.name);
                          return (
                            <tr key={resume.analysis_id || idx} className={`group transition-colors ${tk.tableRow}`}>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className={`p-2.5 rounded-lg flex-shrink-0 ${color}`}>
                                    <span className="material-symbols-outlined text-xl">{icon}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <span className={`text-[15px] font-semibold block transition-colors tracking-tight truncate max-w-[180px] ${tk.fileName}`}>
                                      {resume.name || "resume"}
                                    </span>
                                    <span className={`text-[11px] uppercase tracking-wider ${tk.fileType}`}>
                                      {getFileType(resume.name)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                <span className={`text-sm ${tk.dateVal}`}>{formatDate(resume.date || resume.created_at)}</span>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${tk.statusStyle[resume.status] || tk.statusStyle.analyzed}`}>
                                  {resume.status || "analyzed"}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => handleDownload(resume)}
                                    disabled={downloading === resume.file_key}
                                    className={`p-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${tk.optionBtn}`}
                                    title="Download">
                                    <span className="material-symbols-outlined text-xl">
                                      {downloading === resume.file_key ? "downloading" : "download"}
                                    </span>
                                  </button>
                                  <button onClick={() => navigate("/dashboard")}
                                    className={`p-2 transition-all ${tk.optionBtn}`} title="View Insights">
                                    <span className="material-symbols-outlined text-xl">bar_chart</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {resumes.length > 5 && (
                    <div className={`p-5 border-t flex justify-center ${tk.showMore}`}>
                      <button onClick={() => setShowAll(!showAll)}
                        className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-colors hover:text-primary">
                        <span>{showAll ? "Show Less" : `See All ${resumes.length} Resumes`}</span>
                        <span className="material-symbols-outlined text-sm">{showAll ? "expand_less" : "expand_more"}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
