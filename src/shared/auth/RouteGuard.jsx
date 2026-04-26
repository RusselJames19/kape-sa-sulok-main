// Role/auth gate for app routes. Shows login form when guest,
// shows access-denied when authed but lacking the required role,
// renders children otherwise. Pure UI logic — used by .tsx route shells.

import { useAuth } from "./AuthContext";
import LoginPage from "./LoginPage";
import AccessDenied from "./AccessDenied";
import LoadingScreen from "./LoadingScreen";

export default function RouteGuard({ appKey, children }) {
  const { status, isAuthenticated, canAccessApp } = useAuth();

  if (status === "loading") return <LoadingScreen />;
  if (!isAuthenticated) return <LoginPage />;
  if (appKey && !canAccessApp(appKey)) return <AccessDenied requiredApp={appKey} />;

  return children;
}
