import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, MapPin, Calendar, Users, DollarSign, ChevronRight, ChevronLeft, BarChart3, X, Trash2, Image, Film, FileText, Music, Pencil } from "lucide-react";
import Dropdown from "../components/Dropdown";
import EditPostModal, { type PostData, type AssetOption } from "../components/EditPostModal";
import EditAssetModal from "../components/EditAssetModal";
import { useData } from "../context/DataContext";
import { useIsViewer } from "../context/RoleContext";
import type { Campaign, Post, PostStatus, CampaignStatus, Asset, AssetType } from "../types/data";

const statusConfig = {
  active: { label: "Active", color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
  planning: { label: "Planning", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  upcoming: { label: "Upcoming", color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  completed: { label: "Completed", color: "#6B5E73", bg: "rgba(107,94,115,0.15)" },
};

const POST_STATUS_OPTIONS = [
  { key: "idea", label: "Idea", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
  { key: "allocated", label: "Allocated", color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  { key: "editing", label: "Editing", color: "#E8652B", bg: "rgba(232,101,43,0.15)" },
  { key: "approved", label: "Approved", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  { key: "posted", label: "Posted", color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
];

const postStatusConfig: Record<string, { label: string; color: string; bg: string }> = Object.fromEntries(
  POST_STATUS_OPTIONS.map((s) => [s.key, { label: s.label, color: s.color, bg: s.bg }])
);

const platformColors: Record<string, string> = {
  Instagram: "#E1306C", TikTok: "#00F2EA", X: "#FFFFFF", Reddit: "#FF4500", YouTube: "#FF0000",
};

const assetTypeConfig = {
  image: { icon: Image, color: "#E1306C", bg: "rgba(225,48,108,0.15)" },
  video: { icon: Film, color: "#00F2EA", bg: "rgba(0,242,234,0.15)" },
  document: { icon: FileText, color: "#F2A922", bg: "rgba(242,169,34,0.15)" },
  audio: { icon: Music, color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
};

const CAMPAIGN_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "planning", label: "Planning" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

// ── Date formatting helpers ──
// Store as display string "May 1, 2026"; input as MM/DD/YYYY
function dateToDisplay(mmddyyyy: string): string {
  const match = mmddyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return mmddyyyy;
  const dt = new Date(+match[3], +match[1] - 1, +match[2]);
  if (isNaN(dt.getTime())) return mmddyyyy;
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function displayToInput(display: string): string {
  const dt = new Date(display);
  if (isNaN(dt.getTime())) return "";
  return `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}/${dt.getFullYear()}`;
}

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// ── City suggestions ──
const CITY_SUGGESTIONS = [
  "San Diego, CA, US", "Los Angeles, CA, US", "San Francisco, CA, US", "Sacramento, CA, US",
  "Seattle, WA, US", "Portland, OR, US", "Phoenix, AZ, US", "Tucson, AZ, US",
  "Las Vegas, NV, US", "Denver, CO, US", "Salt Lake City, UT, US",
  "Austin, TX, US", "Dallas, TX, US", "Houston, TX, US", "San Antonio, TX, US",
  "Chicago, IL, US", "Detroit, MI, US", "Minneapolis, MN, US", "Milwaukee, WI, US",
  "Nashville, TN, US", "Memphis, TN, US", "Atlanta, GA, US", "Charlotte, NC, US",
  "Miami, FL, US", "Orlando, FL, US", "Tampa, FL, US",
  "New York, NY, US", "Brooklyn, NY, US", "Philadelphia, PA, US", "Boston, MA, US",
  "Washington, DC, US", "Baltimore, MD, US", "Pittsburgh, PA, US",
  "New Orleans, LA, US", "Kansas City, MO, US", "St. Louis, MO, US",
  "Honolulu, HI, US", "Anchorage, AK, US",
  "Toronto, ON, CA", "Vancouver, BC, CA", "Montreal, QC, CA",
  "London, UK", "Berlin, DE", "Amsterdam, NL", "Paris, FR", "Barcelona, ES",
  "Tokyo, JP", "Sydney, AU", "Melbourne, AU",
];

function CityInput({ value, onChange, className }: { value: string; onChange: (v: string) => void; className: string }) {
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    const q = value.toLowerCase();
    return CITY_SUGGESTIONS.filter((c) => c.toLowerCase().includes(q)).slice(0, 6);
  }, [value]);

  const showDropdown = focused && suggestions.length > 0;

  useEffect(() => { setActiveIdx(-1); }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i < suggestions.length - 1 ? i + 1 : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i > 0 ? i - 1 : suggestions.length - 1)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); onChange(suggestions[activeIdx]); setFocused(false); }
    else if (e.key === "Escape") { setFocused(false); }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onKeyDown={handleKeyDown}
        placeholder="City, State, Country" className={className}
      />
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-20 max-h-[200px] overflow-y-auto">
          {suggestions.map((s, i) => (
            <button key={s} type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(s); setFocused(false); }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm transition-colors ${activeIdx === i ? "bg-magenta/10" : "hover:bg-surface-hover"}`}>
              <MapPin className="w-3 h-3 text-foreground-muted shrink-0" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCampaigns() {
  const isViewer = useIsViewer();
  const { campaigns, assets, teamMembers, addCampaign, updateCampaign, deleteCampaign, updatePost, deletePost, updateAsset, deleteAsset, getPostsByCampaign, getAssetsByCampaign } = useData();

  const [view, setView] = useState<"list" | "detail">("list");
  const [activeId, setActiveId] = useState<string>("");

  // New campaign modal
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newHeadcount, setNewHeadcount] = useState(100);
  const [newBudget, setNewBudget] = useState(5000);

  // Edit campaign modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editVenue, setEditVenue] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editStatus, setEditStatus] = useState<CampaignStatus>("planning");
  const [editHeadcount, setEditHeadcount] = useState(100);
  const [editBudget, setEditBudget] = useState(5000);
  const [editTicketsSold, setEditTicketsSold] = useState(0);
  const [editTicketGoal, setEditTicketGoal] = useState(100);

  // Post/asset editing via shared modals
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const active = campaigns.find((c) => c.id === activeId);

  const eventOptions = useMemo(() => [
    { value: "", label: "None" },
    ...campaigns.map((c) => ({ value: c.name, label: c.name })),
  ], [campaigns]);

  const availableAssets: AssetOption[] = useMemo(
    () => assets.map((a) => ({ id: a.id, name: a.name, type: a.type, thumbnail: a.thumbnail })),
    [assets]
  );

  const assigneeOptions = useMemo(
    () => teamMembers.filter((m) => m.role !== "viewer").map((m) => ({ value: m.name, label: m.name })),
    [teamMembers]
  );

  // Posts and assets for the active campaign
  const campaignPosts = active ? getPostsByCampaign(active.id) : [];
  const campaignAssets = active ? getAssetsByCampaign(active.id) : [];

  const openCampaign = (c: Campaign) => { setActiveId(c.id); setView("detail"); };

  // ── Campaign CRUD ──
  const openNewCampaign = () => {
    setShowNewCampaign(true);
    setNewName(""); setNewDate(""); setNewCity(""); setNewHeadcount(100); setNewBudget(5000);
  };

  const createCampaign = () => {
    if (!newName.trim()) return;
    const displayDate = dateToDisplay(newDate) || newDate;
    const nc = addCampaign({
      name: newName, date: displayDate, venue: "TBD", city: newCity,
      status: "planning", headcount: newHeadcount, budget: newBudget, ticketsSold: 0,
      ticketGoal: newHeadcount,
    });
    setShowNewCampaign(false);
    openCampaign(nc);
  };

  const openEditModal = (c: Campaign) => {
    setEditingId(c.id);
    setEditName(c.name); setEditDate(displayToInput(c.date) || c.date); setEditVenue(c.venue); setEditCity(c.city);
    setEditStatus(c.status); setEditHeadcount(c.headcount); setEditBudget(c.budget);
    setEditTicketsSold(c.ticketsSold); setEditTicketGoal(c.ticketGoal);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const displayDate = dateToDisplay(editDate) || editDate;
    updateCampaign(editingId, {
      name: editName, date: displayDate, venue: editVenue, city: editCity,
      status: editStatus, headcount: editHeadcount, budget: editBudget,
      ticketsSold: editTicketsSold, ticketGoal: editTicketGoal,
    });
    setEditingId(null);
  };

  const handleDeleteCampaign = () => {
    if (!editingId) return;
    deleteCampaign(editingId);
    if (activeId === editingId) setView("list");
    setEditingId(null);
  };

  // ── Post CRUD ──
  const handleSavePost = (updated: PostData) => {
    if (!editingPost) return;
    updatePost(editingPost.id, {
      title: updated.title, platform: updated.platform, postType: updated.postType,
      status: updated.status as PostStatus, priority: updated.priority, assignee: updated.assignee,
      event: updated.event, scheduledDate: updated.scheduledDate, scheduledTime: updated.scheduledTime,
      caption: updated.caption, notes: updated.notes, tags: updated.tags, linkedAssetIds: updated.linkedAssetIds,
    });
    setEditingPost(null);
  };

  const handleDeletePost = () => {
    if (!editingPost) return;
    deletePost(editingPost.id);
    setEditingPost(null);
  };

  // ── Asset CRUD ──
  const handleSaveAsset = (updated: { name: string; tags: string[] }) => {
    if (!editingAsset) return;
    updateAsset(editingAsset.id, { name: updated.name, tags: updated.tags });
    setEditingAsset(null);
  };

  const handleDeleteAsset = () => {
    if (!editingAsset) return;
    deleteAsset(editingAsset.id);
    setEditingAsset(null);
  };

  const handleReplaceAsset = (file: File) => {
    if (!editingAsset) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const typeMap: Record<string, AssetType> = {
      jpg: "image", jpeg: "image", png: "image", gif: "image", svg: "image", webp: "image",
      mp4: "video", mov: "video", webm: "video",
      mp3: "audio", wav: "audio", ogg: "audio",
      pdf: "document", doc: "document", docx: "document", zip: "document",
    };
    const newType = typeMap[ext] ?? editingAsset.type;
    const isImage = newType === "image";
    const url = isImage ? URL.createObjectURL(file) : undefined;
    updateAsset(editingAsset.id, { name: file.name, type: newType, thumbnail: url });
    setEditingAsset({ ...editingAsset, name: file.name, type: newType, thumbnail: url });
  };

  const inputClass = "w-full bg-ink/50 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta";

  // ── Campaign Edit Modal ──
  function renderCampaignEditModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={() => setEditingId(null)} />
        <div className="relative bg-surface border border-border rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
            <h2 className="font-heading text-lg font-semibold">Edit Campaign</h2>
            <button onClick={() => setEditingId(null)} className="text-foreground-muted hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Name</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Date</label>
                <input type="text" value={editDate} onChange={(e) => setEditDate(formatDateInput(e.target.value))} placeholder="MM/DD/YYYY" maxLength={10} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Status</label>
                <Dropdown label="Status" options={CAMPAIGN_STATUS_OPTIONS} value={editStatus} onChange={(v) => setEditStatus(v as CampaignStatus)} fullWidth />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Venue</label>
                <input type="text" value={editVenue} onChange={(e) => setEditVenue(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">City</label>
                <CityInput value={editCity} onChange={setEditCity} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Headcount</label>
                <input type="number" value={editHeadcount} onChange={(e) => setEditHeadcount(+e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Budget</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground-muted pointer-events-none">$</span>
                  <input type="number" value={editBudget} onChange={(e) => setEditBudget(+e.target.value)} className={inputClass + " pl-7"} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Tickets Sold</label>
                <input type="number" value={editTicketsSold} onChange={(e) => setEditTicketsSold(+e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Ticket Goal</label>
                <input type="number" value={editTicketGoal} onChange={(e) => setEditTicketGoal(+e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveEdit} className="flex-1 bg-magenta hover:bg-magenta/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Save</button>
              <button onClick={handleDeleteCampaign} className="flex items-center gap-1.5 text-foreground-muted hover:text-coral border border-border rounded-lg px-3 py-2 text-sm transition-colors" title="Delete campaign">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderNewCampaignModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={() => setShowNewCampaign(false)} />
        <div className="relative bg-surface border border-border rounded-xl w-full max-w-lg">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-heading text-lg font-semibold">New Campaign</h2>
            <button onClick={() => setShowNewCampaign(false)} className="text-foreground-muted hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Campaign Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Be creative..." className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Date</label>
                <input type="text" value={newDate} onChange={(e) => setNewDate(formatDateInput(e.target.value))} placeholder="MM/DD/YYYY" maxLength={10} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">City</label>
                <CityInput value={newCity} onChange={setNewCity} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Headcount</label>
                <input type="number" value={newHeadcount} onChange={(e) => setNewHeadcount(+e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Budget</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground-muted pointer-events-none">$</span>
                  <input type="number" value={newBudget} onChange={(e) => setNewBudget(+e.target.value)} className={inputClass + " pl-7"} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowNewCampaign(false)} className="px-4 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors">Cancel</button>
              <button onClick={createCampaign} className="bg-magenta hover:bg-magenta/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Create Campaign</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── DETAIL VIEW ──
  if (view === "detail" && active) {
    const sc = statusConfig[active.status];
    const ticketPct = active.ticketGoal > 0 ? Math.round((active.ticketsSold / active.ticketGoal) * 100) : 0;
    const postedCount = campaignPosts.filter((p) => p.status === "posted").length;
    const postPct = campaignPosts.length > 0 ? Math.round((postedCount / campaignPosts.length) * 100) : 0;

    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setView("list")} className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> Campaigns
          </button>
          <div className="flex-1" />
          {!isViewer && (
            <button onClick={() => openEditModal(active)} className="flex items-center gap-2 text-sm text-foreground-muted hover:text-magenta border border-border rounded-lg px-3 py-1.5 transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <h1 className="font-heading text-2xl font-bold">{active.name}</h1>
          <span className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Calendar, label: "Date", value: active.date },
            { icon: MapPin, label: "Venue", value: `${active.venue} — ${active.city}` },
            { icon: Users, label: "Capacity", value: String(active.headcount) },
            { icon: DollarSign, label: "Budget", value: `$${active.budget.toLocaleString()}` },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-3.5 h-3.5 text-foreground-muted" />
                <span className="text-xs text-foreground-muted">{s.label}</span>
              </div>
              <p className="text-sm font-medium">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-3">Ticket Sales</h3>
            <div className="flex items-end justify-between mb-2">
              <span className="font-heading text-3xl font-bold gradient-text">{active.ticketsSold}</span>
              <span className="text-sm text-foreground-muted">/ {active.ticketGoal}</span>
            </div>
            <div className="h-2 rounded-full bg-ink overflow-hidden mb-1">
              <div className="h-full rounded-full transition-all" style={{ width: `${ticketPct}%`, background: "linear-gradient(90deg, #D6246E, #F2A922)" }} />
            </div>
            <p className="text-xs text-foreground-muted">{ticketPct}% of goal</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-3">Content Progress</h3>
            <div className="flex items-end justify-between mb-2">
              <span className="font-heading text-3xl font-bold gradient-text">{postedCount}</span>
              <span className="text-sm text-foreground-muted">/ {campaignPosts.length} posted</span>
            </div>
            {campaignPosts.length > 0 ? (
              <>
                <div className="h-2 rounded-full bg-ink overflow-hidden mb-1">
                  <div className="h-full rounded-full bg-violet transition-all" style={{ width: `${postPct}%` }} />
                </div>
                <p className="text-xs text-foreground-muted">{postPct}% complete</p>
              </>
            ) : (
              <p className="text-xs text-foreground-muted mt-2">No content planned yet</p>
            )}
          </div>
        </div>

        {/* Posts */}
        <div className="mb-6">
          <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-3">Linked Posts ({campaignPosts.length})</h2>
          {campaignPosts.length > 0 ? (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              {campaignPosts.map((post, i) => {
                const ps = postStatusConfig[post.status];
                return (
                  <div key={post.id} onClick={() => setEditingPost(post)}
                    className={`flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-ink/30 transition-colors ${i > 0 ? "border-t border-border" : ""}`}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: platformColors[post.platform] ?? "#fff" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-foreground-muted">{post.platform}</span>
                        <span className="text-[10px] text-foreground-muted capitalize">· {post.postType}</span>
                        <span className="text-[10px] text-foreground-muted">· {post.assignee}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: ps?.bg, color: ps?.color }}>{ps?.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <p className="text-sm text-foreground-muted">No posts linked to this campaign yet</p>
            </div>
          )}
        </div>

        {/* Assets */}
        <div>
          <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-3">Linked Assets ({campaignAssets.length})</h2>
          {campaignAssets.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {campaignAssets.map((asset) => {
                const tc = assetTypeConfig[asset.type];
                const TypeIcon = tc.icon;
                return (
                  <div key={asset.id} onClick={() => setEditingAsset(asset)}
                    className="bg-surface border border-border rounded-xl overflow-hidden cursor-pointer hover:border-magenta/30 transition-colors">
                    <div className="aspect-square bg-ink/50 flex items-center justify-center overflow-hidden">
                      {asset.thumbnail ? <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                        : <TypeIcon className="w-8 h-8" style={{ color: tc.color, opacity: 0.5 }} />}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{asset.name}</p>
                      <span className="text-[10px] text-foreground-muted">{asset.type}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <p className="text-sm text-foreground-muted">No assets linked to this campaign yet</p>
            </div>
          )}
        </div>

        {/* Modals */}
        {editingId && !isViewer && renderCampaignEditModal()}
        {editingPost && (
          <EditPostModal
            post={{
              title: editingPost.title, platform: editingPost.platform, postType: editingPost.postType,
              status: editingPost.status, priority: editingPost.priority, assignee: editingPost.assignee,
              event: editingPost.event, scheduledDate: editingPost.scheduledDate,
              scheduledTime: editingPost.scheduledTime, caption: editingPost.caption,
              notes: editingPost.notes, tags: editingPost.tags, linkedAssetIds: editingPost.linkedAssetIds,
            }}
            statusOptions={POST_STATUS_OPTIONS}
            onSave={handleSavePost}
            onDelete={handleDeletePost}
            onClose={() => setEditingPost(null)}
            availableAssets={availableAssets}
            eventOptions={eventOptions}
            assigneeOptions={assigneeOptions}
            readOnly={isViewer}
          />
        )}
        {editingAsset && (
          <EditAssetModal
            asset={{ name: editingAsset.name, type: editingAsset.type, tags: editingAsset.tags, thumbnail: editingAsset.thumbnail }}
            onSave={handleSaveAsset}
            onDelete={handleDeleteAsset}
            onClose={() => setEditingAsset(null)}
            onReplace={handleReplaceAsset}
            readOnly={isViewer}
          />
        )}
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="font-heading text-2xl font-bold">Campaigns</h1>
        {!isViewer && (
          <button onClick={openNewCampaign}
            className="flex items-center gap-2 bg-magenta hover:bg-magenta/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        )}
      </div>

      <div className="space-y-3">
        {campaigns.map((c) => {
          const cs = statusConfig[c.status];
          const cPosts = getPostsByCampaign(c.id);
          const postedCount = cPosts.filter((p) => p.status === "posted").length;
          const cAssets = getAssetsByCampaign(c.id);
          return (
            <div key={c.id} onClick={() => openCampaign(c)}
              className="w-full text-left bg-surface border border-border rounded-xl p-5 transition-colors cursor-pointer hover:border-magenta/20">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-heading text-base font-semibold">{c.name}</h3>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-medium shrink-0" style={{ backgroundColor: cs.bg, color: cs.color }}>{cs.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-foreground-muted flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.date}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.headcount} cap</span>
                    <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />{postedCount}/{cPosts.length} posts</span>
                    <span className="flex items-center gap-1"><Image className="w-3 h-3" />{cAssets.length} assets</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 shrink-0 text-foreground-muted/30" />
              </div>
              {c.ticketGoal > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-foreground-muted mb-1">
                    <span>Tickets: {c.ticketsSold} / {c.ticketGoal}</span>
                    <span>{Math.round((c.ticketsSold / c.ticketGoal) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ink overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(c.ticketsSold / c.ticketGoal) * 100}%`, background: "linear-gradient(90deg, #D6246E, #F2A922)" }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingId && !isViewer && renderCampaignEditModal()}
      {showNewCampaign && !isViewer && renderNewCampaignModal()}
    </div>
  );
}
