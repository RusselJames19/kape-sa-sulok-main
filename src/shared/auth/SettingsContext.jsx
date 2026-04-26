// Project-wide system settings (business name, address, receipt footer, etc.).
// Lazily fetched once the user is authenticated; falls back to safe defaults
// before the request resolves so the UI never flashes empty headers.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { settingsService, SETTINGS_DEFAULTS } from "../services/settings";
import { useAuth } from "./AuthContext.jsx";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await settingsService.get();
      setSettings({ ...SETTINGS_DEFAULTS, ...data });
      setLoaded(true);
    } catch (_) {
      // Network/auth not ready — keep defaults silently.
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) refresh();
  }, [isAuthenticated, refresh]);

  const update = useCallback(async (patch) => {
    const next = await settingsService.update(patch);
    setSettings({ ...SETTINGS_DEFAULTS, ...next });
    return next;
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded, refresh, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
