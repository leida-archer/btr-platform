import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Download, X, Plus } from "lucide-react";
import Dropdown from "../components/Dropdown";
import { useData } from "../context/DataContext";

// ── Shared primitive components — defined OUTSIDE AdminCalculator so React never
//    remounts them on parent re-renders (inner function defs create new types). ──

const inputClass = "w-20 bg-surface border border-border rounded-lg px-2 py-2 text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-magenta";

function NumInput({ value, onChange, className: cls }: { value: number; onChange: (v: number) => void; className?: string }) {
  const [raw, setRaw] = useState(value === 0 ? "" : String(value));
  const committed = useRef(value);
  useEffect(() => {
    if (value !== committed.current) { committed.current = value; setRaw(value === 0 ? "" : String(value)); }
  }, [value]);
  const commit = (str: string) => {
    const num = parseFloat(str.replace(/[^0-9.]/g, "")) || 0;
    committed.current = num; setRaw(num === 0 ? "" : String(num)); onChange(num);
  };
  return (
    <input type="text" inputMode="decimal" value={raw} placeholder="0"
      onChange={(e) => setRaw(e.target.value)} onFocus={(e) => e.target.select()}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") { commit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur(); } }}
      className={cls ?? inputClass} />
  );
}

function CostRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm shrink-0">{label}</label>
      <div className="flex items-center gap-1.5 shrink-0">{children}</div>
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-5" style={{ fontFamily: "var(--font-heading)" }}>{children}</h2>
  );
}

interface LineItem     { label: string; amount: number; }
interface AdvertisementItem { type: "advertisement"; label: string; weeklyRate: number; }
interface MerchandiseItem   { type: "merchandise";   label: string; orderSize: number; unitCost: number; }
type MarketingItem = AdvertisementItem | MerchandiseItem;
interface Artist       { name: string; items: LineItem[]; }

interface CalculatorEvent {
  name: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  artists: Artist[];
  venueItems: LineItem[];
  productionItems: LineItem[];
  marketingItems: MarketingItem[];
  headcount: number;
  margin: number;
}

type ModalSection = "talent" | "venue" | "production" | "marketing";

interface ItemModal {
  section: ModalSection;
  artistIdx: number;
  editIdx: number | null;
  label: string;
  amount: string;
  marketingType: "advertisement" | "merchandise";
  orderSize: string;
  unitCost: string;
}

const STORAGE_KEY = "btr_calculator_events";
const SELECTED_KEY = "btr_calculator_selected";

const BLANK_EVENT = (name: string): CalculatorEvent => ({
  name, eventDate: "", startTime: "20:00", endTime: "02:00",
  artists: [], venueItems: [], productionItems: [], marketingItems: [],
  headcount: 0, margin: 0,
});

function migrateEvent(e: Record<string, unknown>): CalculatorEvent {
  // artists: { name, fee, travel } → { name, items[] }
  const artists = (e.artists as Record<string, unknown>[] ?? []).map((a) => {
    if (Array.isArray(a.items)) return a as unknown as Artist;
    const items: LineItem[] = [];
    if (a.fee)    items.push({ label: "Talent Fee",           amount: Number(a.fee) });
    if (a.travel) items.push({ label: "Travel / Hospitality", amount: Number(a.travel) });
    return { name: String(a.name ?? ""), items };
  });

  // venue: venueFee + barMin + venueStaff → venueItems[]
  const venueItems: LineItem[] = Array.isArray(e.venueItems) ? (e.venueItems as LineItem[]) : [];
  if (!Array.isArray(e.venueItems)) {
    if (e.venueFee) venueItems.push({ label: "Venue Fee",    amount: Number(e.venueFee) });
    if (e.barMin)   venueItems.push({ label: "Bar Minimum",  amount: Number(e.barMin) });
    if (e.showVenueStaff && Array.isArray(e.venueStaff)) {
      const hrs = (() => {
        const [sh, sm] = String(e.startTime ?? "20:00").split(":").map(Number);
        const [eh, em] = String(e.endTime   ?? "02:00").split(":").map(Number);
        let s = sh * 60 + (sm || 0), en = eh * 60 + (em || 0);
        if (en <= s) en += 1440;
        return (en - s) / 60;
      })();
      for (const v of e.venueStaff as Record<string, unknown>[])
        venueItems.push({ label: String(v.role || "Venue Staff"), amount: Number(v.rate) * Number(v.count) * hrs });
    }
  }

  // production: audioHW + visualHW + prodStaff → productionItems[]
  const productionItems: LineItem[] = Array.isArray(e.productionItems) ? (e.productionItems as LineItem[]) : [];
  if (!Array.isArray(e.productionItems)) {
    if (e.audioHW) productionItems.push({ label: "Audio Hardware",   amount: Number(e.audioHW) });
    if (e.visualHW) productionItems.push({ label: "Visual Hardware", amount: Number(e.visualHW) });
    if (e.showProdStaff && Array.isArray(e.prodStaff))
      for (const p of e.prodStaff as Record<string, unknown>[])
        productionItems.push({ label: String(p.role || "Production Staff"), amount: Number(p.rate) * Number(p.count) });
  }

  // marketing: paidAds + contentGen → marketingItems[]
  const marketingItems: MarketingItem[] = Array.isArray(e.marketingItems)
    ? (e.marketingItems as Record<string, unknown>[]).map((m) =>
        m.type === "merchandise"
          ? { type: "merchandise" as const, label: String(m.label ?? ""), orderSize: Number(m.orderSize ?? 0), unitCost: Number(m.unitCost ?? 0) }
          : { type: "advertisement" as const, label: String(m.label ?? ""), weeklyRate: Number(m.weeklyRate ?? 0) }
      )
    : [];
  if (!Array.isArray(e.marketingItems)) {
    if (e.paidAds)    marketingItems.push({ type: "advertisement", label: "Paid Advertising",   weeklyRate: Number(e.paidAds) });
    if (e.contentGen) marketingItems.push({ type: "advertisement", label: "Content Generation", weeklyRate: Number(e.contentGen) });
  }

  return { ...BLANK_EVENT(String(e.name ?? "")), ...(e as Partial<CalculatorEvent>), artists, venueItems, productionItems, marketingItems };
}

function loadAllEvents(): Record<string, CalculatorEvent> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, Record<string, unknown>>;
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, migrateEvent(v)]));
  } catch { return {}; }
}
function saveAllEvents(events: Record<string, CalculatorEvent>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export default function AdminCalculator() {
  const { campaigns } = useData();
  const eventNames = campaigns.filter((c) => c.type === "event").map((c) => c.name);
  const [allEvents] = useState<Record<string, CalculatorEvent>>(loadAllEvents);
  const [selectedEvent, setSelectedEvent] = useState<string>(
    () => localStorage.getItem(SELECTED_KEY) ?? eventNames[0] ?? ""
  );
  const [modal, setModal] = useState<ItemModal | null>(null);

  // Ref keeps a live mirror of allEvents so the autosave effect can write
  // localStorage without calling setAllEvents (which would trigger re-renders).
  const allEventsRef = useRef(allEvents);
  allEventsRef.current = allEvents;

  const current = allEvents[selectedEvent] ?? BLANK_EVENT(selectedEvent);

  const [eventDate,        setEventDate]        = useState(current.eventDate);
  const [startTime,        setStartTime]        = useState(current.startTime);
  const [endTime,          setEndTime]          = useState(current.endTime);
  const [artists,          setArtists]          = useState<Artist[]>([...current.artists]);
  const [venueItems,       setVenueItems]       = useState<LineItem[]>([...current.venueItems]);
  const [productionItems,  setProductionItems]  = useState<LineItem[]>([...current.productionItems]);
  const [marketingItems,   setMarketingItems]   = useState<MarketingItem[]>([...current.marketingItems]);
  const [headcount,        setHeadcount]        = useState(current.headcount);
  const [margin,           setMargin]           = useState(current.margin);

  const getCurrentState = useCallback((): CalculatorEvent => ({
    name: selectedEvent, eventDate, startTime, endTime,
    artists: [...artists], venueItems: [...venueItems],
    productionItems: [...productionItems], marketingItems: [...marketingItems],
    headcount, margin,
  }), [selectedEvent, eventDate, startTime, endTime, artists, venueItems, productionItems, marketingItems, headcount, margin]);

  // Autosave: write directly to localStorage via ref — no setAllEvents call,
  // so this never triggers a re-render.
  useEffect(() => {
    if (!selectedEvent) return;
    const state = getCurrentState();
    const updated = { ...allEventsRef.current, [selectedEvent]: state };
    allEventsRef.current = updated;
    saveAllEvents(updated);
    localStorage.setItem(SELECTED_KEY, selectedEvent);
  }, [selectedEvent, getCurrentState]);

  const loadEvent = (name: string) => {
    const c = allEventsRef.current[name] ?? BLANK_EVENT(name);
    setSelectedEvent(name);
    setEventDate(c.eventDate);
    setStartTime(c.startTime);
    setEndTime(c.endTime);
    setArtists([...c.artists]);
    setVenueItems([...c.venueItems]);
    setProductionItems([...c.productionItems]);
    setMarketingItems([...c.marketingItems]);
    setHeadcount(c.headcount);
    setMargin(c.margin);
  };


  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAdd  = (section: ModalSection, artistIdx = 0) =>
    setModal({ section, artistIdx, editIdx: null, label: "", amount: "", marketingType: "advertisement", orderSize: "", unitCost: "" });

  const openEdit = (section: ModalSection, editIdx: number, label: string, amount: string, artistIdx = 0, marketingType: "advertisement" | "merchandise" = "advertisement", orderSize = "", unitCost = "") =>
    setModal({ section, artistIdx, editIdx, label, amount, marketingType, orderSize, unitCost });

  const saveModal = () => {
    if (!modal) return;
    const raw = parseFloat(modal.amount.replace(/[^0-9.]/g, "")) || 0;
    const label = modal.label.trim() || "Item";

    if (modal.section === "talent") {
      const next = [...artists];
      const item: LineItem = { label, amount: raw };
      if (modal.editIdx !== null) next[modal.artistIdx].items[modal.editIdx] = item;
      else next[modal.artistIdx].items = [...next[modal.artistIdx].items, item];
      setArtists(next);
    } else if (modal.section === "venue") {
      const next = [...venueItems];
      const item: LineItem = { label, amount: raw };
      if (modal.editIdx !== null) next[modal.editIdx] = item; else next.push(item);
      setVenueItems(next);
    } else if (modal.section === "production") {
      const next = [...productionItems];
      const item: LineItem = { label, amount: raw };
      if (modal.editIdx !== null) next[modal.editIdx] = item; else next.push(item);
      setProductionItems(next);
    } else {
      const next = [...marketingItems];
      const item: MarketingItem = modal.marketingType === "merchandise"
        ? { type: "merchandise", label, orderSize: parseFloat(modal.orderSize.replace(/[^0-9.]/g, "")) || 0, unitCost: parseFloat(modal.unitCost.replace(/[^0-9.]/g, "")) || 0 }
        : { type: "advertisement", label, weeklyRate: raw };
      if (modal.editIdx !== null) next[modal.editIdx] = item; else next.push(item);
      setMarketingItems(next);
    }
    setModal(null);
  };

  const removeItem = (section: ModalSection, idx: number, artistIdx = 0) => {
    if (section === "talent") {
      const next = [...artists];
      next[artistIdx].items = next[artistIdx].items.filter((_, j) => j !== idx);
      setArtists(next);
    } else if (section === "venue") {
      setVenueItems(venueItems.filter((_, j) => j !== idx));
    } else if (section === "production") {
      setProductionItems(productionItems.filter((_, j) => j !== idx));
    } else {
      setMarketingItems(marketingItems.filter((_, j) => j !== idx));
    }
  };

  // ── Calculations ───────────────────────────────────────────────────────────
  const eventHours = useMemo(() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    let s = sh * 60 + (sm || 0), e = eh * 60 + (em || 0);
    if (e <= s) e += 1440;
    return (e - s) / 60;
  }, [startTime, endTime]);

  const weeksUntil = useMemo(() => {
    if (!eventDate) return 1;
    return Math.max(1, Math.ceil((new Date(eventDate).getTime() - Date.now()) / (7 * 86400000)));
  }, [eventDate]);

  const calc = useMemo(() => {
    const talent     = artists.reduce((s, a) => s + a.items.reduce((s2, it) => s2 + it.amount, 0), 0);
    const venue      = venueItems.reduce((s, it) => s + it.amount, 0);
    const production = productionItems.reduce((s, it) => s + it.amount, 0);
    const marketing  = marketingItems.reduce((s, it) => s + (it.type === "merchandise" ? it.orderSize * it.unitCost : it.weeklyRate * weeksUntil), 0);
    const total = talent + venue + production + marketing;
    const targetRevenue = total * (1 + margin / 100);
    const ticketPrice   = headcount > 0 ? targetRevenue / headcount : 0;
    const profit        = targetRevenue - total;
    return { talent, venue, production, marketing, total, targetRevenue, ticketPrice, profit };
  }, [artists, venueItems, productionItems, marketingItems, headcount, margin, weeksUntil]);

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const exportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const generated = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const talentRows = artists.flatMap((a) =>
      a.items.map((it) => `<tr><td class="indent">${a.name ? `<span style="color:#6b5e73">${a.name} — </span>` : ""}${it.label}</td><td class="r">${fmt(it.amount)}</td></tr>`)
    ).join("") + artists.map((a) =>
      `<tr class="subtotal"><td class="indent">${a.name || "Unnamed"} Subtotal</td><td class="r">${fmt(a.items.reduce((s, it) => s + it.amount, 0))}</td></tr>`
    ).join("");

    const venueRows = venueItems.map((it) =>
      `<tr><td class="indent">${it.label}</td><td class="r">${fmt(it.amount)}</td></tr>`
    ).join("");

    const prodRows = productionItems.map((it) =>
      `<tr><td class="indent">${it.label}</td><td class="r">${fmt(it.amount)}</td></tr>`
    ).join("");

    const mktRows = marketingItems.map((it) =>
      it.type === "merchandise"
        ? `<tr><td class="indent">${it.label} <span class="badge">MERCH</span></td><td class="r muted">${it.orderSize} units × ${fmt(it.unitCost)}</td><td class="r">${fmt(it.orderSize * it.unitCost)}</td></tr>`
        : `<tr><td class="indent">${it.label} <span class="badge">AD</span></td><td class="r muted">${fmt(it.weeklyRate)}/wk × ${weeksUntil} wk</td><td class="r">${fmt(it.weeklyRate * weeksUntil)}</td></tr>`
    ).join("");

    w.document.write(`<!DOCTYPE html><html><head><title>${selectedEvent} — Financial Report</title>
<style>
  @page { size: letter; margin: 0.75in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Segoe UI', system-ui, sans-serif; color: #1a1018; font-size: 9.5pt; line-height: 1.5; }
  .header { border-bottom: 3px solid #D6246E; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { font-size: 18pt; font-weight: 700; margin-bottom: 2px; }
  .header .subtitle { font-size: 10pt; color: #6b5e73; }
  .header .meta { display: flex; gap: 24px; margin-top: 8px; font-size: 8.5pt; color: #6b5e73; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .summary-card { border: 1px solid #e0d8e4; border-radius: 6px; padding: 10px 12px; }
  .summary-card .label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.08em; color: #6b5e73; margin-bottom: 2px; }
  .summary-card .value { font-size: 14pt; font-weight: 700; }
  .summary-card .value.accent { color: #D6246E; }
  h2 { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.1em; color: #6b5e73; font-weight: 600; margin: 20px 0 8px; border-bottom: 1px solid #e0d8e4; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; table-layout: fixed; }
  th { text-align: left; font-weight: 600; color: #6b5e73; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 8px; border-bottom: 1px solid #e0d8e4; }
  th.r, td.r { text-align: right; }
  td { padding: 3px 8px; border-bottom: 1px solid #f0ecf2; }
  td.indent { padding-left: 20px; color: #4a3d52; }
  td.muted { color: #6b5e73; }
  tr.subtotal td { font-weight: 600; border-top: 1px solid #d0c8d4; border-bottom: 1px solid #d0c8d4; background: #faf8fb; }
  .section { break-inside: avoid; }
  .totals-table { margin-top: 20px; }
  .totals-table td { padding: 5px 8px; font-size: 10pt; }
  .totals-table tr.grand td { font-size: 11pt; font-weight: 700; border-top: 2px solid #1a1018; }
  .totals-table tr.highlight td { font-weight: 700; color: #D6246E; font-size: 13pt; }
  .notes { margin-top: 20px; padding: 12px; border: 1px solid #e0d8e4; border-radius: 6px; background: #faf8fb; }
  .notes h3 { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: #6b5e73; margin-bottom: 6px; }
  .notes p { font-size: 8.5pt; color: #4a3d52; margin-bottom: 4px; }
  .footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #e0d8e4; display: flex; justify-content: space-between; font-size: 7.5pt; color: #b8a9c2; }
  .badge { display: inline-block; font-size: 6.5pt; font-weight: 700; letter-spacing: 0.06em; padding: 1px 4px; border-radius: 3px; background: #f0ecf4; color: #6b5e73; margin-left: 4px; vertical-align: middle; }
  col.w50 { width: 50%; } col.w25 { width: 25%; } col.w70 { width: 70%; } col.w30 { width: 30%; }
</style></head><body>
<div class="header">
  <h1>${selectedEvent}</h1>
  <div class="subtitle">Event Financial Report</div>
  <div class="meta">
    <span><strong>Date:</strong> ${eventDate ? new Date(eventDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "TBD"}</span>
    <span><strong>Time:</strong> ${startTime} – ${endTime} (${eventHours.toFixed(1)} hrs)</span>
    <span><strong>Headcount:</strong> ${headcount}</span>
    <span><strong>Margin:</strong> ${margin}%</span>
  </div>
</div>
<div class="summary-grid">
  <div class="summary-card"><div class="label">Total Costs</div><div class="value">${fmt(calc.total)}</div></div>
  <div class="summary-card"><div class="label">Target Revenue</div><div class="value">${fmt(calc.targetRevenue)}</div></div>
  <div class="summary-card"><div class="label">Net Profit</div><div class="value">${fmt(calc.profit)}</div></div>
  <div class="summary-card"><div class="label">Ticket Price</div><div class="value accent">${fmt(calc.ticketPrice)}</div></div>
</div>
<div class="section"><h2>1. Talent</h2>
<table><colgroup><col class="w70"/><col class="w30"/></colgroup>
<thead><tr><th>Line Item</th><th class="r">Amount</th></tr></thead>
<tbody>${talentRows}<tr class="subtotal"><td>Subtotal — Talent</td><td class="r">${fmt(calc.talent)}</td></tr></tbody></table></div>
<div class="section"><h2>2. Venue</h2>
<table><colgroup><col class="w70"/><col class="w30"/></colgroup>
<thead><tr><th>Line Item</th><th class="r">Amount</th></tr></thead>
<tbody>${venueRows}<tr class="subtotal"><td>Subtotal — Venue</td><td class="r">${fmt(calc.venue)}</td></tr></tbody></table></div>
<div class="section"><h2>3. Production</h2>
<table><colgroup><col class="w70"/><col class="w30"/></colgroup>
<thead><tr><th>Line Item</th><th class="r">Amount</th></tr></thead>
<tbody>${prodRows}<tr class="subtotal"><td>Subtotal — Production</td><td class="r">${fmt(calc.production)}</td></tr></tbody></table></div>
<div class="section"><h2>4. Marketing</h2>
<table><colgroup><col class="w50"/><col class="w25"/><col class="w25"/></colgroup>
<thead><tr><th>Line Item</th><th class="r">Rate</th><th class="r">Total (${weeksUntil} wks)</th></tr></thead>
<tbody>${mktRows}<tr class="subtotal"><td>Subtotal — Marketing</td><td class="r"></td><td class="r">${fmt(calc.marketing)}</td></tr></tbody></table></div>
<div class="totals-section"><h2>5. Financial Summary</h2>
<table class="totals-table"><tbody>
<tr><td>Talent</td><td class="r">${fmt(calc.talent)}</td></tr>
<tr><td>Venue</td><td class="r">${fmt(calc.venue)}</td></tr>
<tr><td>Production</td><td class="r">${fmt(calc.production)}</td></tr>
<tr><td>Marketing</td><td class="r">${fmt(calc.marketing)}</td></tr>
<tr class="grand"><td>Total Event Costs</td><td class="r">${fmt(calc.total)}</td></tr>
<tr><td>Profit Margin (${margin}%)</td><td class="r">${fmt(calc.profit)}</td></tr>
<tr class="grand"><td>Target Revenue</td><td class="r">${fmt(calc.targetRevenue)}</td></tr>
<tr class="highlight"><td>Recommended Ticket Price (${headcount} tickets)</td><td class="r">${fmt(calc.ticketPrice)}</td></tr>
</tbody></table></div>
<div class="notes section"><h3>Notes & Assumptions</h3>
<p><strong>Marketing Runway:</strong> ${weeksUntil} week${weeksUntil !== 1 ? "s" : ""} until event — all marketing rates multiplied accordingly.</p>
<p><strong>Event Duration:</strong> ${eventHours.toFixed(1)} hours (${startTime} – ${endTime}).</p>
</div>
<div class="footer"><span>Beyond the Rhythm — Financial Planner</span><span>Generated ${generated}</span></div>
</body></html>`);
    w.document.close();
    w.print();
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const dateInputClass = "bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-magenta [color-scheme:dark]";
  const nameInputClass = "bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground w-40 focus:outline-none focus:ring-1 focus:ring-magenta";

  // Reusable item list for flat-amount sections
  function FlatItemList({ items, section }: { items: LineItem[]; section: "venue" | "production" }) {
    return (
      <>
        {items.length > 0 && (
          <div className="space-y-2 mb-3">
            {items.map((it, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-sm">
                <button onClick={() => openEdit(section, i, it.label, String(it.amount))} className="text-foreground-muted hover:text-foreground text-left truncate max-w-[200px]">{it.label}</button>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-foreground">{fmt(it.amount)}</span>
                  <button onClick={() => removeItem(section, i)} className="text-foreground-muted hover:text-coral"><X className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => openAdd(section)} className="text-sm text-foreground-muted hover:text-foreground border border-border rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors">
          <Plus className="w-3 h-3" /> Item
        </button>
      </>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Ticket Calculator</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Dropdown
            label="Select Event"
            options={eventNames.map((k) => ({ value: k, label: k }))}
            value={selectedEvent}
            onChange={loadEvent}
            disabled={eventNames.length === 0}
          />
          <button onClick={exportPDF} className="btn btn--gradient btn--sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {!selectedEvent && (
        <div className="text-center py-20 text-foreground-muted">
          <p>No events available. Create a campaign first.</p>
        </div>
      )}

      {selectedEvent && (
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 min-w-0 space-y-4">

            {/* Event Details */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <H>Event Details</H>
              <div className="space-y-3">
                <CostRow label="Event Date"><input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={dateInputClass} /></CostRow>
                <CostRow label="Start Time"><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={dateInputClass} /></CostRow>
                <CostRow label="End Time"><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={dateInputClass} /></CostRow>
              </div>
            </div>

            {/* Talent */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <H>Talent Costs</H>
              {artists.map((a, ai) => (
                <div key={ai} className="border-l-2 border-border pl-4 mb-5">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <input value={a.name} onChange={(e) => { const n = [...artists]; n[ai].name = e.target.value; setArtists(n); }} placeholder="Artist name" className={nameInputClass} />
                    <button onClick={() => setArtists(artists.filter((_, j) => j !== ai))} className="text-foreground-muted hover:text-coral shrink-0"><X className="w-4 h-4" /></button>
                  </div>
                  {a.items.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {a.items.map((it, ii) => (
                        <div key={ii} className="flex items-center justify-between gap-2 text-sm">
                          <button onClick={() => openEdit("talent", ii, it.label, String(it.amount), ai)} className="text-foreground-muted hover:text-foreground text-left truncate max-w-[200px]">{it.label}</button>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-foreground">{fmt(it.amount)}</span>
                            <button onClick={() => removeItem("talent", ii, ai)} className="text-foreground-muted hover:text-coral"><X className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => openAdd("talent", ai)} className="text-sm text-foreground-muted hover:text-foreground border border-border rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors">
                    <Plus className="w-3 h-3" /> Item
                  </button>
                </div>
              ))}
              <button onClick={() => setArtists([...artists, { name: "", items: [] }])} className="text-sm text-foreground-muted hover:text-foreground border border-border rounded-lg px-4 py-2 flex items-center gap-1.5">
                <Plus className="w-3 h-3" /> Add Artist
              </button>
            </div>

            {/* Venue */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <H>Venue Costs</H>
              <FlatItemList items={venueItems} section="venue" />
            </div>

            {/* Production */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <H>Production Costs</H>
              <FlatItemList items={productionItems} section="production" />
            </div>

            {/* Marketing */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <H>Marketing Costs</H>
              {marketingItems.some((it) => it.type === "advertisement") && (
                <p className="text-xs text-foreground-muted mb-3">{weeksUntil} week{weeksUntil !== 1 ? "s" : ""} until event — ad rates multiplied accordingly</p>
              )}
              {marketingItems.length > 0 && (
                <div className="space-y-2 mb-3">
                  {marketingItems.map((it, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${it.type === "merchandise" ? "bg-violet/15 text-violet" : "bg-magenta/15 text-magenta"}`}>
                          {it.type === "merchandise" ? "MERCH" : "AD"}
                        </span>
                        <button
                          onClick={() => it.type === "merchandise"
                            ? openEdit("marketing", i, it.label, "", 0, "merchandise", String(it.orderSize), String(it.unitCost))
                            : openEdit("marketing", i, it.label, String(it.weeklyRate))}
                          className="text-foreground-muted hover:text-foreground text-left truncate max-w-[120px]">{it.label}</button>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {it.type === "merchandise" ? (
                          <>
                            <span className="text-foreground-muted text-xs">{it.orderSize} × {fmt(it.unitCost)}</span>
                            <span className="text-foreground">{fmt(it.orderSize * it.unitCost)}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-foreground-muted">{fmt(it.weeklyRate)}<span className="text-xs">/wk</span></span>
                            <span className="text-foreground">{fmt(it.weeklyRate * weeksUntil)}</span>
                          </>
                        )}
                        <button onClick={() => removeItem("marketing", i)} className="text-foreground-muted hover:text-coral"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => openAdd("marketing")} className="text-sm text-foreground-muted hover:text-foreground border border-border rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors">
                <Plus className="w-3 h-3" /> Item
              </button>
            </div>

            {/* Attendance */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <H>Attendance Goal</H>
              <div className="space-y-3">
                <CostRow label="Expected Headcount"><NumInput value={headcount} onChange={setHeadcount} /></CostRow>
                <CostRow label="Profit Margin"><span className="text-foreground-muted text-sm">%</span><NumInput value={margin} onChange={setMargin} /></CostRow>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full xl:w-80 xl:shrink-0">
            <div className="xl:sticky xl:top-4 bg-surface border border-border rounded-xl p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-5" style={{ fontFamily: "var(--font-heading)" }}>Cost Breakdown</h3>
              <div className="space-y-2 text-sm">

                {/* Talent */}
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted pt-1" style={{ fontFamily: "var(--font-heading)" }}>Talent</p>
                {artists.length > 0 ? artists.map((a, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-foreground-muted truncate max-w-[160px]">{a.name || "Unnamed"}</span>
                    <span>{fmt(a.items.reduce((s, it) => s + it.amount, 0))}</span>
                  </div>
                )) : <div className="flex justify-between"><span className="text-foreground-muted">—</span><span>{fmt(0)}</span></div>}

                {/* Venue */}
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted pt-3" style={{ fontFamily: "var(--font-heading)" }}>Venue</p>
                {venueItems.length > 0 ? venueItems.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-foreground-muted truncate max-w-[160px]">{it.label}</span>
                    <span>{fmt(it.amount)}</span>
                  </div>
                )) : <div className="flex justify-between"><span className="text-foreground-muted">—</span><span>{fmt(0)}</span></div>}

                {/* Production */}
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted pt-3" style={{ fontFamily: "var(--font-heading)" }}>Production</p>
                {productionItems.length > 0 ? productionItems.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-foreground-muted truncate max-w-[160px]">{it.label}</span>
                    <span>{fmt(it.amount)}</span>
                  </div>
                )) : <div className="flex justify-between"><span className="text-foreground-muted">—</span><span>{fmt(0)}</span></div>}

                {/* Marketing */}
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted pt-3" style={{ fontFamily: "var(--font-heading)" }}>Marketing</p>
                {marketingItems.length > 0 ? marketingItems.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-foreground-muted truncate max-w-[140px]">{it.label}</span>
                    <span>{fmt(it.type === "merchandise" ? it.orderSize * it.unitCost : it.weeklyRate * weeksUntil)}</span>
                  </div>
                )) : <div className="flex justify-between"><span className="text-foreground-muted">—</span><span>{fmt(0)}</span></div>}
              </div>

              <div className="border-t border-border mt-5 pt-5 space-y-3">
                <div className="flex justify-between text-base font-bold"><span>Total Costs</span><span>{fmt(calc.total)}</span></div>
                <div className="flex justify-between text-base font-bold"><span>Target Revenue</span><span>{fmt(calc.targetRevenue)}</span></div>
                <div className="flex justify-between text-sm text-foreground-muted"><span>Profit</span><span>{fmt(calc.profit)}</span></div>
              </div>
              <div className="border-t border-border mt-5 pt-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-2" style={{ fontFamily: "var(--font-heading)" }}>Recommended Ticket Price</p>
                <p className="text-4xl font-bold gradient-text" style={{ fontFamily: "var(--font-heading)" }}>{fmt(calc.ticketPrice)}</p>
                <p className="text-xs text-foreground-muted mt-2">Per Ticket Across {headcount} Tickets</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(26,16,24,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-surface border border-border rounded-2xl w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
              <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                {modal.editIdx !== null ? "Edit Line Item" : "Add Line Item"}
              </h3>
              <button onClick={() => setModal(null)} className="text-foreground-muted hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Type dropdown — marketing only */}
              {modal.section === "marketing" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>Item Type</label>
                  <Dropdown
                    label="Select type"
                    fullWidth
                    options={[
                      { value: "advertisement", label: "Advertisement" },
                      { value: "merchandise",   label: "Merchandise" },
                    ]}
                    value={modal.marketingType}
                    onChange={(v) => setModal({ ...modal, marketingType: v as "advertisement" | "merchandise", amount: "", orderSize: "", unitCost: "" })}
                  />
                </div>
              )}

              {/* Label field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
                  {modal.section === "marketing" && modal.marketingType === "merchandise" ? "Article Type" : "Line Item Name"}
                </label>
                <input type="text" value={modal.label} onChange={(e) => setModal({ ...modal, label: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && saveModal()}
                  placeholder={
                    modal.section === "marketing" && modal.marketingType === "merchandise"
                      ? "e.g. T-Shirt, Hat, Tote Bag"
                      : modal.section === "marketing"
                        ? "e.g. Paid Advertising, Influencers"
                        : "e.g. Venue Fee, Security, Audio Hardware"
                  }
                  className="w-full bg-ink border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-magenta" autoFocus />
              </div>

              {/* Amount fields — conditional on section + marketing type */}
              {modal.section === "marketing" && modal.marketingType === "merchandise" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>Order Size</label>
                    <input type="text" inputMode="numeric" value={modal.orderSize} onChange={(e) => setModal({ ...modal, orderSize: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && saveModal()}
                      placeholder="0"
                      className="w-full bg-ink border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-magenta" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>Cost / Unit</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">$</span>
                      <input type="text" inputMode="decimal" value={modal.unitCost} onChange={(e) => setModal({ ...modal, unitCost: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && saveModal()}
                        placeholder="0.00"
                        className="w-full bg-ink border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-magenta" />
                    </div>
                  </div>
                  {modal.orderSize && modal.unitCost && (
                    <p className="col-span-2 text-xs text-foreground-muted -mt-1">
                      {modal.orderSize} units × {fmt(parseFloat(modal.unitCost.replace(/[^0-9.]/g, "")) || 0)}
                      {" = "}
                      <span className="text-foreground font-medium">
                        {fmt((parseFloat(modal.orderSize.replace(/[^0-9.]/g, "")) || 0) * (parseFloat(modal.unitCost.replace(/[^0-9.]/g, "")) || 0))}
                      </span>
                    </p>
                  )}
                </div>
              ) : modal.section === "marketing" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>Weekly Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">$</span>
                    <input type="text" inputMode="decimal" value={modal.amount} onChange={(e) => setModal({ ...modal, amount: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && saveModal()}
                      placeholder="0.00"
                      className="w-full bg-ink border border-border rounded-lg pl-7 pr-16 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-magenta" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted text-xs">/ wk</span>
                  </div>
                  {modal.amount && (
                    <p className="text-xs text-foreground-muted pt-0.5">
                      {fmt(parseFloat(modal.amount.replace(/[^0-9.]/g, "")) || 0)} × {weeksUntil} wk
                      {" = "}
                      <span className="text-foreground font-medium">
                        {fmt((parseFloat(modal.amount.replace(/[^0-9.]/g, "")) || 0) * weeksUntil)}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">$</span>
                    <input type="text" inputMode="decimal" value={modal.amount} onChange={(e) => setModal({ ...modal, amount: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && saveModal()}
                      placeholder="0.00"
                      className="w-full bg-ink border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-magenta" />
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 pb-5">
              <button onClick={saveModal} className="btn btn--gradient w-full">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
