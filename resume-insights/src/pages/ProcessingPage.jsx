import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUploadUrl, uploadToS3, analyzeResume } from "../api";

const STEPS = [
    { key: "uploading", label: "Uploading Resume", desc: "Encrypting and sending to secure S3 storage" },
    { key: "extracting", label: "Extracting Skills", desc: "Scanning experience for keywords and tech stack..." },
    { key: "matching", label: "Matching Jobs", desc: "Running ML similarity scoring against job requirements" },
    { key: "feedback", label: "Generating AI Feedback", desc: "Preparing customized resume optimization tips" },
];

const STATUS = { pending: "pending", active: "active", done: "done" };

export default function ProcessingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { file, jobTitle, jobDescription } = location.state || {};

    const [stepStatuses, setStepStatuses] = useState({
        uploading: STATUS.active,
        extracting: STATUS.pending,
        matching: STATUS.pending,
        feedback: STATUS.pending,
    });
    const [progress, setProgress] = useState(5);
    const [error, setError] = useState("");

    const setStep = (key, status) =>
        setStepStatuses((prev) => ({ ...prev, [key]: status }));

    useEffect(() => {
        if (!file || !jobTitle) {
            navigate("/home");
            return;
        }
        runPipeline();
    }, []);

    const runPipeline = async () => {
        try {
            // ── Step 1: Upload ───────────────────────────────────────
            setStep("uploading", STATUS.active);
            setProgress(10);
            const { upload_url, file_key } = await getUploadUrl(file.name, file.type);
            await uploadToS3(upload_url, file);
            setStep("uploading", STATUS.done);
            setProgress(30);

            // ── Step 2: Extract skills (happens inside analyze Lambda)
            setStep("extracting", STATUS.active);
            setProgress(45);

            // ── Step 3: Match + score ────────────────────────────────
            setStep("extracting", STATUS.done);
            setStep("matching", STATUS.active);
            setProgress(65);

            const result = await analyzeResume(file_key, jobTitle, jobDescription);
            setStep("matching", STATUS.done);
            setProgress(85);

            // ── Step 4: AI feedback (Groq chat — called from dashboard)
            setStep("feedback", STATUS.active);
            setProgress(95);
            await new Promise((r) => setTimeout(r, 600)); // brief pause for UX
            setStep("feedback", STATUS.done);
            setProgress(100);

            // Navigate to dashboard with results
            setTimeout(() => {
                navigate("/dashboard", { state: { analysis: result } });
            }, 500);

        } catch (err) {
            setError(err.message || "Analysis failed. Please try again.");
        }
    };

    const circumference = 2 * Math.PI * 45;
    const dashOffset = circumference - (progress / 100) * circumference;

    return (
        <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col">

            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-800 px-6 md:px-10 py-4">
                <div className="flex items-center gap-3 text-primary">
                    <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg">
                        <span className="material-symbols-outlined text-primary">rocket_launch</span>
                    </div>
                    <h2 className="text-white text-xl font-bold">ResumeAI</h2>
                </div>
                <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-slate-200">Analyzing...</p>
                    <p className="text-xs text-slate-500">Please don't close this window</p>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-4xl mx-auto w-full">

                {/* Title */}
                <div className="text-center mb-16">
                    <h1 className="text-white text-5xl md:text-6xl font-serif mb-6 leading-tight">
                        Analyzing Your Resume...
                    </h1>
                    <p className="text-slate-400 text-xl max-w-xl mx-auto font-medium">
                        Our AI is processing your experience to find the perfect job matches and career insights.
                    </p>
                </div>

                {/* Circular progress gauge */}
                <div className="relative mb-20 flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-[100px] scale-150 opacity-40" />
                    <div className="relative size-56 md:size-72 flex items-center justify-center">
                        <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                            <circle className="text-slate-800" cx="50" cy="50" fill="transparent" r="45" stroke="currentColor" strokeWidth="5" />
                            <circle
                                cx="50" cy="50" fill="transparent" r="45"
                                stroke="#5b4cf5"
                                strokeDasharray={`${2 * Math.PI * 45}`}
                                strokeDashoffset={`${2 * Math.PI * 45 - (progress / 100) * 2 * Math.PI * 45}`}
                                strokeLinecap="round" strokeWidth="5"
                                style={{ transition: "stroke-dashoffset 0.8s ease" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl md:text-6xl font-bold text-primary font-mono tracking-tight">{progress}%</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mt-2">Analysis Progress</span>
                        </div>
                    </div>
                </div>

                {/* Step list */}
                <div className="w-full max-w-xl glass-card rounded-3xl p-8 md:p-10 shadow-2xl">
                    <div className="space-y-10">
                        {STEPS.map((step) => {
                            const status = stepStatuses[step.key];
                            return (
                                <div
                                    key={step.key}
                                    className={`flex items-start gap-5 transition-opacity duration-500 ${status === STATUS.pending ? "opacity-40" : "opacity-100"
                                        }`}
                                >
                                    {/* Icon */}
                                    <div className={`mt-1 flex-shrink-0 size-7 rounded-full flex items-center justify-center border ${status === STATUS.done
                                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                                        : status === STATUS.active
                                            ? "bg-primary/10 text-primary border-primary/20"
                                            : "bg-slate-800 text-slate-400 border-transparent"
                                        }`}>
                                        {status === STATUS.done
                                            ? <span className="material-symbols-outlined text-[18px]">check</span>
                                            : status === STATUS.active
                                                ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                                                : <span className="material-symbols-outlined text-[18px]">radio_button_unchecked</span>
                                        }
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1">
                                        <h3 className="text-white font-semibold text-lg">{step.label}</h3>
                                        <p className="text-sm text-slate-400">{step.desc}</p>
                                        {status === STATUS.active && (
                                            <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Badge */}
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase border ${status === STATUS.done
                                        ? "text-green-500 bg-green-500/5 border-green-500/20"
                                        : status === STATUS.active
                                            ? "text-primary bg-primary/5 border-primary/20"
                                            : "text-slate-400 bg-slate-400/5 border-slate-400/20"
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
                    <div className="mt-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-5 max-w-md">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button
                            onClick={() => navigate("/home")}
                            className="mt-3 text-xs text-primary hover:underline"
                        >
                            ← Go back and try again
                        </button>
                    </div>
                )}

                {/* Info + tip */}
                {!error && (
                    <div className="mt-16 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-2.5 text-slate-400 text-sm font-medium">
                            <span className="material-symbols-outlined text-[20px] text-primary/60">info</span>
                            <span>This usually takes less than 30 seconds. Please don't close the window.</span>
                        </div>
                        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 max-w-md shadow-sm">
                            <div className="flex gap-4">
                                <span className="material-symbols-outlined text-primary shrink-0">lightbulb</span>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    <strong>Pro Tip:</strong> Resumes with tailored skill descriptions are 3x more likely to pass initial ATS screening. Our matches are optimized for this.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}