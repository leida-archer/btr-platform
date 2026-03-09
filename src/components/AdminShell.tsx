import { useState, useRef, useEffect, useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Kanban,
  File,
  Image,
  PartyPopper,
  Calculator,
  Settings,
  UserCircle,
  ExternalLink,
  LogOut,
  Search,
  FileText,
  Film,
  Music,
  Hash,
  MapPin,
} from "lucide-react";
import { FilterProvider, useFilters } from "../context/FilterContext";
import { useData } from "../context/DataContext";
import ProfileModal from "./ProfileModal";

const CONTENT_NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/calendar", icon: Calendar, label: "Calendar" },
  { to: "/admin/pipeline", icon: Kanban, label: "Pipeline" },
  { to: "/admin/assets", icon: File, label: "Assets" },
];

const EVENTS_NAV = [
  { to: "/admin/events", icon: PartyPopper, label: "Campaigns" },
  { to: "/admin/calculator", icon: Calculator, label: "Ticket Calculator" },
];

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  end?: boolean;
}

function SidebarGroup({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div>
      <p className="px-4 pt-4 pb-1 text-[10px] font-heading font-semibold uppercase tracking-widest text-slate">
        {label}
      </p>
      <nav className="space-y-1 px-2">
        {items.map(({ to, icon: Icon, label, ...rest }) => (
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
        ))}
      </nav>
    </div>
  );
}

interface SearchItem {
  label: string;
  sublabel: string;
  path: string;
  icon: typeof LayoutDashboard;
  iconColor?: string;
  category: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#E1306C", TikTok: "#00F2EA", X: "#FFFFFF", Reddit: "#FF4500", YouTube: "#FF0000",
};
const ASSET_TYPE_ICONS: Record<string, { icon: typeof Image; color: string }> = {
  image: { icon: Image, color: "#E1306C" },
  video: { icon: Film, color: "#00F2EA" },
  document: { icon: FileText, color: "#F2A922" },
  audio: { icon: Music, color: "#8B5CF6" },
};
const STATUS_COLORS: Record<string, string> = {
  active: "#22C55E", planning: "#F59E0B", upcoming: "#3B82F6", completed: "#8B5CF6",
};


function useSearchIndex(): SearchItem[] {
  const { campaigns, posts, assets } = useData();
  return useMemo(() => {
    const campaignItems: SearchItem[] = campaigns.map((c) => ({
      label: c.name,
      sublabel: `${c.date} · ${c.status.charAt(0).toUpperCase() + c.status.slice(1)}`,
      path: "/admin/events",
      icon: MapPin,
      iconColor: STATUS_COLORS[c.status] ?? "#3B82F6",
      category: "Campaigns",
    }));
    const postItems: SearchItem[] = posts.map((p) => ({
      label: p.title,
      sublabel: `${p.platform} · ${p.status.charAt(0).toUpperCase() + p.status.slice(1)}`,
      path: "/admin/pipeline",
      icon: Hash,
      iconColor: PLATFORM_COLORS[p.platform] ?? "#FFFFFF",
      category: "Posts",
    }));
    const assetItems: SearchItem[] = assets.map((a) => {
      const tc = ASSET_TYPE_ICONS[a.type] ?? { icon: FileText, color: "#F2A922" };
      return {
        label: a.name,
        sublabel: `${a.type.charAt(0).toUpperCase() + a.type.slice(1)} · ${a.tags.join(", ")}`,
        path: "/admin/assets",
        icon: tc.icon,
        iconColor: tc.color,
        category: "Assets",
      };
    });
    return [...campaignItems, ...postItems, ...assetItems];
  }, [campaigns, posts, assets]);
}

function TopBar({ userName, userEmail, userRole, onEmailChange }: { userName: string; userEmail: string; userRole: string; onEmailChange: (email: string) => void }) {
  const { search, setSearch, submitSearch } = useFilters();
  const searchIndex = useSearchIndex();
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [showProfile, setShowProfile] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return searchIndex.filter(
      (item) => item.label.toLowerCase().includes(q) || item.sublabel.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [search, searchIndex]);

  const showDropdown = focused && search.trim().length > 0 && results.length > 0;

  useEffect(() => { setActiveIdx(-1); }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: SearchItem) => {
    navigate(item.path);
    setSearch("");
    setFocused(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && showDropdown) {
        handleSelect(results[activeIdx]);
      } else if (search.trim()) {
        submitSearch();
        setFocused(false);
        inputRef.current?.blur();
      }
      return;
    }
    if (e.key === "Escape") {
      setFocused(false);
      return;
    }
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i > 0 ? i - 1 : results.length - 1));
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, SearchItem[]>();
    for (const r of results) {
      const arr = map.get(r.category) ?? [];
      arr.push(r);
      map.set(r.category, arr);
    }
    return map;
  }, [results]);

  let flatIdx = -1;

  return (
    <header className="sticky top-0 z-30 bg-ink/80 backdrop-blur-sm border-b border-border h-14 shrink-0">
      <div className="flex items-center h-full px-6">
        <div ref={wrapperRef} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search posts, assets, campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta"
          />
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-[360px] overflow-y-auto">
              {[...grouped.entries()].map(([category, items]) => (
                <div key={category}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-heading font-semibold uppercase tracking-widest text-foreground-muted">
                    {category}
                  </p>
                  {items.map((item) => {
                    flatIdx++;
                    const idx = flatIdx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label + item.sublabel}
                        onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                          activeIdx === idx ? "bg-magenta/10" : "hover:bg-surface-hover"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" style={{ color: item.iconColor ?? "var(--color-foreground-muted)" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          <p className="text-[10px] text-foreground-muted truncate">{item.sublabel}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          {focused && search.trim().length > 0 && results.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
              <p className="px-4 py-4 text-sm text-foreground-muted text-center">No results found</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowProfile(true)}
          className="ml-auto p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          title="Account settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
      {showProfile && (
        <ProfileModal
          name={userName}
          email={userEmail}
          role={userRole}
          onEmailChange={onEmailChange}
          onClose={() => setShowProfile(false)}
        />
      )}
    </header>
  );
}

function SearchResultsPage() {
  const { searchQuery, clearSearch } = useFilters();
  const searchIndex = useSearchIndex();
  const navigate = useNavigate();

  const allResults = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return searchIndex.filter(
      (item) => item.label.toLowerCase().includes(q) || item.sublabel.toLowerCase().includes(q)
    );
  }, [searchQuery, searchIndex]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchItem[]>();
    for (const r of allResults) {
      const arr = map.get(r.category) ?? [];
      arr.push(r);
      map.set(r.category, arr);
    }
    return map;
  }, [allResults]);

  const handleClick = (item: SearchItem) => {
    clearSearch();
    navigate(item.path);
  };

  const highlight = (text: string) => {
    const q = searchQuery.toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-magenta font-semibold">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Search Results</h1>
          <p className="text-sm text-foreground-muted mt-1">
            {allResults.length} result{allResults.length !== 1 ? "s" : ""} for "<span className="text-foreground">{searchQuery}</span>"
          </p>
        </div>
        <button
          onClick={clearSearch}
          className="text-sm text-foreground-muted hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors shrink-0"
        >
          Clear
        </button>
      </div>

      {allResults.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <Search className="w-10 h-10 text-foreground-muted/30 mx-auto mb-4" />
          <p className="text-foreground-muted">No results found for "{searchQuery}"</p>
          <p className="text-xs text-foreground-muted mt-2">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([category, items]) => (
            <div key={category}>
              <p className="text-[10px] font-heading font-semibold uppercase tracking-widest text-foreground-muted mb-2 px-1">
                {category} ({items.length})
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label + item.sublabel}
                      onClick={() => handleClick(item)}
                      className="flex items-start gap-4 w-full text-left p-4 rounded-xl bg-surface border border-border hover:border-magenta/30 transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: (item.iconColor ?? "#8B5CF6") + "20" }}
                      >
                        <Icon className="w-4 h-4" style={{ color: item.iconColor ?? "var(--color-foreground-muted)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{highlight(item.label)}</p>
                        <p className="text-xs text-foreground-muted mt-0.5">{highlight(item.sublabel)}</p>
                        <p className="text-[10px] text-foreground-muted/60 mt-1.5">{item.path}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MainContent() {
  const { searchQuery } = useFilters();
  return (
    <main className="flex-1 overflow-y-scroll p-6">
      {searchQuery ? <SearchResultsPage /> : <Outlet />}
    </main>
  );
}

export default function AdminShell({ onLogout, role, userName, userEmail, onEmailChange }: { onLogout: () => void; role: string; userName: string; userEmail: string; onEmailChange: (email: string) => void }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await onLogout();
    navigate("/login");
  };

  return (
    <FilterProvider>
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
              <UserCircle className="w-4 h-4 shrink-0" />
              <span>Admin</span>
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
          <TopBar userName={userName} userEmail={userEmail} userRole={role} onEmailChange={onEmailChange} />
          <MainContent />
        </div>
      </div>
    </FilterProvider>
  );
}
