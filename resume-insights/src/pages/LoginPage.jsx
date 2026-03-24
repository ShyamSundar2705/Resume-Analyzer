import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup, login } from "../auth";
import { useAuth } from "../context/AuthContext";

const SYNTAX_CHARS = [
    { char: "{ }", top: "10%", left: "5%", size: 20, dur: "18.5s", delay: "1.2s" },
    { char: "< >", top: "15%", left: "85%", size: 14, dur: "14.2s", delay: "5.8s" },
    { char: "[ ]", top: "25%", left: "15%", size: 28, dur: "21.1s", delay: "0.5s" },
    { char: "( )", top: "35%", left: "75%", size: 20, dur: "16.7s", delay: "7.3s" },
    { char: "=>", top: "45%", left: "5%", size: 14, dur: "19.4s", delay: "2.1s" },
    { char: "/>", top: "55%", left: "90%", size: 28, dur: "12.8s", delay: "4.6s" },
    { char: "::", top: "65%", left: "10%", size: 20, dur: "20.2s", delay: "6.9s" },
    { char: "{ }", top: "75%", left: "80%", size: 14, dur: "15.6s", delay: "1.8s" },
    { char: "< >", top: "85%", left: "20%", size: 28, dur: "18.9s", delay: "3.2s" },
    { char: "[ ]", top: "5%", left: "50%", size: 20, dur: "13.5s", delay: "7.9s" },
    { char: "( )", top: "90%", left: "50%", size: 14, dur: "21.8s", delay: "0.1s" },
    { char: "=>", top: "40%", left: "40%", size: 28, dur: "17.3s", delay: "5.2s" },
    { char: "/>", top: "20%", left: "30%", size: 20, dur: "14.7s", delay: "2.8s" },
    { char: "::", top: "70%", left: "60%", size: 14, dur: "19.9s", delay: "6.4s" },
    { char: "{ }", top: "12%", left: "65%", size: 28, dur: "16.1s", delay: "1.1s" },
    { char: "< >", top: "50%", left: "25%", size: 20, dur: "20.6s", delay: "4.3s" },
    { char: "[ ]", top: "80%", left: "40%", size: 14, dur: "12.4s", delay: "7.7s" },
    { char: "( )", top: "30%", left: "95%", size: 28, dur: "15.3s", delay: "3.6s" },
    { char: "=>", top: "60%", left: "70%", size: 20, dur: "18.2s", delay: "0.9s" },
    { char: "/>", top: "95%", left: "85%", size: 14, dur: "21.5s", delay: "5.5s" },
];

export default function LoginPage() {
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSignup, setIsSignup] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!email || !password) {
            setError("Email and password are required.");
            return;
        }

        if (isSignup && !fullName) {
            setError("Full name is required for signup.");
            return;
        }

        setLoading(true);

        try {
            if (isSignup) {
                // Sign up
                const result = await signup(email, password, fullName);
                authLogin(result.user, result.token);
                navigate("/home");
            } else {
                // Log in
                const result = await login(email, password);
                authLogin(result.user, result.token);
                navigate("/home");
            }
        } catch (err) {
            setError(err.message || "Authentication failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-4 relative overflow-hidden">

            {/* Animated syntax background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {SYNTAX_CHARS.map((s, i) => (
                    <span
                        key={i}
                        className="code-syntax"
                        style={{
                            top: s.top,
                            left: s.left,
                            fontSize: s.size,
                            animationDuration: s.dur,
                            animationDelay: s.delay,
                        }}
                    >
                        {s.char}
                    </span>
                ))}
            </div>

            {/* Ambient glows */}
            <div className="fixed inset-0 pointer-events-none opacity-20 -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/30 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
            </div>

            {/* Login card */}
            <div className="w-full max-w-[420px] flex flex-col gap-8 relative z-10">

                {/* Logo */}
                <div className="flex flex-col items-center gap-3">
                    <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-3xl">description</span>
                    </div>
                    <h1 className="text-slate-100 text-2xl font-bold tracking-tight">Resume Insights</h1>
                    <p className="text-slate-400 text-sm">
                        {isSignup ? "Create your account to get started." : "Welcome back! Please enter your details."}
                    </p>
                </div>

                {/* Form card */}
                <div className="bg-[#161b26] border border-slate-800 p-8 rounded-lg shadow-xl">
                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>

                        {/* Full Name (Signup only) */}
                        {isSignup && (
                            <label className="flex flex-col gap-1.5">
                                <span className="text-slate-300 text-sm font-medium">Full Name</span>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person</span>
                                    <input
                                        className="input-dark pl-10 pr-4 h-11"
                                        type="text"
                                        placeholder="Alex Johnson"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </label>
                        )}

                        {/* Email */}
                        <label className="flex flex-col gap-1.5">
                            <span className="text-slate-300 text-sm font-medium">Email</span>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                                <input
                                    className="input-dark pl-10 pr-4 h-11"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </label>

                        {/* Password */}
                        <label className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 text-sm font-medium">Password</span>
                                {!isSignup && (
                                    <button type="button" className="text-primary text-xs font-semibold hover:underline">
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                                <input
                                    className="input-dark pl-10 pr-4 h-11"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            {isSignup && (
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Minimum 8 characters, 1 uppercase letter, and 1 number
                                </p>
                            )}
                        </label>

                        {/* Remember me (Login only) */}
                        {!isSignup && (
                            <div className="flex items-center gap-2">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    className="size-4 rounded border-slate-700 text-primary focus:ring-primary bg-transparent"
                                />
                                <label htmlFor="remember" className="text-slate-400 text-sm cursor-pointer">
                                    Remember for 30 days
                                </label>
                            </div>
                        )}

                        {error && <p className="text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/30 rounded">{error}</p>}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg shadow-primary/20 transition-all"
                        >
                            {loading ? (isSignup ? "Creating account..." : "Signing in...") : (isSignup ? "Create account" : "Sign in")}
                        </button>
                    </form>
                </div>

                {/* Toggle signup/login */}
                <p className="text-center text-slate-400 text-sm">
                    {isSignup ? "Already have an account? " : "Don't have an account? "}
                    <button
                        onClick={() => {
                            setIsSignup(!isSignup);
                            setError("");
                        }}
                        className="text-primary font-semibold hover:underline"
                    >
                        {isSignup ? "Sign in" : "Sign up"}
                    </button>
                </p>
            </div>
        </div>
    );
}