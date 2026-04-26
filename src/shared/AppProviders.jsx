// Root provider tree. Pure jsx so .tsx __root.tsx contains no logic.
import { AuthProvider } from "../shared/auth/AuthContext.jsx";
import { Toaster } from "@/components/ui/sonner";

export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      {children}
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
