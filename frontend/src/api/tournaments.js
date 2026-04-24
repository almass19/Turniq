import api from "./client";

export const getTournaments = () => api.get("/tournaments/");
export const getTournament = (id) => api.get(`/tournaments/${id}/`);
export const createTournament = (data) => api.post("/tournaments/", data);
export const addTeam = (tournamentId, data) =>
  api.post(`/tournaments/${tournamentId}/teams/`, data);
export const getTeams = (tournamentId) =>
  api.get(`/tournaments/${tournamentId}/teams/list/`);
export const generateSchedule = (tournamentId) =>
  api.post(`/tournaments/${tournamentId}/generate-schedule/`);
export const getSchedule = (tournamentId) =>
  api.get(`/tournaments/${tournamentId}/schedule/`);
export const getBracket = (tournamentId) =>
  api.get(`/tournaments/${tournamentId}/bracket/`);
export const getStandings = (tournamentId) =>
  api.get(`/tournaments/${tournamentId}/standings/`);
export const enterResult = (matchId, data) =>
  api.post(`/matches/${matchId}/result/`, data);
