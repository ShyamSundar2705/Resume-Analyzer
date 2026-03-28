import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup, login } from "../auth";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const SYNTAX_CHARS = [
    { char: "{ }", top: "10%", left: "5%",  size: 20, dur: "18.5s", delay: "1.2s" },
    { char: "< >", top: "15%", left: "85%", size: 14, dur: "14.2s", delay: "5.8s" },
    { char: "[ ]", top: "25%", left: "15%", size: 28, dur: "21.1s", delay: "0.5s" },
    { char: "( )", top: "35%", left: "75%", size: 20, dur: "16.7s", delay: "7.3s" },
    { char: "=>",  top: "45%", left: "5%",  size: 14, dur: "19.4s", delay: "2.1s" },
    { char: "/>",  top: "55%", left: "90%", size: 28, dur: "12.8s", delay: "4.6s" },
    { char: "::",  top: "65%", left: "10%", size: 20, dur: "20.2s", delay: "6.9s" },
    { char: "{ }", top: "75%", left: "80%", size: 14, dur: "15.6s", delay: "1.8s" },
    { char: "< >", top: "85%", left: "20%", size: 28, dur: "18.9s", delay: "3.2s" },
    { char: "[ ]", top: "5%",  left: "50%", size: 20, dur: "13.5s", delay: "7.9s" },
    { char: "( )", top: "90%", left: "50%", size: 14, dur: "21.8s", delay: "0.1s" },
    { char: "=>",  top: "40%", left: "40%", size: 28, dur: "17.3s", delay: "5.2s" },
    { char: "/>",  top: "20%", left: "30%", size: 20, dur: "14.7s", delay: "2.8s" },
    { char: "::",  top: "70%", left: "60%", size: 14, dur: "19.9s", delay: "6.4s" },
    { char: "{ }", top: "12%", left: "65%", size: 28, dur: "16.1s", delay: "1.1s" },
    { char: "< >", top: "50%", left: "25%", size: 20, dur: "20.6s", delay: "4.3s" },
    { char: "[ ]", top: "80%", left: "40%", size: 14, dur: "12.4s", delay: "7.7s" },
    { char: "( )", top: "30%", left: "95%", size: 28, dur: "15.3s", delay: "3.6s" },
    { char: "=>",  top: "60%", left: "70%", size: 20, dur: "18.2s", delay: "0.9s" },
    { char: "/>",  top: "95%", left: "85%", size: 14, dur: "21.5s", delay: "5.5s" },
];

export default function LoginPage() {
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();
    const { isDark } = useTheme();

    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");
    const [isSignup, setIsSignup] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!email || !password) { setError("Email and password are required."); return; }
        if (isSignup && !fullName) { setError("Full name is required for signup."); return; }
        setLoading(true);
        try {
            const result = isSignup
                ? await signup(email, password, fullName)
                : await login(email, password);
            authLogin(result.user, result.token);
            navigate("/home");
        } catch (err) {
            setError(err.message || "Authentication failed. Please try again.");
        } finally { setLoading(false); }
    };

    // ── Floating symbol style: light mode = indigo tint, clearly visible ──
    const syntaxStyle = isDark
        ? { color: "rgba(139,92,246,0.22)", opacity: 1 }   // purple, subtle
        : { color: "rgba(99,102,241,0.28)", opacity: 1 };  // indigo, more visible on light bg

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${
            isDark ? "bg-[#0d0d14]" : "bg-background-light"
        }`}>

            {/* Floating syntax chars */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {SYNTAX_CHARS.map((s, i) => (
                    <span key={i} className="code-syntax" style={{
                        top: s.top, left: s.left, fontSize: s.size,
                        animationDuration: s.dur, animationDelay: s.delay,
                        ...syntaxStyle,
                    }}>
                        {s.char}
                    </span>
                ))}
            </div>

            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] blur-[120px] rounded-full ${
                    isDark ? "bg-primary/25 opacity-100" : "bg-primary/15 opacity-100"
                }`} />
                <div className={`absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] blur-[120px] rounded-full ${
                    isDark ? "bg-violet-500/15 opacity-100" : "bg-violet-400/10 opacity-100"
                }`} />
            </div>

            <div className="w-full max-w-[420px] flex flex-col gap-8 relative z-10">

                {/* Logo */}
                <div className="flex flex-col items-center gap-3">
                    <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <span className="material-symbols-outlined text-3xl">description</span>
                    </div>
                    <h1 className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                        Resume Insights
                    </h1>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {isSignup ? "Create your account to get started." : "Welcome back! Sign in to continue."}
                    </p>
                </div>

                {/* Card */}
                <div className={`border p-8 rounded-2xl ${
                    isDark
                        ? "bg-[#12121c] border-white/8 shadow-2xl"
                        : "bg-white border-border-light shadow-card-light"
                }`}>
                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>

                        {isSignup && (
                            <label className="flex flex-col gap-1.5">
                                <span className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Full Name</span>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person</span>
                                    <input className="input-dark pl-10 pr-4 h-11" type="text"
                                        placeholder="Alex Johnson" value={fullName}
                                        onChange={e => setFullName(e.target.value)} />
                                </div>
                            </label>
                        )}

                        <label className="flex flex-col gap-1.5">
                            <span className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Email</span>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                                <input className="input-dark pl-10 pr-4 h-11" type="email"
                                    placeholder="name@company.com" value={email}
                                    onChange={e => setEmail(e.target.value)} disabled={loading} />
                            </div>
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                                <span className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Password</span>
                                {!isSignup && (
                                    <button type="button" className="text-primary text-xs font-semibold hover:underline">
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                                <input className="input-dark pl-10 pr-4 h-11" type="password"
                                    placeholder="••••••••" value={password}
                                    onChange={e => setPassword(e.target.value)} disabled={loading} />
                            </div>
                            {isSignup && (
                                <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                    Min. 8 characters, 1 uppercase, 1 number
                                </p>
                            )}
                        </label>

                        {!isSignup && (
                            <div className="flex items-center gap-2">
                                <input id="remember" type="checkbox"
                                    className="size-4 rounded border-slate-300 text-primary focus:ring-primary/30 accent-primary" />
                                <label htmlFor="remember" className={`text-sm cursor-pointer ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    Remember for 30 days
                                </label>
                            </div>
                        )}

                        {error && (
                            <p className="text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                {error}
                            </p>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold rounded-lg transition-all text-sm"
                            style={{ boxShadow: "0 1px 2px rgba(99,102,241,0.4), 0 4px 16px rgba(99,102,241,0.25)" }}>
                            {loading
                                ? (isSignup ? "Creating account..." : "Signing in...")
                                : (isSignup ? "Create account" : "Sign in")}
                        </button>
                    </form>
                </div>

                <p className={`text-center text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {isSignup ? "Already have an account? " : "Don't have an account? "}
                    <button onClick={() => { setIsSignup(!isSignup); setError(""); }}
                        className="text-primary font-semibold hover:underline">
                        {isSignup ? "Sign in" : "Sign up"}
                    </button>
                </p>
            </div>
        </div>
    );
}
