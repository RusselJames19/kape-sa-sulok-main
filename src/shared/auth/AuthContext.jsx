import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { login as apiLogin, logout as apiLogout, me as apiMe, hasStoredSession } from "../services/auth";
import { onForcedLogout } from "../services/api";
import { APP_ACCESS } from "../constants/roles";
import { can as canPermission } from "../constants/permissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // 'loading' | 'authed' | 'guest'
  const [error, setError] = useState(null);

  const refreshMe = useCallback(async () => {
    if (!hasStoredSession()) {
      setUser(null);
      setStatus("guest");
      return null;
    }
    try {
      const data = await apiMe();
      setUser(data?.user || null);
      setStatus(data?.user ? "authed" : "guest");
      return data?.user || null;
    } catch (_) {
      setUser(null);
      setStatus("guest");
      return null;
    }
  }, []);

  useEffect(() => {
    refreshMe();
    const unsub = onForcedLogout(() => {
      setUser(null);
      setStatus("guest");
    });
    return unsub;
  }, [refreshMe]);

  const login = useCallback(async (username, password) => {
    setError(null);
    try {
      const data = await apiLogin(username, password);
      setUser(data?.user || null);
      setStatus("authed");
      return data?.user || null;
    } catch (e) {
      const msg = e?.response?.data?.message || "Invalid username or password";
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setStatus("guest");
  }, []);

  const hasRole = useCallback(
    (...roles) => Boolean(user && roles.includes(user.role)),
    [user]
  );
  const canAccessApp = useCallback(
    (appKey) => Boolean(user && (APP_ACCESS[appKey] || []).includes(user.role)),
    [user]
  );
  const can = useCallback(
    (permission) => Boolean(user && canPermission(user.role, permission)),
    [user]
  );

  const value = {
    user,
    status,
    isAuthenticated: status === "authed" && Boolean(user),
    isLoading: status === "loading",
    error,
    login,
    logout,
    refreshMe,
    hasRole,
    canAccessApp,
    can,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
