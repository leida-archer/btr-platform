import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { DataProvider } from "./context/DataContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SetupPage from "./pages/SetupPage";
import AdminShell from "./components/AdminShell";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCalculator from "./pages/AdminCalculator";
import AdminCalendar from "./pages/AdminCalendar";
import AdminPipeline from "./pages/AdminPipeline";
import AdminAssets from "./pages/AdminAssets";
import AdminCampaigns from "./pages/AdminCampaigns";
import AdminSettings from "./pages/AdminSettings";
import { RoleProvider } from "./context/RoleContext";

const STATIC_PREVIEW = import.meta.env.VITE_STATIC_PREVIEW === "true";

function ProtectedRoute({
  authenticated,
  loading,
  children,
}: {
  authenticated: boolean;
  loading: boolean;
  children: React.ReactNode;
}) {
  if (STATIC_PREVIEW) return <>{children}</>;
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-ink">
        <div className="text-foreground-muted text-sm font-heading">Loading...</div>
      </div>
    );
  }
  return authenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { authenticated, loading, login, logout, role, name, email, setEmail } = useAuth();
  const effectiveRole = STATIC_PREVIEW ? "admin" : role;
  const Router = STATIC_PREVIEW ? HashRouter : BrowserRouter;

  return (
    <Router>
      <Routes>
        <Route path="/" element={STATIC_PREVIEW ? <Navigate to="/admin" replace /> : <LandingPage />} />
        <Route path="/login" element={<LoginPage onLogin={login} authenticated={authenticated} />} />
        <Route path="/setup" element={<SetupPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute authenticated={authenticated} loading={loading}>
              <RoleProvider role={effectiveRole}>
                <DataProvider>
                  <AdminShell onLogout={logout} role={effectiveRole} userName={name} userEmail={email} onEmailChange={setEmail} />
                </DataProvider>
              </RoleProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="calendar" element={<AdminCalendar />} />
          <Route path="pipeline" element={<AdminPipeline />} />
          <Route path="assets" element={<AdminAssets />} />
          <Route path="events" element={<AdminCampaigns />} />
          <Route path="calculator" element={<AdminCalculator />} />
          <Route path="settings" element={<AdminSettings role={effectiveRole} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
