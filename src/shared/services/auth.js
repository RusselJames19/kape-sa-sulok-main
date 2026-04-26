// Auth helpers used by the AuthContext.
import { api, setTokens, clearTokens, getAccessToken, getRefreshToken } from "./api";

export async function login(username, password) {
  const res = await api.post("/auth/login", { username, password });
  if (res.data?.accessToken) {
    setTokens({
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    });
  }
  return res.data;
}

export async function logout() {
  const refreshToken = getRefreshToken();
  try {
    await api.post("/auth/logout", { refreshToken });
  } catch (_) {
    // ignore — clear tokens anyway
  }
  clearTokens();
}

export async function me() {
  const res = await api.get("/auth/me");
  return res.data;
}

export function hasStoredSession() {
  return Boolean(getAccessToken());
}
