// Centralized Axios instance for all 4 apps.
// Base URL is read from localStorage so users can change it via the
// Settings page without rebuilding. Falls back to a sensible default.

import axios from "axios";

const STORAGE_KEYS = {
  baseUrl: "ksu.apiBaseUrl",
  accessToken: "ksu.accessToken",
  refreshToken: "ksu.refreshToken",
};

const DEFAULT_BASE_URL = "http://localhost/api";

export function getApiBaseUrl() {
  if (typeof window === "undefined") return DEFAULT_BASE_URL;
  return localStorage.getItem(STORAGE_KEYS.baseUrl) || DEFAULT_BASE_URL;
}

export function setApiBaseUrl(url) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.baseUrl, url);
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

export function setTokens({ accessToken, refreshToken }) {
  if (typeof window === "undefined") return;
  if (accessToken) localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
}

// Build a fresh axios instance per request so the base URL stays in sync
// with whatever the user sets in the Settings page.
export const api = axios.create();

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh-on-401 will be wired in Phase 2 once /auth/refresh returns real tokens.
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

// Connection test — used by the Settings page indicator.
export async function pingServer() {
  const start = Date.now();
  try {
    const res = await api.get("/ping", { timeout: 4000 });
    return { ok: true, latencyMs: Date.now() - start, data: res.data };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - start, error: e?.message || "Network error" };
  }
}

export { STORAGE_KEYS };
