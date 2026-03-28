// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from "react";
import { getCurrentUser, getAuthToken, logout as authLogout } from "../auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = getCurrentUser();
        const storedToken = getAuthToken();
        console.log("🔐 AuthContext initializing...");
        console.log("Token from localStorage:", storedToken ? `${storedToken.substring(0, 20)}...` : "null");
        console.log("User from localStorage:", storedUser);
        setUser(storedUser);
        setToken(storedToken);
        setLoading(false);
    }, []);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
    };

    const logout = () => {
        authLogout();
        setUser(null);
        setToken(null);
    };

    // Call this after a successful profile update to keep context in sync
    const updateUser = (updatedFields) => {
        setUser((prev) => {
            const updated = { ...prev, ...updatedFields };
            // Keep localStorage in sync
            localStorage.setItem("user", JSON.stringify(updated));
            return updated;
        });
    };

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
