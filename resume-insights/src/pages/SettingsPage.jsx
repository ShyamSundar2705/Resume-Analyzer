import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { updateUserProfile, changePassword } from "../api";

function Toggle({ checked, onChange }) {
    return (
        <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 ${
                checked ? "bg-primary shadow-lg shadow-primary/30" : "bg-slate-300 dark:bg-slate-600"
            }`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                checked ? "translate-x-6" : "translate-x-1"
            }`} />
        </button>
    );
}

export default function SettingsPage() {
    const { user, token, updateUser } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    const [activeTab, setActiveTab] = useState("account");
    const [formData, setFormData] = useState({
        full_name: user?.full_name || user?.name || "",
        title: user?.title || "",
    });
    const [accountLoading, setAccountLoading] = useState(false);
    const [passwords, setPasswords] = useState({ current_password: "", new_password: "", confirm_password: "" });
    const [securityLoading, setSecurityLoading] = useState(false);
    const [autoSave, setAutoSave] = useState(true);
    const [emailNotif, setEmailNotif] = useState(true);
    const [weeklyDigest, setWeeklyDigest] = useState(true);
    const [message, setMessage] = useState({ type: "", text: "" });

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    };

    const handleSaveProfile = async () => {
        if (!formData.full_name.trim()) { showMessage("error", "Full name cannot be empty."); return; }
        setAccountLoading(true);
        try {
            await updateUserProfile(token, { full_name: formData.full_name.trim(), title: formData.title.trim() });
            updateUser({ full_name: formData.full_name.trim(), title: formData.title.trim() });
            showMessage("success", "Profile updated successfully!");
        } catch (err) { showMessage("error", err.message || "Failed to update profile."); }
        finally { setAccountLoading(false); }
    };

    const handleChangePassword = async () => {
        if (!passwords.current_password) { showMessage("error", "Please enter your current password."); return; }
        if (passwords.new_password.length < 8) { showMessage("error", "New password must be at least 8 characters."); return; }
        if (passwords.new_password !== passwords.confirm_password) { showMessage("error", "Passwords do not match."); return; }
        setSecurityLoading(true);
        try {
            await changePassword(token, { current_password: passwords.current_password, new_password: passwords.new_password });
            setPasswords({ current_password: "", new_password: "", confirm_password: "" });
            showMessage("success", "Password changed successfully!");
        } catch (err) { showMessage("error", err.message || "Failed to change password."); }
        finally { setSecurityLoading(false); }
    };

    // ── Design tokens ─────────────────────────────────────────────
    const tk = isDark ? {
        page:        "bg-[#0d0d14]",
        pageTitle:   "text-slate-100",
        pageSub:     "text-slate-400",
        sidebar:     "bg-[#12121c] border-white/5",
        tabInactive: "text-slate-400 hover:bg-white/5 hover:text-slate-200",
        card:        "bg-[#12121c] border-white/5",
        sectionTitle:"text-slate-100",
        label:       "text-slate-300",
        input:       "bg-slate-900/60 border-white/10 text-slate-100 placeholder:text-slate-600 focus:border-primary focus:ring-primary/25",
        inputDisabled:"bg-white/5 border-white/8 text-slate-500 opacity-60",
        hint:        "text-slate-500",
        prefRow:     "bg-white/3 border-white/8",
        prefTitle:   "text-slate-200",
        prefSub:     "text-slate-500",
    } : {
        page:        "bg-background-light",
        pageTitle:   "text-slate-900",
        pageSub:     "text-slate-500",
        sidebar:     "bg-white border-border-light shadow-card-light",
        tabInactive: "text-slate-500 hover:bg-surface-light-2 hover:text-slate-800",
        card:        "bg-white border-border-light shadow-card-light",
        sectionTitle:"text-slate-900",
        label:       "text-slate-700",
        input:       "bg-white border-[#d4d4e0] text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-primary/15",
        inputDisabled:"bg-slate-50 border-slate-200 text-slate-400 opacity-80",
        hint:        "text-slate-400",
        prefRow:     "bg-surface-light-2 border-border-light",
        prefTitle:   "text-slate-800",
        prefSub:     "text-slate-500",
    };

    const inputClass = `w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${tk.input}`;
    const inputDisabledClass = `w-full border rounded-lg px-4 py-2.5 text-sm cursor-not-allowed ${tk.inputDisabled}`;

    const tabs = [
        { id: "account",       label: "Account",       icon: "person"        },
        { id: "security",      label: "Security",      icon: "lock"          },
        { id: "preferences",   label: "Preferences",   icon: "settings"      },
        { id: "notifications", label: "Notifications", icon: "notifications" },
    ];

    return (
        <div className={`min-h-screen transition-colors duration-300 ${tk.page}`}>
            <Navbar activePage="settings" />

            <main className="px-6 py-12 lg:px-12 max-w-6xl mx-auto">
                <div className="mb-10">
                    <h1 className={`text-4xl font-bold mb-2 ${tk.pageTitle}`}>Settings</h1>
                    <p className={tk.pageSub}>Manage your account preferences and security</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className={`border rounded-2xl p-3 space-y-1 sticky top-24 ${tk.sidebar}`}>
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                                        activeTab === tab.id
                                            ? "bg-primary/10 border border-primary/20 text-primary"
                                            : tk.tabInactive
                                    }`}>
                                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <div className={`border rounded-2xl p-8 space-y-8 ${tk.card}`}>

                            {/* Toast */}
                            {message.text && (
                                <div className={`p-4 rounded-xl border text-sm font-medium ${
                                    message.type === "success"
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                        : "bg-red-500/10 border-red-500/20 text-red-400"
                                }`}>
                                    {message.type === "success" ? "✓ " : "✕ "}{message.text}
                                </div>
                            )}

                            {/* ── Account ── */}
                            {activeTab === "account" && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className={`text-xl font-bold mb-1 ${tk.sectionTitle}`}>Account Information</h2>
                                        <p className={`text-sm ${tk.hint}`}>Update your name and professional title</p>
                                    </div>
                                    <div className={`h-px ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                                    <div className="space-y-5">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${tk.label}`}>Full Name</label>
                                            <input type="text" value={formData.full_name}
                                                onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                                                placeholder="Your full name" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${tk.label}`}>Email Address</label>
                                            <input type="email" value={user?.email || ""} disabled className={inputDisabledClass} />
                                            <p className={`text-xs mt-1.5 ${tk.hint}`}>Email address cannot be changed</p>
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${tk.label}`}>Professional Title</label>
                                            <input type="text" value={formData.title}
                                                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                                placeholder="e.g. Senior Full Stack Engineer" className={inputClass} />
                                        </div>
                                        <button onClick={handleSaveProfile} disabled={accountLoading}
                                            className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition-all text-sm"
                                            style={{ boxShadow: "0 1px 2px rgba(99,102,241,0.3), 0 4px 12px rgba(99,102,241,0.2)" }}>
                                            {accountLoading ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── Security ── */}
                            {activeTab === "security" && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className={`text-xl font-bold mb-1 ${tk.sectionTitle}`}>Change Password</h2>
                                        <p className={`text-sm ${tk.hint}`}>Requires your current password to confirm</p>
                                    </div>
                                    <div className={`h-px ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                                    <div className="space-y-5">
                                        {[
                                            { key: "current_password", label: "Current Password", ph: "Enter your current password" },
                                            { key: "new_password",     label: "New Password",     ph: "Minimum 8 characters" },
                                            { key: "confirm_password", label: "Confirm Password", ph: "Re-enter new password" },
                                        ].map(f => (
                                            <div key={f.key}>
                                                <label className={`block text-sm font-medium mb-2 ${tk.label}`}>{f.label}</label>
                                                <input type="password" value={passwords[f.key]}
                                                    onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))}
                                                    placeholder={f.ph} className={inputClass} />
                                                {f.key === "confirm_password" && passwords.confirm_password && (
                                                    <p className={`text-xs mt-1.5 font-medium ${passwords.new_password === passwords.confirm_password ? "text-emerald-500" : "text-red-400"}`}>
                                                        {passwords.new_password === passwords.confirm_password ? "✓ Passwords match" : "✕ Passwords do not match"}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                        <button onClick={handleChangePassword} disabled={securityLoading}
                                            className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition-all text-sm"
                                            style={{ boxShadow: "0 1px 2px rgba(99,102,241,0.3), 0 4px 12px rgba(99,102,241,0.2)" }}>
                                            {securityLoading ? "Changing..." : "Change Password"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── Preferences ── */}
                            {activeTab === "preferences" && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className={`text-xl font-bold mb-1 ${tk.sectionTitle}`}>Preferences</h2>
                                        <p className={`text-sm ${tk.hint}`}>Customize your experience</p>
                                    </div>
                                    <div className={`h-px ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                                    <div className="space-y-3">
                                        {[
                                            { label: "Dark Mode", desc: isDark ? "Switch to light theme" : "Switch to dark theme", checked: isDark, onChange: toggleTheme },
                                            { label: "Auto-save Drafts", desc: "Automatically save your work as you go", checked: autoSave, onChange: setAutoSave },
                                        ].map(item => (
                                            <div key={item.label} className={`flex items-center justify-between p-4 rounded-xl border ${tk.prefRow}`}>
                                                <div>
                                                    <p className={`text-sm font-semibold ${tk.prefTitle}`}>{item.label}</p>
                                                    <p className={`text-xs mt-0.5 ${tk.prefSub}`}>{item.desc}</p>
                                                </div>
                                                <Toggle checked={item.checked} onChange={item.onChange} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Notifications ── */}
                            {activeTab === "notifications" && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className={`text-xl font-bold mb-1 ${tk.sectionTitle}`}>Notifications</h2>
                                        <p className={`text-sm ${tk.hint}`}>Control how you receive updates</p>
                                    </div>
                                    <div className={`h-px ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                                    <div className="space-y-3">
                                        {[
                                            { label: "Email Notifications", desc: "Receive analysis results and tips by email", checked: emailNotif, onChange: setEmailNotif },
                                            { label: "Weekly Digest", desc: "A summary of your resume insights every week", checked: weeklyDigest, onChange: setWeeklyDigest },
                                        ].map(item => (
                                            <div key={item.label} className={`flex items-center justify-between p-4 rounded-xl border ${tk.prefRow}`}>
                                                <div>
                                                    <p className={`text-sm font-semibold ${tk.prefTitle}`}>{item.label}</p>
                                                    <p className={`text-xs mt-0.5 ${tk.prefSub}`}>{item.desc}</p>
                                                </div>
                                                <Toggle checked={item.checked} onChange={item.onChange} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
