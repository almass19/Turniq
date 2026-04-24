import api from "./client";

export const login = (data) => api.post("/auth/token/", data);
export const register = (data) => api.post("/register/", data);
