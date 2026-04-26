// Auth helpers — full implementation lands in Phase 2.
import { api, setTokens, clearTokens } from "./api";

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
  try {
    await api.post("/auth/logout");
  } catch (_) {
    // ignore — clear tokens anyway
  }
  clearTokens();
}

export async function me() {
  const res = await api.get("/auth/me");
  return res.data;
}
