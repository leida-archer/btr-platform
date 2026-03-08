import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  authenticated: boolean;
}

export default function LoginPage({ onLogin, authenticated }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const success = await onLogin(email, password);
    if (!success) {
      setError("Invalid credentials");
      setTimeout(() => setError(""), 3000);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-ink)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 50% 50% at 50% 40%, rgba(214,36,110,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 50% 60%, rgba(139,92,246,0.06) 0%, transparent 60%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 400,
          padding: "0 24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <img
            src="/logos/2e-ripple-on-dark.svg"
            alt="Beyond the Rhythm"
            style={{ width: 180, margin: "0 auto 24px" }}
          />
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.85rem",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "var(--color-slate)",
            }}
          >
            Team Portal
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta"
            />
          </div>

          {error && (
            <p
              style={{
                color: "#ff6b6b",
                fontSize: "0.85rem",
                textAlign: "center",
                marginBottom: 16,
                fontFamily: "var(--font-heading)",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn--gradient"
            style={{ width: "100%", padding: "14px 28px", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link
            to="/"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.8rem",
              color: "var(--color-slate)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              transition: "color 0.3s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-slate)")}
          >
            &larr; Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
