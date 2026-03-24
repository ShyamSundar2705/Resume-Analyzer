import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("account");
    const [formData, setFormData] = useState({
        full_name: user?.full_name || "",
        email: user?.email || "",
        title: "Senior Full Stack Engineer",
    });
    const [message, setMessage] = useState({ type: "", text: "" });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = () => {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    };

    const handleChangePassword = () => {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    };

    return (
        <div className="min-h-screen bg-background-dark">
            <Navbar activePage="settings" />

            <main className="flex-1 px-6 py-12 lg:px-12 max-w-6xl mx-auto w-full">
                {/* Page header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-slate-100 mb-2">Settings</h1>
                    <p className="text-slate-400">Manage your account preferences and security</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar tabs */}
                    <div className="lg:col-span-1">
                        <div className="bg-sidebar-dark border border-white/5 rounded-xl p-4 space-y-2 sticky top-24">
                            {[
                                { id: "account", label: "Account", icon: "person" },
                                { id: "security", label: "Security", icon: "lock" },
                                { id: "preferences", label: "Preferences", icon: "settings" },
                                { id: "notifications", label: "Notifications", icon: "notifications" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${activeTab === tab.id
                                        ? "bg-primary/10 border border-primary/20 text-primary"
                                        : "text-slate-400 hover:bg-white/5"
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="lg:col-span-3">
                        <div className="bg-sidebar-dark border border-white/5 rounded-xl p-8 space-y-8">
                            {/* Messages */}
                            {message.text && (
                                <div className={`p-4 rounded-lg border ${message.type === "success"
                                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                                    : "bg-red-500/10 border-red-500/30 text-red-400"
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            {/* Account Settings */}
                            {activeTab === "account" && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-100 mb-6">Account Information</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                                                <input
                                                    type="text"
                                                    name="full_name"
                                                    value={formData.full_name}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    disabled
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-slate-400 opacity-50 cursor-not-allowed"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Professional Title</label>
                                                <input
                                                    type="text"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                            </div>
                                            <button
                                                onClick={handleSaveProfile}
                                                className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-primary/20"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Settings */}
                            {activeTab === "security" && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-100 mb-6">Security Settings</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                                                <input
                                                    type="password"
                                                    placeholder="Enter your current password"
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                                                <input
                                                    type="password"
                                                    placeholder="Enter new password"
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    placeholder="Confirm new password"
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                            </div>
                                            <button
                                                onClick={handleChangePassword}
                                                className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-primary/20"
                                            >
                                                Change Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Preferences */}
                            {activeTab === "preferences" && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-100 mb-6">Preferences</h2>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                                                <div>
                                                    <p className="font-medium text-slate-200">Dark Mode</p>
                                                    <p className="text-xs text-slate-500">Always use dark theme</p>
                                                </div>
                                                <input type="checkbox" defaultChecked className="w-5 h-5" />
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                                                <div>
                                                    <p className="font-medium text-slate-200">Auto-save Drafts</p>
                                                    <p className="text-xs text-slate-500">Automatically save your resume drafts</p>
                                                </div>
                                                <input type="checkbox" defaultChecked className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications */}
                            {activeTab === "notifications" && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-100 mb-6">Notification Preferences</h2>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                                                <div>
                                                    <p className="font-medium text-slate-200">Email Notifications</p>
                                                    <p className="text-xs text-slate-500">Get updates about your analyses</p>
                                                </div>
                                                <input type="checkbox" defaultChecked className="w-5 h-5" />
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                                                <div>
                                                    <p className="font-medium text-slate-200">Weekly Digest</p>
                                                    <p className="text-xs text-slate-500">Receive weekly resume insights</p>
                                                </div>
                                                <input type="checkbox" defaultChecked className="w-5 h-5" />
                                            </div>
                                        </div>
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