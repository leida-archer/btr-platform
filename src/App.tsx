import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminShell from "./components/AdminShell";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCalculator from "./pages/AdminCalculator";
import AdminSettings from "./pages/AdminSettings";

function ProtectedRoute({
  authenticated,
  loading,
  children,
}: {
  authenticated: boolean;
  loading: boolean;
  children: React.ReactNode;
}) {
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
  const { authenticated, loading, login, logout } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLogin={login} authenticated={authenticated} />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute authenticated={authenticated} loading={loading}>
              <AdminShell onLogout={logout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="calculator" element={<AdminCalculator />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
