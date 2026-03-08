import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { Asset, Post, Campaign, CalculatorEvent, TeamMember, PostStatus } from "../types/data";

// ── Fallback seed data (used when API is unavailable, e.g. local dev without DB) ──

const SEED_ASSETS: Asset[] = [
  { id: "a1", name: "FIT_Social_Sunset.jpg", type: "image", size: "2.4 MB", date: "Feb 15", tags: ["venue", "san-diego"], thumbnail: "/images/venue/FIT_Social_Sunset.jpg" },
  { id: "a2", name: "Chmura_Press_Photo.jpg", type: "image", size: "1.8 MB", date: "Feb 10", tags: ["artist", "chmura"], thumbnail: "/images/artists/Chmura.jpg" },
  { id: "a3", name: "Saturna_Press_Photo.jpg", type: "image", size: "1.6 MB", date: "Feb 10", tags: ["artist", "saturna"], thumbnail: "/images/artists/Saturna.jpg" },
  { id: "a4", name: "Seattle_2025_001.jpg", type: "image", size: "3.1 MB", date: "Jan 28", tags: ["gallery", "seattle"], thumbnail: "/images/gallery/IMG_9559.jpg" },
  { id: "a5", name: "Seattle_2025_002.jpg", type: "image", size: "2.8 MB", date: "Jan 28", tags: ["gallery", "seattle"], thumbnail: "/images/gallery/IMG_9560.jpg" },
  { id: "a6", name: "Seattle_2025_003.jpg", type: "image", size: "2.5 MB", date: "Jan 28", tags: ["gallery", "seattle"], thumbnail: "/images/gallery/IMG_9561.jpg" },
  { id: "a7", name: "Seattle_2025_004.jpg", type: "image", size: "3.3 MB", date: "Jan 28", tags: ["gallery", "seattle"], thumbnail: "/images/gallery/IMG_9562.jpg" },
  { id: "a8", name: "logo-on-dark.svg", type: "image", size: "12 KB", date: "Jan 15", tags: ["logo", "brand"], thumbnail: "/logos/logo-on-dark.svg" },
  { id: "a9", name: "btr-waveform-orange.svg", type: "image", size: "8 KB", date: "Jan 15", tags: ["logo", "brand", "hero"], thumbnail: "/logos/2e-ripple-on-dark.svg" },
  { id: "a10", name: "ripple-mono.svg", type: "image", size: "4 KB", date: "Jan 15", tags: ["icon", "brand"], thumbnail: "/icons/2-ripple-mono.svg" },
];

const SEED_TEAM: TeamMember[] = [];

// ── Helper: fetch JSON, fall back to seed on error ──

async function fetchOr<T>(url: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(url);
    if (!r.ok) return fallback;
    return await r.json();
  } catch {
    return fallback;
  }
}

/** Merge seed items with DB items — seed items with matching IDs are replaced by DB versions */
function mergeWithSeed<T extends { id: string }>(dbItems: T[], seed: T[]): T[] {
  const dbIds = new Set(dbItems.map((d) => d.id));
  const kept = seed.filter((s) => !dbIds.has(s.id));
  return [...kept, ...dbItems];
}

// ── Helper: fire-and-forget API call (optimistic UI) ──

function api(url: string, method: string, body?: unknown) {
  const opts: RequestInit = { method };
  if (body !== undefined) {
    opts.headers = { "Content-Type": "application/json" };
    opts.body = JSON.stringify(body);
  }
  fetch(url, opts).catch(console.error);
}

// ── Context Shape ──

interface DataContextValue {
  campaigns: Campaign[];
  posts: Post[];
  assets: Asset[];
  calculatorEvents: CalculatorEvent[];
  teamMembers: TeamMember[];

  addCampaign: (c: Omit<Campaign, "id">) => Campaign;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;

  addPost: (p: Omit<Post, "id">) => Post;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;

  addAsset: (a: Omit<Asset, "id">) => Asset;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  updateCalculatorEvent: (name: string, state: CalculatorEvent) => void;

  addTeamMember: (m: Omit<TeamMember, "id">) => void;
  removeTeamMember: (id: string) => void;

  getPostsByCampaign: (campaignId: string) => Post[];
  getPostsByStatus: (status: PostStatus) => Post[];
  getAssetsByCampaign: (campaignId: string) => Asset[];
  getCampaignNames: () => string[];
}

const DataContext = createContext<DataContextValue | null>(null);

// ── Provider ──

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [assets, setAssets] = useState<Asset[]>(SEED_ASSETS);
  const [calculatorEvents, setCalculatorEvents] = useState<CalculatorEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(SEED_TEAM);

  // Track when the last local mutation happened so we don't overwrite optimistic state
  const lastMutation = useRef(0);
  const markMutation = () => { lastMutation.current = Date.now(); };

  // Fetch all data from API
  const fetchAll = useCallback(async (skipIfRecentMutation = false) => {
    // Don't overwrite optimistic state if a mutation happened within the last 3s
    if (skipIfRecentMutation && Date.now() - lastMutation.current < 3000) return;
    const [c, p, dbAssets, ce, dbTeam] = await Promise.all([
      fetchOr("/api/campaigns", [] as Campaign[]),
      fetchOr("/api/posts", [] as Post[]),
      fetchOr("/api/assets", [] as Asset[]),
      fetchOr("/api/calculator", [] as CalculatorEvent[]),
      fetchOr("/api/team", [] as TeamMember[]),
    ]);
    // Double-check: skip if a mutation snuck in during the fetch
    if (skipIfRecentMutation && Date.now() - lastMutation.current < 3000) return;
    setCampaigns(c);
    setPosts(p);
    setAssets(mergeWithSeed(dbAssets, SEED_ASSETS));
    setCalculatorEvents(ce);
    setTeamMembers(mergeWithSeed(dbTeam, SEED_TEAM));
  }, []);

  // Fetch on mount + poll every 15s
  useEffect(() => {
    fetchAll(false);
    const id = setInterval(() => fetchAll(true), 15000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // ── Campaign mutations ──
  const addCampaign = useCallback((c: Omit<Campaign, "id">) => {
    markMutation();
    const tempId = `temp-${Date.now()}`;
    const optimistic = { ...c, id: tempId };
    setCampaigns((prev) => [...prev, optimistic]);
    fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c),
    })
      .then((r) => r.json())
      .then((saved: Campaign) => {
        setCampaigns((prev) => prev.map((x) => (x.id === tempId ? saved : x)));
      })
      .catch(console.error);
    return optimistic;
  }, []);

  const updateCampaign = useCallback((id: string, updates: Partial<Campaign>) => {
    markMutation();
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    api(`/api/campaigns?id=${id}`, "PATCH", updates);
  }, []);

  const deleteCampaign = useCallback((id: string) => {
    markMutation();
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    setPosts((prev) => prev.map((p) => (p.campaignId === id ? { ...p, campaignId: undefined } : p)));
    api(`/api/campaigns?id=${id}`, "DELETE");
  }, []);

  // ── Post mutations ──
  const addPost = useCallback((p: Omit<Post, "id">) => {
    markMutation();
    const tempId = `temp-${Date.now()}`;
    const optimistic = { ...p, id: tempId } as Post;
    setPosts((prev) => [...prev, optimistic]);
    fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    })
      .then((r) => r.json())
      .then((saved: Post) => {
        setPosts((prev) => prev.map((x) => (x.id === tempId ? saved : x)));
      })
      .catch(console.error);
    return optimistic;
  }, []);

  const updatePost = useCallback((id: string, updates: Partial<Post>) => {
    markMutation();
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    api(`/api/posts?id=${id}`, "PATCH", updates);
  }, []);

  const deletePost = useCallback((id: string) => {
    markMutation();
    setPosts((prev) => prev.filter((p) => p.id !== id));
    api(`/api/posts?id=${id}`, "DELETE");
  }, []);

  // ── Asset mutations ──
  const addAsset = useCallback((a: Omit<Asset, "id">) => {
    markMutation();
    const tempId = `temp-${Date.now()}`;
    const optimistic = { ...a, id: tempId } as Asset;
    setAssets((prev) => [optimistic, ...prev]);
    fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(a),
    })
      .then((r) => r.json())
      .then((saved: Asset) => {
        setAssets((prev) => prev.map((x) => (x.id === tempId ? saved : x)));
      })
      .catch(console.error);
    return optimistic;
  }, []);

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    markMutation();
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    api(`/api/assets?id=${id}`, "PATCH", updates);
  }, []);

  const deleteAsset = useCallback((id: string) => {
    markMutation();
    setAssets((prev) => prev.filter((a) => a.id !== id));
    api(`/api/assets?id=${id}`, "DELETE");
  }, []);

  // ── Calculator mutations ──
  const updateCalculatorEvent = useCallback((name: string, state: CalculatorEvent) => {
    markMutation();
    setCalculatorEvents((prev) => {
      const exists = prev.find((e) => e.name === name);
      if (exists) return prev.map((e) => (e.name === name ? state : e));
      return [...prev, state];
    });
    api(`/api/calculator?name=${encodeURIComponent(name)}`, "PUT", state);
  }, []);

  // ── Team mutations ──
  const addTeamMember = useCallback((m: Omit<TeamMember, "id">) => {
    markMutation();
    const tempId = `temp-${Date.now()}`;
    setTeamMembers((prev) => [...prev, { ...m, id: tempId }]);
    fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(m),
    })
      .then((r) => r.json())
      .then((saved: TeamMember) => {
        setTeamMembers((prev) => prev.map((x) => (x.id === tempId ? saved : x)));
      })
      .catch(console.error);
  }, []);

  const removeTeamMember = useCallback((id: string) => {
    markMutation();
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    api(`/api/team?id=${id}`, "DELETE");
  }, []);

  // ── Derived helpers ──
  const getPostsByCampaign = useCallback(
    (campaignId: string) => posts.filter((p) => p.campaignId === campaignId),
    [posts]
  );

  const getPostsByStatus = useCallback(
    (status: PostStatus) => posts.filter((p) => p.status === status),
    [posts]
  );

  const getAssetsByCampaign = useCallback(
    (campaignId: string) => {
      const campaignPosts = posts.filter((p) => p.campaignId === campaignId);
      const assetIds = new Set(campaignPosts.flatMap((p) => p.linkedAssetIds));
      return assets.filter((a) => assetIds.has(a.id));
    },
    [posts, assets]
  );

  const getCampaignNames = useCallback(
    () => campaigns.map((c) => c.name),
    [campaigns]
  );

  const value: DataContextValue = {
    campaigns, posts, assets, calculatorEvents, teamMembers,
    addCampaign, updateCampaign, deleteCampaign,
    addPost, updatePost, deletePost,
    addAsset, updateAsset, deleteAsset,
    updateCalculatorEvent,
    addTeamMember, removeTeamMember,
    getPostsByCampaign, getPostsByStatus, getAssetsByCampaign, getCampaignNames,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
