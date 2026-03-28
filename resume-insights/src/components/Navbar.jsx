import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar({ activePage = "" }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { isDark } = useTheme();

    const handleLogout = () => { logout(); navigate("/login"); };

    // ── Token map: every style decision in one place ──────────────
    const tk = isDark ? {
        header:       "bg-[#0d0d14]/85 border-white/5",
        logoText:     "text-slate-100",
        searchWrap:   "bg-white/5 border-transparent text-slate-200 placeholder:text-slate-600 focus:ring-primary/40 focus:bg-white/8",
        navBase:      "text-slate-400 hover:text-white",
        navActive:    "text-white",
        iconBtn:      "text-slate-400 hover:bg-white/8 hover:text-slate-200",
        divider:      "bg-white/10",
        avatarRing:   "border-white/10",
        arrow:        "text-slate-500",
        dropdown:     "bg-[#12121c] border-white/10",
        dropHdr:      "border-white/5",
        dropLabel:    "text-slate-500",
        dropName:     "text-slate-100",
        dropEmail:    "text-slate-500",
        dropItem:     "text-slate-300 hover:bg-white/5 hover:text-white",
        dropDivider:  "bg-white/5",
    } : {
        header:       "bg-white/90 border-border-light shadow-nav-light",
        logoText:     "text-slate-900",
        searchWrap:   "bg-surface-light-2 border-border-light text-slate-700 placeholder:text-slate-400 focus:ring-primary/20 focus:bg-white",
        navBase:      "text-slate-500 hover:text-slate-900",
        navActive:    "text-primary font-semibold",
        iconBtn:      "text-slate-400 hover:bg-surface-light-2 hover:text-slate-700",
        divider:      "bg-border-light",
        avatarRing:   "border-border-light",
        arrow:        "text-slate-400",
        dropdown:     "bg-white border-border-light shadow-card-light",
        dropHdr:      "border-slate-100",
        dropLabel:    "text-slate-400",
        dropName:     "text-slate-900",
        dropEmail:    "text-slate-400",
        dropItem:     "text-slate-600 hover:bg-surface-light-2 hover:text-slate-900",
        dropDivider:  "bg-slate-100",
    };

    const links = [
        { to: "/dashboard", label: "Dashboard", id: "dashboard" },
        { to: "/profile",   label: "Profile",   id: "profile"   },
        { to: "/settings",  label: "Settings",  id: "settings"  },
    ];

    return (
        <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-all duration-300 ${tk.header}`}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">

                {/* Logo */}
                <Link to="/home" className="flex items-center gap-3 shrink-0">
                    <div className="size-8 bg-primary flex items-center justify-center rounded-lg shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-white text-xl">analytics</span>
                    </div>
                    <h2 className={`text-xl font-bold tracking-tight ${tk.logoText}`}>Resume Insights</h2>
                </Link>

                {/* Search */}
                <div className="flex-1 max-w-2xl hidden md:block">
                    <div className="relative w-full">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input
                            className={`w-full border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all ${tk.searchWrap}`}
                            placeholder="Search resumes, candidates, or jobs..."
                        />
                    </div>
                </div>

                {/* Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {links.map(({ to, label, id }) => (
                        <Link key={id} to={to}
                            className={`text-sm font-medium transition-colors ${activePage === id ? tk.navActive : tk.navBase}`}>
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button className={`p-2 rounded-lg transition-colors ${tk.iconBtn}`}>
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                    </button>
                    <div className={`h-5 w-px mx-1 ${tk.divider}`} />

                    {/* Dropdown */}
                    <div className="relative group">
                        <button className={`flex items-center gap-1.5 p-1 rounded-full transition-colors ${tk.iconBtn}`}>
                            <div className={`h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent-purple border flex items-center justify-center ${tk.avatarRing}`}>
                                <span className="material-symbols-outlined text-white/80 text-lg">person</span>
                            </div>
                            <span className={`material-symbols-outlined text-sm ${tk.arrow}`}>keyboard_arrow_down</span>
                        </button>

                        <div className={`absolute right-0 top-full mt-2 w-56 border rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] py-2 translate-y-1 group-hover:translate-y-0 ${tk.dropdown}`}>
                            <div className={`px-4 py-3 border-b mb-1 ${tk.dropHdr}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${tk.dropLabel}`}>Signed in as</p>
                                <p className={`text-sm font-semibold truncate ${tk.dropName}`}>{user?.full_name || user?.email || "User"}</p>
                                <p className={`text-xs truncate ${tk.dropEmail}`}>{user?.email}</p>
                            </div>
                            {[
                                { to: "/profile",  icon: "account_circle", label: "Profile"  },
                                { to: "/settings", icon: "settings",        label: "Settings" },
                            ].map(({ to, icon, label }) => (
                                <Link key={to} to={to} className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${tk.dropItem}`}>
                                    <span className="material-symbols-outlined text-lg">{icon}</span>
                                    {label}
                                </Link>
                            ))}
                            <div className={`h-px my-1 mx-3 ${tk.dropDivider}`} />
                            <button onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-400/5 transition-colors">
                                <span className="material-symbols-outlined text-lg">logout</span>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
