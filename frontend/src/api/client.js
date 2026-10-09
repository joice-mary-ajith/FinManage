import axios from "axios";

export const TOKEN_KEY = "finmanage_token";
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api/v1" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired/invalid token or a deactivated account on an authenticated request logs the user out (AuthContext listens for this event).
api.interceptors.response.use((res) => res, (err) => {
  const { response, config } = err;
  const hadToken = Boolean(config?.headers?.Authorization);
  const deactivated = response?.status === 403 && /deactivated/i.test(response.data?.message || "");
  if (hadToken && (response?.status === 401 || deactivated)) { localStorage.removeItem(TOKEN_KEY); window.dispatchEvent(new Event("auth:logout")); }
  return Promise.reject(err);
});

// Turns any axios error into a readable string for the UI.
export const errMsg = (err) => err.response?.data?.message || (err.request ? "Cannot reach the server. Is the backend running?" : "Something went wrong");

export default api;
