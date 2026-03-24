// ── Auth API Configuration ────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "";

async function authRequest(action, data) {
    const res = await fetch(`${API_URL}/auth/${action}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": import.meta.env.VITE_API_KEY || "",
        },
        body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
        throw new Error(result.error || `Auth request failed: ${res.status}`);
    }

    return result;
}

// ── Signup ────────────────────────────────────────────────────
export async function signup(email, password, fullName) {
    const result = await authRequest("signup", {
        email: email.toLowerCase().trim(),
        password: password.trim(),
        full_name: fullName.trim(),
    });

    // Store token in localStorage
    if (result.token) {
        localStorage.setItem("auth_token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
    }

    return result;
}

// ── Login ────────────────────────────────────────────────────
export async function login(email, password) {
    const result = await authRequest("login", {
        email: email.toLowerCase().trim(),
        password: password.trim(),
    });

    // Store token in localStorage
    if (result.token) {
        localStorage.setItem("auth_token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
    }

    return result;
}

// ── Logout ───────────────────────────────────────────────────
export function logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
}

// ── Get current user ─────────────────────────────────────────
export function getCurrentUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
}

// ── Get auth token ───────────────────────────────────────────
export function getAuthToken() {
    return localStorage.getItem("auth_token");
}

// ── Check if user is authenticated ──────────────────────────
export function isAuthenticated() {
    return !!localStorage.getItem("auth_token");
}
