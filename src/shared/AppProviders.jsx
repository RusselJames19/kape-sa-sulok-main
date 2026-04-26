// Root provider tree. Pure jsx so .tsx __root.tsx contains no logic.
import { AuthProvider } from "./auth/AuthContext.jsx";
import { SettingsProvider } from "./auth/SettingsContext.jsx";
import { Toaster } from "@/components/ui/sonner";

export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        {children}
        <Toaster richColors position="top-right" />
      </SettingsProvider>
    </AuthProvider>
  );
}
