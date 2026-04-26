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

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.refreshToken);
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

// Single axios instance — base URL is set per-request from localStorage.
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

// ---- Refresh-on-401 with single-flight queueing ----
let refreshPromise = null;
const onLogoutHandlers = new Set();

export function onForcedLogout(fn) {
  onLogoutHandlers.add(fn);
  return () => onLogoutHandlers.delete(fn);
}
function triggerForcedLogout() {
  clearTokens();
  onLogoutHandlers.forEach((fn) => {
    try { fn(); } catch (_) { /* ignore */ }
  });
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  refreshPromise = axios
    .post(`${getApiBaseUrl()}/auth/refresh`, { refreshToken })
    .then((res) => {
      const { accessToken, refreshToken: newRefresh } = res.data || {};
      if (!accessToken) throw new Error("Bad refresh response");
      setTokens({ accessToken, refreshToken: newRefresh });
      return accessToken;
    })
    .finally(() => { refreshPromise = null; });

  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};
    const status = err.response?.status;
    const url = (original.url || "").toString();

    // Don't recurse on auth endpoints, and only retry once.
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/refresh");
    if (status === 401 && !original.__isRetry && !isAuthEndpoint && getRefreshToken()) {
      original.__isRetry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api.request(original);
      } catch (refreshErr) {
        triggerForcedLogout();
        return Promise.reject(refreshErr);
      }
    }

    if (status === 401 && !isAuthEndpoint) {
      triggerForcedLogout();
    }
    return Promise.reject(err);
  }
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
