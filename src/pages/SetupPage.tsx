import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function SetupPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "done" | "invalid">("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    fetch(`/api/auth/setup?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setName(data.name);
          setEmail(data.email);
          setStatus(data.hasPassword ? "done" : "ready");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("done");
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong");
    }
    setSubmitting(false);
  };

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--color-ink)",
    position: "relative",
    overflow: "hidden",
  };

  const bgStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(ellipse 50% 50% at 50% 40%, rgba(214,36,110,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 50% 60%, rgba(139,92,246,0.06) 0%, transparent 60%)",
  };

  const cardStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 400,
    padding: "0 24px",
  };

  if (status === "loading") {
    return (
      <div style={containerStyle}>
        <div style={bgStyle} />
        <div style={{ ...cardStyle, textAlign: "center", color: "var(--color-slate)" }}>
          Validating invite...
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div style={containerStyle}>
        <div style={bgStyle} />
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <p style={{ color: "#ff6b6b", fontSize: "1rem", marginBottom: 16 }}>
            This invite link is invalid or expired.
          </p>
          <Link
            to="/login"
            style={{ color: "var(--color-slate)", fontFamily: "var(--font-heading)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            Go to login &rarr;
          </Link>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div style={containerStyle}>
        <div style={bgStyle} />
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <img src="/logos/8c-option-a-orange-waveform.svg" alt="Beyond the Rhythm" style={{ width: 180, margin: "0 auto 24px" }} />
          <p style={{ color: "var(--color-mist)", fontSize: "1.1rem", marginBottom: 8, fontFamily: "var(--font-heading)" }}>
            You're all set, {name}!
          </p>
          <p style={{ color: "var(--color-slate)", fontSize: "0.85rem", marginBottom: 24 }}>
            Your password has been set. You can now sign in.
          </p>
          <Link to="/login" className="btn btn--gradient" style={{ display: "inline-block", padding: "14px 32px", textDecoration: "none" }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={bgStyle} />
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <img src="/logos/8c-option-a-orange-waveform.svg" alt="Beyond the Rhythm" style={{ width: 180, margin: "0 auto 24px" }} />
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.85rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-slate)" }}>
            Set Up Your Account
          </p>
        </div>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ color: "var(--color-mist)", fontSize: "1rem", margin: 0 }}>Welcome, {name}</p>
          <p style={{ color: "var(--color-slate)", fontSize: "0.85rem", margin: "4px 0 0" }}>{email}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta"
            />
          </div>

          {error && (
            <p style={{ color: "#ff6b6b", fontSize: "0.85rem", textAlign: "center", marginBottom: 16, fontFamily: "var(--font-heading)" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn btn--gradient" style={{ width: "100%", padding: "14px 28px", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Setting up..." : "Set Password"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 16, color: "var(--color-slate)", fontSize: "0.75rem" }}>
          Minimum 8 characters
        </p>
      </div>
    </div>
  );
}
