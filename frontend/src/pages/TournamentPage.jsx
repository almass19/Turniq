import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTournament, getSchedule, getStandings, getTeams,
  addTeam, generateSchedule, enterResult, getBracket,
} from "../api/tournaments";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function TournamentPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [tournament, setTournament] = useState(null);
  const [tab, setTab] = useState("schedule");
  const [schedule, setSchedule] = useState([]);
  const [standings, setStandings] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState("");
  const [teamError, setTeamError] = useState("");
  const [resultModal, setResultModal] = useState(null);
  const [scores, setScores] = useState({ home: "", away: "" });
  const [bracket, setBracket] = useState([]);
  const [scheduleGenerated, setScheduleGenerated] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  const load = useCallback(async () => {
    const [t, sc, st, tm] = await Promise.all([
      getTournament(id), getSchedule(id), getStandings(id), getTeams(id),
    ]);
    setTournament(t.data);
    setSchedule(sc.data);
    setStandings(st.data);
    setTeams(tm.data);
    setScheduleGenerated(sc.data.length > 0);
    if (t.data.format === "single-elimination") {
      try { const br = await getBracket(id); setBracket(br.data); } catch {}
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isOrganizer = user && tournament && tournament.created_by_username === user.username;

  const handleAddTeam = async (e) => {
    e.preventDefault();
    setTeamError("");
    try {
      await addTeam(id, { name: newTeam });
      setNewTeam("");
      await load();
    } catch (err) {
      setTeamError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.name?.[0] || "Failed to add team");
    }
  };

  const handleGenerateSchedule = async () => {
    setGenLoading(true);
    try {
      await generateSchedule(id);
      await load();
      setTab("schedule");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to generate schedule");
    } finally {
      setGenLoading(false);
    }
  };

  const handleEnterResult = async () => {
    if (scores.home === "" || scores.away === "") return;
    try {
      await enterResult(resultModal.id, {
        home_score: parseInt(scores.home),
        away_score: parseInt(scores.away),
      });
      setResultModal(null);
      setScores({ home: "", away: "" });
      await load();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save result");
    }
  };

  if (!tournament) return (
    <div style={s.loading}>
      <div style={s.spinner} />
    </div>
  );

  const completedCount = schedule.filter((m) => m.status === "completed").length;
  const progress = schedule.length ? Math.round((completedCount / schedule.length) * 100) : 0;

  return (
    <main style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <button style={s.backBtn} onClick={() => navigate("/")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            {t("tournament.back")}
          </button>

          <div style={s.headerMeta}>
            <span style={s.sportChip}>{tournament.sport}</span>
            <span style={s.formatChip}>{tournament.format === "single-elimination" ? t("tournament.formatBracket") : t("tournament.formatLeague")}</span>
          </div>
          <h1 style={s.title}>{tournament.name}</h1>

          {/* Progress bar */}
          {schedule.length > 0 && (
            <div style={s.progressWrap}>
              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, width: `${progress}%` }} />
              </div>
              <span style={s.progressLabel}>{completedCount}/{schedule.length} {t("tournament.matches")}</span>
            </div>
          )}

          {/* Stats row */}
          <div style={s.statsRow}>
            <MiniStat icon={teamsIcon} value={teams.length} label={t("tournament.statsTeams")} />
            <MiniStat icon={matchIcon} value={schedule.length} label={t("tournament.statsMatches")} />
            <MiniStat icon={checkIcon} value={completedCount} label={t("tournament.statsPlayed")} />
            <MiniStat icon={personIcon} value={tournament.created_by_username} label={t("tournament.statsOrganizer")} />
          </div>
        </div>
      </div>

      {/* ── Organizer panel ── */}
      {isOrganizer && (
        <div style={s.orgPanel}>
          <div style={s.orgInner}>
            {!scheduleGenerated ? (
              <>
                <form onSubmit={handleAddTeam} style={s.addForm}>
                  <div style={{ flex: 1 }}>
                    <label className="label">{t("tournament.addTeam")}</label>
                    <input className="field" placeholder={t("tournament.teamPlaceholder")} value={newTeam}
                      onChange={(e) => setNewTeam(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-ghost" style={s.addBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                    {t("tournament.addBtn")}
                  </button>
                </form>
                {teamError && <p className="err" style={{ marginTop: 8 }}>{teamError}</p>}
                {teams.length >= 2 && (
                  <button className="btn-gold" style={s.genBtn} onClick={handleGenerateSchedule} disabled={genLoading}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {genLoading ? t("tournament.generating") : t("tournament.generateBtn", { count: teams.length })}
                  </button>
                )}
              </>
            ) : (
              <div style={s.orgNote}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#F0A500" strokeWidth="2" strokeLinecap="round" /></svg>
                {tournament.format === "single-elimination"
                  ? t("tournament.orgBracket")
                  : t("tournament.orgLeague")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={s.tabsWrap}>
        <div style={s.tabsInner}>
          {(tournament.format === "single-elimination"
            ? [
                { key: "schedule", labelKey: "tournament.tabs.schedule", count: schedule.length },
                { key: "bracket", labelKey: "tournament.tabs.bracket", count: bracket.length },
                { key: "teams", labelKey: "tournament.tabs.teams", count: teams.length },
              ]
            : [
                { key: "schedule", labelKey: "tournament.tabs.schedule", count: schedule.length },
                { key: "standings", labelKey: "tournament.tabs.standings", count: standings.length },
                { key: "teams", labelKey: "tournament.tabs.teams", count: teams.length },
              ]
          ).map(({ key, count, labelKey }) => (
            <button
              key={key}
              style={{ ...s.tabBtn, ...(tab === key ? s.tabActive : {}) }}
              onClick={() => setTab(key)}
            >
              {t(labelKey)}
              <span style={{ ...s.tabCount, ...(tab === key ? s.tabCountActive : {}) }}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={s.content}>
        {tab === "schedule" && (
          <ScheduleTab schedule={schedule} isOrganizer={isOrganizer}
            onEnterResult={(m) => { setResultModal(m); setScores({ home: "", away: "" }); }} />
        )}
        {tab === "standings" && <StandingsTab standings={standings} />}
        {tab === "bracket" && <BracketTab bracket={bracket} isOrganizer={isOrganizer}
            onEnterResult={(m) => { setResultModal(m); setScores({ home: "", away: "" }); }} />}
        {tab === "teams" && <TeamsTab teams={teams} />}
      </div>

      {/* ── Result Modal ── */}
      {resultModal && (
        <div style={s.overlay} onClick={() => setResultModal(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTag}>{t("tournament.modal.title")}</div>
            <div style={s.modalMatchup}>
              <div style={s.modalTeam}>{resultModal.home_team_name}</div>
              <span style={s.modalVs}>{t("tournament.modal.vs")}</span>
              <div style={s.modalTeam}>{resultModal.away_team_name}</div>
            </div>
            <div style={s.scoreRow}>
              <div style={s.scoreField}>
                <div style={s.scoreTeamLabel}>{resultModal.home_team_name}</div>
                <input
                  style={s.scoreInput}
                  type="number" min="0" max="99"
                  placeholder="0"
                  value={scores.home}
                  onChange={(e) => setScores({ ...scores, home: e.target.value })}
                  autoFocus
                />
              </div>
              <div style={s.scoreSep}>:</div>
              <div style={s.scoreField}>
                <div style={s.scoreTeamLabel}>{resultModal.away_team_name}</div>
                <input
                  style={s.scoreInput}
                  type="number" min="0" max="99"
                  placeholder="0"
                  value={scores.away}
                  onChange={(e) => setScores({ ...scores, away: e.target.value })}
                />
              </div>
            </div>
            <div style={s.modalBtns}>
              <button style={s.cancelBtn} onClick={() => setResultModal(null)}>{t("tournament.modal.cancel")}</button>
              <button className="btn-primary" style={{ flex: 2, padding: "12px" }} onClick={handleEnterResult}
                disabled={scores.home === "" || scores.away === ""}>
                {t("tournament.modal.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ── Schedule Tab ─────────────────────────── */
function ScheduleTab({ schedule, isOrganizer, onEnterResult }) {
  const { t } = useTranslation();
  if (schedule.length === 0) return (
    <div style={s.empty}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p style={s.emptyText}>{t("tournament.schedule.empty")}</p>
    </div>
  );

  const byRound = schedule.reduce((acc, m) => {
    const r = m.round_number;
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {Object.entries(byRound).map(([round, matches]) => (
        <div key={round}>
          <div style={s.roundHeader}>
            <span style={s.roundLabel}>{t("tournament.schedule.round", { n: round })}</span>
            <span style={s.roundLine} />
            <span style={s.roundCount}>{matches.filter(m => m.status === "completed").length}/{matches.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {matches.map((m) => (
              <MatchRow key={m.id} match={m} isOrganizer={isOrganizer} onEnterResult={onEnterResult} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchRow({ match: m, isOrganizer, onEnterResult }) {
  const done = m.status === "completed";
  const homeWin = done && m.home_score > m.away_score;
  const awayWin = done && m.away_score > m.home_score;

  return (
    <div style={{ ...s.matchRow, ...(done ? s.matchRowDone : {}) }}>
      <div style={s.matchTeam}>
        <span style={{ ...s.matchTeamName, ...(homeWin ? s.matchWinner : {}) }}>{m.home_team_name}</span>
      </div>
      <div style={s.matchCenter}>
        <div style={{ ...s.matchScore, ...(done ? s.matchScoreDone : {}) }}>
          {done ? `${m.home_score}  :  ${m.away_score}` : "—  :  —"}
        </div>
        {done && (
          <div style={s.matchDoneTag}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
            FT
          </div>
        )}
      </div>
      <div style={{ ...s.matchTeam, textAlign: "right" }}>
        <span style={{ ...s.matchTeamName, ...(awayWin ? s.matchWinner : {}) }}>{m.away_team_name}</span>
      </div>
      {isOrganizer && !done && (
        <button style={s.resultBtn} onClick={() => onEnterResult(m)}>
          <EnterResultLabel />
        </button>
      )}
    </div>
  );
}

function EnterResultLabel() {
  const { t } = useTranslation();
  return <>{t("tournament.schedule.enterResult")}</>;
}

/* ── Bracket Tab ──────────────────────────── */
function BracketTab({ bracket, isOrganizer, onEnterResult }) {
  const { t } = useTranslation();
  if (bracket.length === 0) return (
    <div style={s.empty}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
        <path d="M3 6h4v4H3zM3 14h4v4H3zM17 10h4v4h-4zM7 8h6M7 16h6M13 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p style={s.emptyText}>{t("tournament.bracket.empty")}</p>
    </div>
  );

  return (
    <div style={bs.wrap}>
      {bracket.map((round, ri) => (
        <div key={round.round} style={bs.roundCol}>
          <div style={bs.roundName}>{t(`tournament.rounds.${round.name}`, round.name)}</div>
          <div style={bs.matchList}>
            {round.matches.map((m) => {
              const done = m.status === "completed";
              const homeWin = done && m.home_score > m.away_score;
              const awayWin = done && m.away_score > m.home_score;
              const isTBD = !m.home_team && !m.away_team;
              return (
                <div key={m.id} style={bs.card}>
                  <div style={{ ...bs.team, ...(homeWin ? bs.winner : {}), ...(isTBD ? bs.tbd : {}) }}>
                    <span style={bs.teamName}>{m.home_team_name}</span>
                    {done && <span style={{ ...bs.score, ...(homeWin ? bs.scoreWin : {}) }}>{m.home_score}</span>}
                  </div>
                  <div style={bs.divider} />
                  <div style={{ ...bs.team, ...(awayWin ? bs.winner : {}), ...(isTBD ? bs.tbd : {}) }}>
                    <span style={bs.teamName}>{m.away_team_name}</span>
                    {done && <span style={{ ...bs.score, ...(awayWin ? bs.scoreWin : {}) }}>{m.away_score}</span>}
                  </div>
                  {isOrganizer && !done && !isTBD && m.home_team && m.away_team && (
                    <button style={bs.resultBtn} onClick={() => onEnterResult(m)}>
                      {t("tournament.bracket.result")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const bs = {
  wrap: {
    display: "flex", gap: 0, overflowX: "auto",
    paddingBottom: 16, alignItems: "flex-start",
  },
  roundCol: {
    display: "flex", flexDirection: "column",
    minWidth: 200, flex: "0 0 200px",
  },
  roundName: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
    color: "#E5152E", textAlign: "center",
    padding: "0 8px 14px", borderBottom: "1px solid var(--border)",
    marginBottom: 0,
  },
  matchList: {
    display: "flex", flexDirection: "column",
    justifyContent: "space-around",
    flex: 1, padding: "16px 8px",
    gap: 12,
  },
  card: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 10, overflow: "hidden",
    position: "relative",
  },
  team: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 14px",
  },
  winner: { background: "rgba(229,21,46,0.06)" },
  tbd: { opacity: 0.4 },
  teamName: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 15, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase",
    color: "#F0EEF5", flex: 1,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  score: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 18, fontWeight: 900,
    color: "var(--text-dim)",
    marginLeft: 8, minWidth: 20, textAlign: "right",
  },
  scoreWin: { color: "#E5152E" },
  divider: { height: 1, background: "var(--border)", margin: "0" },
  resultBtn: {
    width: "100%",
    background: "rgba(229,21,46,0.08)", border: "none",
    borderTop: "1px solid rgba(229,21,46,0.15)",
    padding: "7px 14px",
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "#E5152E", cursor: "pointer",
    transition: "background 180ms",
  },
};

/* ── Standings Tab ────────────────────────── */
function StandingsTab({ standings }) {
  const { t } = useTranslation();
  if (standings.length === 0) return (
    <div style={s.empty}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p style={s.emptyText}>{t("tournament.standings.empty")}</p>
    </div>
  );

  const COLS = [
    { key: "pos",    label: "#",    w: 40 },
    { key: "team",   label: "Team", w: "auto" },
    { key: "played", label: "P",    w: 44 },
    { key: "wins",   label: "W",    w: 44 },
    { key: "draws",  label: "D",    w: 44 },
    { key: "losses", label: "L",    w: 44 },
    { key: "gf",     label: "GF",   w: 44 },
    { key: "ga",     label: "GA",   w: 44 },
    { key: "gd",     label: "GD",   w: 50 },
    { key: "pts",    label: "PTS",  w: 56 },
  ];

  return (
    <div style={s.tableWrap}>
      <table style={s.table}>
        <thead>
          <tr>
            {COLS.map((c) => (
              <th key={c.key} style={{ ...s.th, width: c.w, ...(c.key === "pts" ? s.thPts : {}) }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const isTop = i === 0;
            const gd = row.goal_diff;
            return (
              <tr key={row.id} style={i % 2 === 0 ? s.trEven : {}}>
                <td style={s.td}>
                  <span style={{ ...s.posNum, ...(isTop ? s.posTop : {}) }}>
                    {i + 1}
                  </span>
                </td>
                <td style={{ ...s.td, ...s.tdTeam }}>{row.team_name}</td>
                <td style={s.td}>{row.played}</td>
                <td style={{ ...s.td, color: "#4ade80" }}>{row.wins}</td>
                <td style={{ ...s.td, color: "var(--text-muted)" }}>{row.draws}</td>
                <td style={{ ...s.td, color: "#f87171" }}>{row.losses}</td>
                <td style={s.td}>{row.goals_for}</td>
                <td style={s.td}>{row.goals_against}</td>
                <td style={{ ...s.td, color: gd > 0 ? "#4ade80" : gd < 0 ? "#f87171" : "var(--text-muted)" }}>
                  {gd > 0 ? `+${gd}` : gd}
                </td>
                <td style={{ ...s.td, ...s.tdPts }}>{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Teams Tab ────────────────────────────── */
function TeamsTab({ teams }) {
  const { t } = useTranslation();
  if (teams.length === 0) return (
    <div style={s.empty}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" /><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p style={s.emptyText}>{t("tournament.teams.empty")}</p>
    </div>
  );

  return (
    <div style={s.teamsGrid}>
      {teams.map((team, i) => (
        <div key={team.id} style={s.teamCard}>
          <div style={s.teamNumber}>{String(i + 1).padStart(2, "0")}</div>
          <div style={s.teamName}>{team.name}</div>
          <div style={s.teamPlayers}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" /><path d="M4 20C4 17 7.6 14 12 14C16.4 14 20 17 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            {team.players?.length || 0} {t("tournament.teams.players")}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Mini stat ────────────────────────────── */
function MiniStat({ icon, value, label }) {
  return (
    <div style={s.miniStat}>
      <span style={s.miniStatIcon}>{icon}</span>
      <span style={s.miniStatValue}>{value}</span>
      <span style={s.miniStatLabel}>{label}</span>
    </div>
  );
}

/* SVG icons */
const teamsIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" /><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" /></svg>;
const matchIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
const checkIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
const personIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" /><path d="M4 20C4 17 7.6 14 12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;

const s = {
  page: { flex: 1, display: "flex", flexDirection: "column" },
  loading: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
  },
  spinner: {
    width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)",
    borderTopColor: "#E5152E", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  // Header
  header: {
    background: "var(--bg-card)",
    borderBottom: "1px solid var(--border)",
  },
  headerInner: {
    maxWidth: 1100, margin: "0 auto",
    padding: "32px 24px 28px",
  },
  backBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "transparent", border: "none",
    color: "var(--text-dim)", fontSize: 13,
    fontFamily: "'Barlow Condensed',sans-serif",
    fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase",
    cursor: "pointer", marginBottom: 20,
    transition: "color 180ms",
    padding: 0,
  },
  headerMeta: { display: "flex", gap: 8, marginBottom: 12 },
  sportChip: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "#E5152E", background: "rgba(229,21,46,0.1)", border: "1px solid rgba(229,21,46,0.2)",
    borderRadius: 4, padding: "2px 8px",
  },
  formatChip: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
    color: "var(--text-dim)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
    borderRadius: 4, padding: "2px 8px",
  },
  title: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: "clamp(32px, 5vw, 52px)",
    fontWeight: 900, textTransform: "uppercase",
    letterSpacing: "0.01em", color: "#F0EEF5",
    marginBottom: 20,
  },
  progressWrap: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  progressBar: {
    flex: 1, maxWidth: 300, height: 3,
    background: "rgba(255,255,255,0.08)", borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%", background: "#E5152E", borderRadius: 99,
    transition: "width 500ms ease",
  },
  progressLabel: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
    color: "var(--text-dim)",
  },
  statsRow: { display: "flex", gap: 0, flexWrap: "wrap" },
  miniStat: {
    display: "flex", alignItems: "center", gap: 6,
    paddingRight: 20, marginRight: 20,
    borderRight: "1px solid var(--border)",
    color: "var(--text-dim)",
    "&:last-child": { border: "none" },
  },
  miniStatIcon: { color: "var(--text-dim)", display: "flex" },
  miniStatValue: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontWeight: 700, fontSize: 14, color: "#F0EEF5",
    letterSpacing: "0.02em",
  },
  miniStatLabel: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "var(--text-dim)",
  },

  // Organizer panel
  orgPanel: {
    background: "rgba(240,165,0,0.04)",
    borderBottom: "1px solid rgba(240,165,0,0.12)",
  },
  orgInner: {
    maxWidth: 1100, margin: "0 auto",
    padding: "16px 24px",
    display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end",
  },
  addForm: { display: "flex", gap: 10, flex: 1, minWidth: 260, alignItems: "flex-end" },
  addBtn: { whiteSpace: "nowrap", flexShrink: 0 },
  genBtn: { whiteSpace: "nowrap" },
  orgNote: {
    display: "flex", alignItems: "center", gap: 8,
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 13, fontWeight: 600, letterSpacing: "0.06em",
    color: "#F0A500",
  },

  // Tabs
  tabsWrap: {
    background: "var(--bg-card)",
    borderBottom: "1px solid var(--border)",
  },
  tabsInner: {
    maxWidth: 1100, margin: "0 auto",
    padding: "0 24px",
    display: "flex", gap: 0,
  },
  tabBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: "transparent", border: "none",
    borderBottom: "2px solid transparent",
    padding: "14px 18px",
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 14, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
    color: "var(--text-dim)",
    cursor: "pointer",
    transition: "color 180ms, border-color 180ms",
    marginBottom: -1,
  },
  tabActive: { color: "#F0EEF5", borderBottomColor: "#E5152E" },
  tabCount: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 11, fontWeight: 700,
    background: "rgba(255,255,255,0.07)",
    color: "var(--text-dim)",
    borderRadius: 4, padding: "1px 6px",
    minWidth: 20, textAlign: "center",
  },
  tabCountActive: { background: "rgba(229,21,46,0.15)", color: "#E5152E" },

  // Content
  content: {
    flex: 1,
    maxWidth: 1100, margin: "0 auto", width: "100%",
    padding: "32px 24px 64px",
  },

  // Empty state
  empty: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "80px 0",
  },
  emptyText: {
    marginTop: 16,
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 14, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase",
    color: "var(--text-dim)",
  },

  // Schedule
  roundHeader: {
    display: "flex", alignItems: "center", gap: 12,
    marginBottom: 12,
  },
  roundLabel: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
    color: "var(--text-dim)", whiteSpace: "nowrap",
  },
  roundLine: {
    flex: 1, height: 1, background: "var(--border)",
  },
  roundCount: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
    color: "var(--text-dim)",
  },
  matchRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr auto",
    alignItems: "center",
    gap: 12,
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "14px 18px",
    transition: "border-color 180ms",
  },
  matchRowDone: { borderColor: "rgba(255,255,255,0.1)" },
  matchTeam: { display: "flex", alignItems: "center" },
  matchTeamName: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 17, fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase",
    color: "var(--text-muted)",
    transition: "color 180ms",
  },
  matchWinner: { color: "#F0EEF5" },
  matchCenter: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    minWidth: 100,
  },
  matchScore: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 20, fontWeight: 900, letterSpacing: "0.04em",
    color: "var(--text-dim)",
    background: "var(--bg-raised)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "6px 16px",
  },
  matchScoreDone: { color: "#F0EEF5", borderColor: "var(--border-hi)" },
  matchDoneTag: {
    display: "flex", alignItems: "center", gap: 4,
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
    color: "#4ade80",
  },
  resultBtn: {
    background: "rgba(229,21,46,0.1)", border: "1px solid rgba(229,21,46,0.25)",
    borderRadius: 6, padding: "7px 14px",
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
    color: "#E5152E", cursor: "pointer",
    transition: "background 180ms",
    whiteSpace: "nowrap",
  },

  // Standings table
  tableWrap: { overflowX: "auto" },
  table: {
    width: "100%", borderCollapse: "collapse",
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 12, overflow: "hidden",
  },
  th: {
    padding: "12px 14px", textAlign: "center",
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "var(--text-dim)",
    background: "var(--bg-raised)",
    borderBottom: "1px solid var(--border)",
  },
  thPts: { color: "#F0A500" },
  td: {
    padding: "12px 14px", textAlign: "center",
    fontSize: 14, color: "var(--text-muted)",
    borderBottom: "1px solid var(--border)",
  },
  tdTeam: {
    textAlign: "left",
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 16, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase",
    color: "#F0EEF5",
  },
  tdPts: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 18, fontWeight: 900, color: "#F0A500",
  },
  trEven: { background: "rgba(255,255,255,0.02)" },
  posNum: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 14, fontWeight: 700, color: "var(--text-dim)",
  },
  posTop: {
    color: "#F0A500",
    textShadow: "0 0 8px rgba(240,165,0,0.4)",
  },

  // Teams
  teamsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))",
    gap: 12,
  },
  teamCard: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "18px 20px",
    position: "relative", overflow: "hidden",
  },
  teamNumber: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 48, fontWeight: 900, letterSpacing: "-0.02em",
    color: "rgba(255,255,255,0.04)",
    position: "absolute", top: 8, right: 12,
    lineHeight: 1,
  },
  teamName: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 18, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em",
    color: "#F0EEF5", marginBottom: 8, position: "relative",
  },
  teamPlayers: {
    display: "flex", alignItems: "center", gap: 5,
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
    color: "var(--text-dim)", position: "relative",
  },

  // Modal
  overlay: {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "var(--bg-card)", border: "1px solid var(--border-hi)",
    borderRadius: 18, padding: "32px",
    width: "100%", maxWidth: 400,
    boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
  },
  modalTag: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase",
    color: "var(--text-dim)", marginBottom: 16,
  },
  modalMatchup: {
    display: "flex", alignItems: "center", gap: 10,
    marginBottom: 28,
  },
  modalTeam: {
    flex: 1, textAlign: "center",
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 16, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em",
    color: "#F0EEF5",
  },
  modalVs: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 13, fontWeight: 700, letterSpacing: "0.1em",
    color: "var(--text-dim)",
  },
  scoreRow: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 12, marginBottom: 28,
  },
  scoreField: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  scoreTeamLabel: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "var(--text-dim)",
  },
  scoreInput: {
    width: 80, height: 80,
    textAlign: "center", fontSize: 36, fontWeight: 900,
    fontFamily: "'Barlow Condensed',sans-serif",
    background: "var(--bg-raised)", border: "1px solid var(--border-hi)",
    borderRadius: 12, color: "#F0EEF5",
    outline: "none", transition: "border-color 180ms",
  },
  scoreSep: {
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 32, fontWeight: 900, color: "var(--text-dim)",
    marginTop: 20,
  },
  modalBtns: { display: "flex", gap: 10 },
  cancelBtn: {
    flex: 1, background: "var(--bg-raised)",
    border: "1px solid var(--border)", borderRadius: 10,
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: 14, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
    color: "var(--text-muted)", padding: "12px", cursor: "pointer",
    transition: "border-color 180ms",
  },
};
