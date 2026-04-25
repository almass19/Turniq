import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const toggleLang = () => {
    const next = i18n.language === "ru" ? "en" : "ru";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <header style={s.wrap}>
      <div style={s.inner}>
        <Link to="/" style={s.brand}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke="#E5152E" strokeWidth="2" />
            <path d="M12 2C12 2 8 7 8 12C8 17 12 22 12 22" stroke="#E5152E" strokeWidth="1.5" />
            <path d="M12 2C12 2 16 7 16 12C16 17 12 22 12 22" stroke="#E5152E" strokeWidth="1.5" />
            <path d="M2 12H22" stroke="#E5152E" strokeWidth="1.5" />
          </svg>
          <span style={s.brandText}>TURNIQ</span>
        </Link>

        <nav style={s.nav}>
          <Link to="/" style={{ ...s.navLink, ...(location.pathname === "/" ? s.navActive : {}) }}>
            {t("nav.tournaments")}
          </Link>
        </nav>

        <div style={s.right}>
          <button style={s.langBtn} onClick={toggleLang}>
            {i18n.language === "ru" ? "EN" : "RU"}
          </button>

          {user ? (
            <>
              <span style={s.username}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.5 }}>
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M4 20C4 17 7.6 14 12 14C16.4 14 20 17 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {user.username}
              </span>
              <button className="btn-ghost" onClick={logout} style={{ padding: "7px 14px", fontSize: 12 }}>
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>
              {t("nav.signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

const s = {
  wrap: {
    position: "sticky", top: 0, zIndex: 100,
    background: "rgba(11,11,15,0.85)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  inner: {
    maxWidth: 1100, margin: "0 auto",
    padding: "0 24px",
    height: 58,
    display: "flex", alignItems: "center", gap: 32,
  },
  brand: {
    display: "flex", alignItems: "center", gap: 9,
    textDecoration: "none",
  },
  brandText: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 800, fontSize: 20,
    letterSpacing: "0.12em",
    color: "#F0EEF5",
  },
  nav: { display: "flex", gap: 4, flex: 1 },
  navLink: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 600, fontSize: 13,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
    color: "#8B8A9B",
    padding: "6px 12px",
    borderRadius: 6,
    transition: "color 180ms, background 180ms",
    textDecoration: "none",
  },
  navActive: { color: "#F0EEF5", background: "rgba(255,255,255,0.06)" },
  right: { display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" },
  langBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 6,
    padding: "4px 10px",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700, fontSize: 12, letterSpacing: "0.1em",
    color: "#8B8A9B",
    cursor: "pointer",
    transition: "color 180ms, border-color 180ms",
  },
  username: {
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 600, fontSize: 13,
    letterSpacing: "0.06em",
    color: "#8B8A9B",
    textTransform: "uppercase",
  },
};
