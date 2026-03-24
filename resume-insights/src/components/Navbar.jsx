import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ activePage = "" }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="sticky top-0 z-50 border-b border-white/5 bg-background-dark/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">

                {/* Logo */}
                <Link to="/home" className="flex items-center gap-3 shrink-0">
                    <div className="size-8 bg-primary flex items-center justify-center rounded-lg shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-white text-xl">analytics</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Resume Insights</h2>
                </Link>

                {/* Search bar (dashboard only) */}
                <div className="flex-1 max-w-2xl hidden md:block">
                    <div className="relative w-full">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input
                            className="w-full bg-white/5 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                            placeholder="Search resumes, candidates, or jobs..."
                            type="text"
                        />
                    </div>
                </div>

                {/* Nav links */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link
                        to="/dashboard"
                        className={`nav-link ${activePage === "dashboard" ? "text-white" : ""}`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/profile"
                        className={`nav-link ${activePage === "profile" ? "text-white" : ""}`}
                    >
                        Profile
                    </Link>
                    <Link
                        to="/settings"
                        className={`nav-link ${activePage === "settings" ? "text-white" : ""}`}
                    >
                        Settings
                    </Link>
                </nav>

                {/* Right actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <div className="h-6 w-px bg-white/10 mx-1" />
                    {/* User avatar dropdown */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent-purple border border-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/70 text-xl">person</span>
                            </div>
                            <span className="material-symbols-outlined text-slate-400 text-sm">keyboard_arrow_down</span>
                        </button>
                        {/* Dropdown */}
                        <div className="absolute right-0 top-full mt-2 w-56 bg-sidebar-dark border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] py-2 translate-y-2 group-hover:translate-y-0">
                            <div className="px-4 py-3 border-b border-white/5 mb-1">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Signed in as</p>
                                <p className="text-sm font-semibold truncate">{user?.full_name || user?.email || "User"}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                            <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors">
                                <span className="material-symbols-outlined text-lg">account_circle</span>
                                <span>Profile</span>
                            </Link>
                            <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors">
                                <span className="material-symbols-outlined text-lg">settings</span>
                                <span>Settings</span>
                            </Link>
                            <div className="h-px bg-white/5 my-1 mx-2" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">logout</span>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}