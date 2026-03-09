import { useState } from "react";
import { createPortal } from "react-dom";
import { X, User, Mail, Shield, KeyRound, Check } from "lucide-react";

interface ProfileModalProps {
  name: string;
  email: string;
  role: string;
  onEmailChange: (email: string) => void;
  onClose: () => void;
}

export default function ProfileModal({ name, email, role, onEmailChange, onClose }: ProfileModalProps) {
  const [editEmail, setEditEmail] = useState(email);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  const emailChanged = editEmail.trim() !== email && editEmail.trim().length > 0;

  const handleSaveEmail = async () => {
    setEmailError("");
    setEmailSaving(true);
    try {
      const res = await fetch("/api/auth/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: editEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        onEmailChange(editEmail.trim());
        setEmailSaved(true);
        setTimeout(() => setEmailSaved(false), 2000);
      } else {
        setEmailError(data.error || "Failed to update email");
      }
    } catch {
      setEmailError("Failed to update email");
    }
    setEmailSaving(false);
  };

  const handleResetPassword = async () => {
    setResetError("");
    setResetSending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setResetSent(true);
      } else {
        setResetError(data.error || "Failed to send reset email");
      }
    } catch {
      setResetError("Failed to send reset email");
    }
    setResetSending(false);
  };

  const roleName = role === "admin" ? "Admin" : role === "editor" ? "Editor" : "Viewer";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-charcoal border border-border rounded-2xl shadow-2xl w-full max-w-md max-sm:max-w-none max-sm:max-h-none max-sm:h-full max-sm:rounded-none max-sm:overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-heading text-lg font-bold">Account Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name (read-only) */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-foreground-muted mb-1.5">
              <User className="w-3.5 h-3.5" /> Name
            </label>
            <div className="w-full bg-ink/50 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground-muted">
              {name}
            </div>
          </div>

          {/* Email (editable) */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-foreground-muted mb-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={editEmail}
                onChange={(e) => { setEditEmail(e.target.value); setEmailSaved(false); setEmailError(""); }}
                className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta"
              />
              {emailChanged && (
                <button
                  onClick={handleSaveEmail}
                  disabled={emailSaving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-magenta hover:bg-magenta/90 text-white transition-colors disabled:opacity-50"
                >
                  {emailSaving ? "..." : "Save"}
                </button>
              )}
              {emailSaved && (
                <span className="flex items-center gap-1 text-xs text-green-400 self-center">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>
            {emailError && <p className="text-xs text-red-400 mt-1.5">{emailError}</p>}
          </div>

          {/* Password (greyed out) */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-foreground-muted mb-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Password
            </label>
            <div className="w-full bg-ink/50 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground-muted/50">
              ••••••••••••
            </div>
          </div>

          {/* Account Type (read-only) */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-foreground-muted mb-1.5">
              <Shield className="w-3.5 h-3.5" /> Account Type
            </label>
            <div className="w-full bg-ink/50 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground-muted">
              {roleName}
            </div>
          </div>
        </div>

        {/* Reset Password */}
        <div className="px-6 py-4 border-t border-border">
          {resetSent ? (
            <p className="text-sm text-green-400 text-center">
              Password reset email sent to <strong>{email}</strong>. Check your inbox.
            </p>
          ) : (
            <>
              <button
                onClick={handleResetPassword}
                disabled={resetSending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-border text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                {resetSending ? "Sending..." : "Reset Password"}
              </button>
              <p className="text-[11px] text-foreground-muted/60 text-center mt-2">
                A password reset link will be sent to your email
              </p>
              {resetError && <p className="text-xs text-red-400 text-center mt-1.5">{resetError}</p>}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
