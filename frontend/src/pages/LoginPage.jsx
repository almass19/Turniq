import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.username, form.password);
      } else {
        await register(form.username, form.password, form.email);
      }
      navigate("/");
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === "object") {
        setError(Object.values(data).flat().join(" "));
      } else {
        setError("Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={s.page}>
      <div style={s.bg} aria-hidden="true" />

      <div style={s.card}>
        {/* Brand mark */}
        <div style={s.brandMark}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#E5152E" strokeWidth="2" />
            <path d="M12 2C12 2 8 7 8 12C8 17 12 22 12 22" stroke="#E5152E" strokeWidth="1.5" />
            <path d="M12 2C12 2 16 7 16 12C16 17 12 22 12 22" stroke="#E5152E" strokeWidth="1.5" />
            <path d="M2 12H22" stroke="#E5152E" strokeWidth="1.5" />
          </svg>
          <span style={s.brandText}>TURNIQ</span>
        </div>

        <h1 style={s.title}>
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p style={s.sub}>
          {mode === "login"
            ? "Sign in to manage your tournaments"
            : "Start running tournaments in minutes"}
        </p>

        {/* Tabs */}
        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(mode === "login" ? s.tabActive : {}) }}
            onClick={() => { setMode("login"); setError(""); }}
            type="button"
          >
            Sign In
          </button>
          <button
            style={{ ...s.tab, ...(mode === "register" ? s.tabActive : {}) }}
            onClick={() => { setMode("register"); setError(""); }}
            type="button"
          >
            Register
          </button>
        </div>

        <form onSubmit={handle} style={s.form}>
          <div>
            <label className="label">Username</label>
            <input className="field" placeholder="your_username" autoComplete="username"
              value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>

          {mode === "register" && (
            <div>
              <label className="label">Email <span style={{ color: "var(--text-dim)", fontWeight: 400, fontSize: 10 }}>(optional)</span></label>
              <input className="field" type="email" placeholder="you@example.com" autoComplete="email"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          )}

          <div>
            <label className="label">Password</label>
            <input className="field" type="password" placeholder="••••••••" autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>

          {error && (
            <div style={s.errorBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" style={s.submit} disabled={loading}>
            {loading ? "…" : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        <Link to="/" style={s.back}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          Back to tournaments
        </Link>
      </div>
    </main>
  );
}

const s = {
  page: {
    flex: 1,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px 16px",
    position: "relative",
  },
  bg: {
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
    backgroundImage: `
      radial-gradient(ellipse 600px 500px at 50% 30%, rgba(229,21,46,0.06) 0%, transparent 70%)
    `,
  },
  card: {
    position: "relative", zIndex: 1,
    background: "var(--bg-card)",
    border: "1px solid var(--border-hi)",
    borderRadius: 18,
    padding: "36px 32px",
    width: "100%", maxWidth: 400,
    boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
  },
  brandMark: {
    display: "flex", alignItems: "center", gap: 8,
    marginBottom: 28,
  },
  brandText: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontWeight: 800, fontSize: 18, letterSpacing: "0.12em",
    color: "#F0EEF5",
  },
  title: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 30, fontWeight: 900, textTransform: "uppercase",
    letterSpacing: "0.02em", marginBottom: 6,
  },
  sub: { color: "var(--text-muted)", fontSize: 14, marginBottom: 28 },
  tabs: {
    display: "flex",
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderRadius: 8, padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1, border: "none", background: "transparent",
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
    color: "var(--text-dim)", padding: "8px 0",
    borderRadius: 6, transition: "background 180ms, color 180ms",
    cursor: "pointer",
  },
  tabActive: {
    background: "var(--bg-hover)", color: "#F0EEF5",
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  errorBox: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(229,21,46,0.1)", border: "1px solid rgba(229,21,46,0.25)",
    borderRadius: 8, padding: "10px 12px",
    color: "#E5152E", fontSize: 13,
  },
  submit: { width: "100%", padding: "13px", fontSize: 15, marginTop: 4 },
  back: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    marginTop: 20,
    color: "var(--text-dim)", fontSize: 13,
    fontFamily: "'Barlow Condensed',sans-serif",
    fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
    textDecoration: "none",
    transition: "color 180ms",
  },
};
