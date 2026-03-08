import { useState } from "react";
import { Plus, X, Shield, ShieldAlert, Eye } from "lucide-react";
import Dropdown from "../components/Dropdown";
import { useData } from "../context/DataContext";


const roleConfig = {
  admin: { label: "Admin", icon: ShieldAlert, color: "#D6246E", bg: "rgba(214,36,110,0.15)" },
  editor: { label: "Editor", icon: Shield, color: "#F2A922", bg: "rgba(242,169,34,0.15)" },
  viewer: { label: "Viewer", icon: Eye, color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
};

export default function AdminSettings({ role = "admin" }: { role?: string }) {
  const isAdmin = role === "admin";
  const { teamMembers, addTeamMember, removeTeamMember } = useData();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");

  const adminCount = teamMembers.filter((m) => m.role === "admin").length;

  const handleRemove = (id: string) => {
    const member = teamMembers.find((m) => m.id === id);
    if (member?.role === "admin" && adminCount <= 1) {
      alert("Cannot remove the last admin");
      return;
    }
    removeTeamMember(id);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    addTeamMember({ name: inviteName, email: inviteEmail, role: inviteRole });
    setInviteName("");
    setInviteEmail("");
    setShowInvite(false);
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Admin</h1>

      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-5 gap-4">
          <h2 className="font-heading text-lg font-semibold">Team Members</h2>
          <button
            onClick={() => isAdmin && setShowInvite(!showInvite)}
            disabled={!isAdmin}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
              isAdmin
                ? "bg-magenta hover:bg-magenta/90 text-white"
                : "bg-magenta/20 text-foreground-muted/50 cursor-not-allowed"
            }`}
          >
            {showInvite ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showInvite ? "Cancel" : "Invite Member"}
          </button>
        </div>

        {showInvite && (
          <form onSubmit={handleInvite} className="bg-ink/50 border border-border rounded-lg p-5 mb-5 space-y-4">
            <h3 className="font-heading text-sm font-semibold">Invite New Member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
                className="bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta"
              />
              <input
                type="email"
                placeholder="Email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta"
              />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Dropdown
                label="Role"
                options={[
                  { value: "editor", label: "Editor" },
                  { value: "viewer", label: "Viewer" },
                ]}
                value={inviteRole}
                onChange={(v) => setInviteRole(v as "editor" | "viewer")}
              />
              <button type="submit" className="bg-magenta hover:bg-magenta/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Send Invite
              </button>
            </div>
            <p className="text-xs text-foreground-muted">
              A temporary password will be generated. The member must change it on first login.
            </p>
          </form>
        )}

        <div className="space-y-2">
          {teamMembers.map((m) => {
            const rc = roleConfig[m.role];
            const RoleIcon = rc.icon;
            const isLastAdmin = m.role === "admin" && adminCount <= 1;
            return (
              <div key={m.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-heading font-bold shrink-0"
                  style={{ backgroundColor: rc.bg, color: rc.color }}
                >
                  {m.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs text-foreground-muted truncate mt-0.5">{m.email}</p>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0"
                  style={{ backgroundColor: rc.bg, color: rc.color }}
                >
                  <RoleIcon className="w-3 h-3" />
                  {rc.label}
                </span>
                {isAdmin && (
                  <div className="shrink-0 w-16 text-right">
                    {isLastAdmin ? (
                      <span className="text-xs text-foreground-muted">Protected</span>
                    ) : (
                      <button
                        onClick={() => handleRemove(m.id)}
                        className="text-xs text-foreground-muted hover:text-coral transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 p-4 rounded-lg bg-ink/50 border border-border">
          <p className="text-sm text-foreground-muted flex items-center gap-3 leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-magenta shrink-0" />
            The last remaining admin cannot be removed or demoted. This prevents accidental lockout.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 mt-6">
        <h2 className="font-heading text-lg font-semibold mb-5">Role Permissions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {(["admin", "editor", "viewer"] as const).map((role) => {
            const rc = roleConfig[role];
            const RoleIcon = rc.icon;
            const perms: Record<string, string[]> = {
              admin: ["Everything", "Manage team", "Delete events", "System settings"],
              editor: ["Create / edit posts", "Manage events", "Use calculator", "Upload assets"],
              viewer: ["View dashboard", "View calendar", "View pipeline", "Read-only access"],
            };
            return (
              <div key={role} className="p-5 rounded-lg bg-ink/50 border border-border">
                <div className="flex items-center gap-2.5 mb-4">
                  <RoleIcon className="w-4 h-4 shrink-0" style={{ color: rc.color }} />
                  <span className="font-heading font-semibold text-sm" style={{ color: rc.color }}>{rc.label}</span>
                </div>
                <ul className="space-y-3">
                  {perms[role].map((p) => (
                    <li key={p} className="text-sm text-foreground-muted flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: rc.color }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
