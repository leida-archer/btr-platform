import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Kanban,
  Image,
  PartyPopper,
  Calculator,
  Settings,
  ExternalLink,
  LogOut,
  Search,
  Plus,
  ChevronDown,
} from "lucide-react";

const CONTENT_NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/calendar", icon: Calendar, label: "Calendar", disabled: true },
  { to: "/admin/pipeline", icon: Kanban, label: "Pipeline", disabled: true },
  { to: "/admin/assets", icon: Image, label: "Assets", disabled: true },
];

const EVENTS_NAV = [
  { to: "/admin/events", icon: PartyPopper, label: "Campaigns", disabled: true },
  { to: "/admin/calculator", icon: Calculator, label: "Calculator" },
];

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  end?: boolean;
  disabled?: boolean;
}

function SidebarGroup({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div>
      <p className="px-4 pt-4 pb-1 text-[10px] font-heading font-semibold uppercase tracking-widest text-slate">
        {label}
      </p>
      <nav className="space-y-1 px-2">
        {items.map(({ to, icon: Icon, label, disabled, ...rest }) =>
          disabled ? (
            <span
              key={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-muted/40 cursor-default select-none"
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
              <span className="ml-auto text-[9px] uppercase tracking-wider text-foreground-muted/30 font-heading">Soon</span>
            </span>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={"end" in rest}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-magenta/15 text-magenta"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface-hover"
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          )
        )}
      </nav>
    </div>
  );
}

export default function AdminShell({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await onLogout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-ink">
      <aside className="shrink-0 w-56 h-screen bg-charcoal border-r border-border flex flex-col overflow-hidden">
        <div className="flex items-center justify-center h-14 px-3 border-b border-border shrink-0">
          <img src="/logos/logo-on-dark.svg" alt="Beyond the Rhythm" className="h-8" />
        </div>

        <div className="flex-1 py-3 space-y-2 overflow-y-auto">
          <SidebarGroup label="Content" items={CONTENT_NAV} />
          <div className="mx-4 border-t border-border" />
          <SidebarGroup label="Events" items={EVENTS_NAV} />
        </div>

        <div className="border-t border-border py-3 px-3 space-y-1 shrink-0">
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>View Site</span>
          </a>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-magenta/15 text-magenta"
                  : "text-foreground-muted hover:text-foreground hover:bg-surface-hover"
              }`
            }
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="sticky top-0 z-30 bg-ink/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-4 h-14 px-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search posts..."
                className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta"
              />
            </div>

            <button className="hidden sm:flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground border border-border rounded-lg px-3 py-2 shrink-0">
              All Platforms <ChevronDown className="w-3 h-3" />
            </button>
            <button className="hidden sm:flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground border border-border rounded-lg px-3 py-2 shrink-0">
              All Statuses <ChevronDown className="w-3 h-3" />
            </button>
            <button className="hidden lg:flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground border border-border rounded-lg px-3 py-2 shrink-0">
              All Events <ChevronDown className="w-3 h-3" />
            </button>

            <button className="flex items-center gap-2 bg-magenta hover:bg-magenta/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Post</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
