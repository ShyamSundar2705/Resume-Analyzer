/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        "accent-purple": "#a78bfa",

        // ── Dark theme surfaces ──────────────────────────
        "background-dark": "#0d0d14",
        "surface-dark":    "#12121c",
        "surface-dark-2":  "#1a1a2e",
        "sidebar-dark":    "#12121c",

        // ── Light theme surfaces ─────────────────────────
        // Named semantically so JSX can reference them cleanly
        "background-light": "#f4f4f8",   // warm off-white, not pure white
        "surface-light":    "#ffffff",   // cards sit on this
        "surface-light-2":  "#f0f0f6",  // subtle elevated tint
        "border-light":     "#e4e4ed",  // slightly purple-tinted border
      },
      boxShadow: {
        // Light mode elevation system
        "card-light":  "0 1px 3px rgba(99,102,241,0.06), 0 4px 12px rgba(0,0,0,0.06)",
        "card-light-hover": "0 2px 8px rgba(99,102,241,0.10), 0 8px 24px rgba(0,0,0,0.08)",
        "nav-light":   "0 1px 0 #e4e4ed, 0 2px 8px rgba(0,0,0,0.04)",
        "input-focus": "0 0 0 3px rgba(99,102,241,0.15)",
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
