import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTournaments, createTournament } from "../api/tournaments";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tournaments, setTournaments] = useState([]);
  const [form, setForm] = useState({ name: "", sport: "", format: "round-robin" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getTournaments().then((r) => setTournaments(r.data));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await createTournament(form);
      navigate(`/tournaments/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || t("home.modal.errorDefault"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={s.page}>
      {/* ── Hero ── */}
      <section style={s.hero}>
        <div style={s.heroGrid} aria-hidden="true" />
        <div style={s.heroInner}>
          <div style={s.heroTag}>
            <span style={s.heroDot} />
            {t("home.badge")}
          </div>
          <h1 style={s.heroTitle}>
            {t("home.heroTitle")}<br />
            <span style={s.heroAccent}>{t("home.heroAccent")}</span>
          </h1>
          <p style={s.heroSub}>
            {t("home.heroSub")}
          </p>
          <div style={s.heroCtas}>
            {user ? (
              <button className="btn-primary" style={s.heroBtn} onClick={() => setShowForm(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                {t("home.newTournament")}
              </button>
            ) : (
              <Link to="/login" className="btn-primary" style={s.heroBtn}>
                {t("home.getStarted")}
              </Link>
            )}
            <a href="#tournaments" className="btn-ghost" style={{ padding: "11px 22px" }}>
              {t("home.browseAll")}
            </a>
          </div>
        </div>
        <div style={s.heroStats}>
          <Stat value={tournaments.length} label={t("home.statsTournaments")} />
          <div style={s.statDiv} />
          <Stat value={tournaments.reduce((a, t) => a + (t.teams_count || 0), 0)} label={t("home.statsTeams")} />
          <div style={s.statDiv} />
          <Stat value="RR" label={t("home.statsFormat")} />
        </div>
      </section>

      {/* ── Create form modal ── */}
      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {t("home.modal.title")}
              </h3>
              <button style={s.closeBtn} onClick={() => setShowForm(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} style={s.form}>
              <div>
                <label className="label">{t("home.modal.nameLabel")}</label>
                <input className="field" placeholder={t("home.modal.namePlaceholder")} value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">{t("home.modal.sportLabel")}</label>
                <input className="field" placeholder={t("home.modal.sportPlaceholder")} value={form.sport}
                  onChange={(e) => setForm({ ...form, sport: e.target.value })} required />
              </div>
              <div>
                <label className="label">{t("home.modal.formatLabel")}</label>
                <div style={s.formatToggle}>
                  {[
                    { value: "round-robin", label: t("home.modal.leagueLabel"), sub: t("home.modal.leagueSub") },
                    { value: "single-elimination", label: t("home.modal.bracketLabel"), sub: t("home.modal.bracketSub") },
                  ].map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      style={{ ...s.formatOption, ...(form.format === f.value ? s.formatActive : {}) }}
                      onClick={() => setForm({ ...form, format: f.value })}
                    >
                      <span style={s.formatLabel}>{f.label}</span>
                      <span style={s.formatSub}>{f.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="err">{error}</p>}
              <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: 4 }} disabled={loading}>
                {loading ? t("home.modal.creating") : t("home.modal.createBtn")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Tournament list ── */}
      <section id="tournaments" style={s.section}>
        <div style={s.sectionHead}>
          <h2 style={s.sectionTitle}>{t("home.listTitle")}</h2>
          {user && (
            <button className="btn-primary" style={{ padding: "9px 18px", fontSize: 13 }} onClick={() => setShowForm(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
              {t("home.newBtn")}
            </button>
          )}
        </div>

        {tournaments.length === 0 ? (
          <div style={s.empty}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p style={{ color: "var(--text-dim)", marginTop: 12, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 14 }}>
              {t("home.empty")}
            </p>
          </div>
        ) : (
          <div style={s.grid}>
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ value, label }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 900, color: "#F0EEF5", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-dim)", marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

function TournamentCard({ tournament: tr }) {
  const { t } = useTranslation();
  return (
    <Link to={`/tournaments/${tr.id}`} style={s.tCard}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(229,21,46,0.35)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={s.tCardTop}>
        <span style={s.sportTag}>{tr.sport}</span>
        <span style={s.formatTag}>{tr.format === "single-elimination" ? t("home.cardBracket") : t("home.cardLeague")}</span>
      </div>
      <div style={s.tName}>{tr.name}</div>
      <div style={s.tMeta}>
        <span style={s.tMetaItem}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" /><path d="M4 20C4 17 7.6 14 12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          {tr.created_by_username}
        </span>
        <span style={s.tMetaItem}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" /><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          {tr.teams_count} {t("home.cardTeams")}
        </span>
      </div>
      <div style={s.tCardArrow}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </Link>
  );
}

const s = {
  page: { flex: 1 },

  // Hero
  hero: {
    position: "relative", overflow: "hidden",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    paddingBottom: 0,
  },
  heroGrid: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
    `,
    backgroundSize: "48px 48px",
    maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
  },
  heroInner: {
    maxWidth: 1100, margin: "0 auto",
    padding: "72px 24px 48px",
    position: "relative",
  },
  heroTag: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "rgba(229,21,46,0.1)", border: "1px solid rgba(229,21,46,0.25)",
    borderRadius: 99, padding: "5px 14px",
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "#E5152E", marginBottom: 24,
  },
  heroDot: {
    width: 6, height: 6, borderRadius: "50%", background: "#E5152E",
    boxShadow: "0 0 6px #E5152E",
    animation: "pulse 2s ease-in-out infinite",
  },
  heroTitle: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: "clamp(56px, 8vw, 96px)",
    fontWeight: 900,
    lineHeight: 0.95,
    letterSpacing: "-0.01em",
    textTransform: "uppercase",
    color: "#F0EEF5",
    marginBottom: 20,
  },
  heroAccent: { color: "#E5152E" },
  heroSub: {
    fontSize: 16, color: "var(--text-muted)", maxWidth: 420,
    lineHeight: 1.6, marginBottom: 36,
  },
  heroCtas: { display: "flex", gap: 12, flexWrap: "wrap" },
  heroBtn: { padding: "12px 26px", fontSize: 15 },
  heroStats: {
    maxWidth: 1100, margin: "0 auto",
    padding: "24px",
    display: "flex", gap: 32, alignItems: "center",
    borderTop: "1px solid rgba(255,255,255,0.07)",
  },
  statDiv: { width: 1, height: 32, background: "rgba(255,255,255,0.07)" },

  // Modal
  overlay: {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "var(--bg-card)",
    border: "1px solid var(--border-hi)",
    borderRadius: 16,
    padding: 32,
    width: "100%", maxWidth: 420,
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
  },
  modalHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  closeBtn: {
    background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6,
    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--text-muted)", cursor: "pointer",
    transition: "background 180ms",
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },

  // List
  section: { maxWidth: 1100, margin: "0 auto", padding: "48px 24px 72px" },
  sectionHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  sectionTitle: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 28, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em",
  },
  empty: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "72px 0",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))",
    gap: 16,
  },
  tCard: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "20px 22px",
    textDecoration: "none", display: "flex", flexDirection: "column", gap: 10,
    transition: "border-color 180ms, transform 180ms",
    position: "relative",
  },
  tCardTop: { display: "flex", gap: 6 },
  formatToggle: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
  },
  formatOption: {
    background: "var(--bg-raised)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "10px 12px",
    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
    cursor: "pointer", transition: "border-color 180ms",
    textAlign: "left",
  },
  formatActive: {
    borderColor: "#E5152E", background: "rgba(229,21,46,0.08)",
  },
  formatLabel: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 14, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.06em", color: "#F0EEF5",
  },
  formatSub: {
    fontSize: 11, color: "var(--text-dim)",
  },
  sportTag: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "#E5152E", background: "rgba(229,21,46,0.1)", border: "1px solid rgba(229,21,46,0.2)",
    borderRadius: 4, padding: "2px 8px",
  },
  formatTag: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
    color: "var(--text-dim)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
    borderRadius: 4, padding: "2px 8px",
  },
  tName: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 20, fontWeight: 800, letterSpacing: "0.02em", textTransform: "uppercase",
    color: "#F0EEF5", lineHeight: 1.1,
  },
  tMeta: { display: "flex", gap: 14 },
  tMetaItem: {
    display: "flex", alignItems: "center", gap: 5,
    color: "var(--text-dim)", fontSize: 12,
    fontFamily: "'Barlow Condensed',sans-serif",
    fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
  },
  tCardArrow: {
    position: "absolute", bottom: 20, right: 20,
    color: "var(--text-dim)",
  },
};
