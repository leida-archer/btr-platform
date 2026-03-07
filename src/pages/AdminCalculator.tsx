import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Download, ChevronDown, ChevronRight, X, Plus } from "lucide-react";
import Dropdown from "../components/Dropdown";
import { useData } from "../context/DataContext";
import type { CalculatorEvent } from "../types/data";

interface Artist { name: string; fee: number; travel: number; }
interface StaffEntry { role: string; rate: number; count: number; }

export default function AdminCalculator() {
  const { campaigns, calculatorEvents, updateCalculatorEvent } = useData();

  const eventNames = useMemo(() => campaigns.map((c) => c.name), [campaigns]);

  // Cache stores per-event edited values so they persist when switching
  const cacheRef = useRef<Record<string, CalculatorEvent>>(
    Object.fromEntries(calculatorEvents.map((e) => [e.name, JSON.parse(JSON.stringify(e))]))
  );

  // Keep cache in sync if context changes externally
  useEffect(() => {
    for (const e of calculatorEvents) {
      if (!cacheRef.current[e.name]) {
        cacheRef.current[e.name] = JSON.parse(JSON.stringify(e));
      }
    }
  }, [calculatorEvents]);

  const [selectedEvent, setSelectedEvent] = useState(eventNames[0] ?? "");

  const initial = cacheRef.current[selectedEvent] ?? calculatorEvents.find((e) => e.name === selectedEvent);

  const [eventDate, setEventDate] = useState(initial?.eventDate ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [artists, setArtists] = useState<Artist[]>(initial?.artists ? [...initial.artists] : []);
  const [venueFee, setVenueFee] = useState(initial?.venueFee ?? 0);
  const [barMin, setBarMin] = useState(initial?.barMin ?? 0);
  const [audioHW, setAudioHW] = useState(initial?.audioHW ?? 0);
  const [visualHW, setVisualHW] = useState(initial?.visualHW ?? 0);
  const [showVenueStaff, setShowVenueStaff] = useState(initial?.showVenueStaff ?? false);
  const [venueStaff, setVenueStaff] = useState<StaffEntry[]>(initial?.venueStaff ? [...initial.venueStaff] : []);
  const [showProdStaff, setShowProdStaff] = useState(initial?.showProdStaff ?? false);
  const [prodStaff, setProdStaff] = useState<StaffEntry[]>(initial?.prodStaff ? [...initial.prodStaff] : []);
  const [paidAds, setPaidAds] = useState(initial?.paidAds ?? 0);
  const [contentGen, setContentGen] = useState(initial?.contentGen ?? 0);
  const [headcount, setHeadcount] = useState(initial?.headcount ?? 0);
  const [margin, setMargin] = useState(initial?.margin ?? 0);
  const breakdownRef = useRef<HTMLDivElement>(null);

  const getCurrentState = useCallback((): CalculatorEvent => ({
    name: selectedEvent, eventDate, startTime, endTime, artists: [...artists],
    venueFee, barMin, audioHW, visualHW,
    showVenueStaff, venueStaff: [...venueStaff],
    showProdStaff, prodStaff: [...prodStaff],
    paidAds, contentGen, headcount, margin,
  }), [selectedEvent, eventDate, startTime, endTime, artists, venueFee, barMin, audioHW, visualHW, showVenueStaff, venueStaff, showProdStaff, prodStaff, paidAds, contentGen, headcount, margin]);

  const BLANK_EVENT: CalculatorEvent = {
    name: "", eventDate: "", startTime: "20:00", endTime: "02:00",
    artists: [], venueFee: 0, barMin: 0, audioHW: 0, visualHW: 0,
    showVenueStaff: false, venueStaff: [], showProdStaff: false, prodStaff: [],
    paidAds: 0, contentGen: 0, headcount: 0, margin: 0,
  };

  const loadEvent = (name: string) => {
    // Save current event state to cache + context before switching
    if (selectedEvent) {
      const current = getCurrentState();
      cacheRef.current[selectedEvent] = current;
      updateCalculatorEvent(selectedEvent, current);
    }
    const cached = cacheRef.current[name] ?? { ...BLANK_EVENT, name };
    setSelectedEvent(name);
    setEventDate(cached.eventDate);
    setStartTime(cached.startTime);
    setEndTime(cached.endTime);
    setArtists([...cached.artists]);
    setVenueFee(cached.venueFee);
    setBarMin(cached.barMin);
    setAudioHW(cached.audioHW);
    setVisualHW(cached.visualHW);
    setShowVenueStaff(cached.showVenueStaff);
    setVenueStaff([...cached.venueStaff]);
    setShowProdStaff(cached.showProdStaff);
    setProdStaff([...cached.prodStaff]);
    setPaidAds(cached.paidAds);
    setContentGen(cached.contentGen);
    setHeadcount(cached.headcount);
    setMargin(cached.margin);
  };

  // Keep cache + context in sync with current state
  useEffect(() => {
    if (selectedEvent) {
      const current = getCurrentState();
      cacheRef.current[selectedEvent] = current;
      updateCalculatorEvent(selectedEvent, current);
    }
  }, [selectedEvent, getCurrentState, updateCalculatorEvent]);

  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const generated = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const artistRows = artists.map((a) =>
      `<tr><td class="indent">${a.name || "Unnamed"}</td><td class="r">${fmt(a.fee)}</td><td class="r">${fmt(a.travel)}</td><td class="r">${fmt(a.fee + a.travel)}</td></tr>`
    ).join("");

    const venueStaffRows = showVenueStaff ? venueStaff.map((v) =>
      `<tr><td class="indent">${v.role}</td><td class="r">${v.count} staff</td><td class="r">${fmt(v.rate)}/hr × ${eventHours.toFixed(1)}hr</td><td class="r">${fmt(v.rate * v.count * eventHours)}</td></tr>`
    ).join("") : "";

    const prodStaffRows = showProdStaff ? prodStaff.map((p) =>
      `<tr><td class="indent">${p.role}</td><td class="r">${p.count} staff</td><td class="r">${fmt(p.rate)} flat</td><td class="r">${fmt(p.rate * p.count)}</td></tr>`
    ).join("") : "";

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${selectedEvent} — Financial Report</title>
<style>
  @page { size: letter; margin: 0.75in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Segoe UI', system-ui, sans-serif; color: #1a1018; font-size: 9.5pt; line-height: 1.5; }
  .header { border-bottom: 3px solid #D6246E; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { font-size: 18pt; font-weight: 700; color: #1a1018; margin-bottom: 2px; }
  .header .subtitle { font-size: 10pt; color: #6b5e73; }
  .header .meta { display: flex; gap: 24px; margin-top: 8px; font-size: 8.5pt; color: #6b5e73; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .summary-card { border: 1px solid #e0d8e4; border-radius: 6px; padding: 10px 12px; }
  .summary-card .label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.08em; color: #6b5e73; margin-bottom: 2px; }
  .summary-card .value { font-size: 14pt; font-weight: 700; }
  .summary-card .value.accent { color: #D6246E; }
  h2 { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.1em; color: #6b5e73; font-weight: 600; margin: 20px 0 8px; border-bottom: 1px solid #e0d8e4; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; table-layout: fixed; }
  table col.c1 { width: 40%; } table col.c2 { width: 18%; } table col.c3 { width: 22%; } table col.c4 { width: 20%; }
  th { text-align: left; font-weight: 600; color: #6b5e73; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 8px; border-bottom: 1px solid #e0d8e4; }
  th.r, td.r { text-align: right; }
  td { padding: 3px 8px; border-bottom: 1px solid #f0ecf2; }
  td.indent { padding-left: 20px; color: #4a3d52; }
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
</style></head><body>
<div class="header">
  <h1>${selectedEvent}</h1>
  <div class="subtitle">Event Financial Report</div>
  <div class="meta">
    <span><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
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
<table><colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/></colgroup>
<thead><tr><th>Artist</th><th class="r">Fee</th><th class="r">Travel</th><th class="r">Total</th></tr></thead>
<tbody>${artistRows}<tr class="subtotal"><td>Subtotal — Talent</td><td class="r"></td><td class="r"></td><td class="r">${fmt(calc.talent)}</td></tr></tbody></table></div>
<div class="section"><h2>2. Venue & Staffing</h2>
<table><colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/></colgroup>
<thead><tr><th>Item</th><th class="r">Quantity</th><th class="r">Rate</th><th class="r">Total</th></tr></thead>
<tbody><tr><td class="indent">Venue Fee</td><td class="r">—</td><td class="r">Flat fee</td><td class="r">${fmt(venueFee)}</td></tr>${venueStaffRows}<tr class="subtotal"><td>Subtotal — Venue</td><td class="r"></td><td class="r"></td><td class="r">${fmt(calc.venue)}</td></tr></tbody></table></div>
<div class="section"><h2>3. Production</h2>
<table><colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/></colgroup>
<thead><tr><th>Item</th><th class="r">Quantity</th><th class="r">Rate</th><th class="r">Total</th></tr></thead>
<tbody><tr><td class="indent">Audio Hardware</td><td class="r">—</td><td class="r">Rental / hire</td><td class="r">${fmt(audioHW)}</td></tr><tr><td class="indent">Visual Hardware</td><td class="r">—</td><td class="r">Rental / hire</td><td class="r">${fmt(visualHW)}</td></tr>${prodStaffRows}<tr class="subtotal"><td>Subtotal — Production</td><td class="r"></td><td class="r"></td><td class="r">${fmt(calc.production)}</td></tr></tbody></table></div>
<div class="section"><h2>4. Marketing</h2>
<table><colgroup><col class="c1"/><col class="c2"/><col class="c3"/><col class="c4"/></colgroup>
<thead><tr><th>Item</th><th class="r">Weekly Rate</th><th class="r">Duration</th><th class="r">Total</th></tr></thead>
<tbody><tr><td class="indent">Paid Advertising</td><td class="r">${fmt(paidAds)}/wk</td><td class="r">${weeksUntil} weeks</td><td class="r">${fmt(calc.adsCost)}</td></tr><tr><td class="indent">Content Generation</td><td class="r">${fmt(contentGen)}/wk</td><td class="r">${weeksUntil} weeks</td><td class="r">${fmt(calc.contentCost)}</td></tr><tr class="subtotal"><td>Subtotal — Marketing</td><td class="r"></td><td class="r"></td><td class="r">${fmt(calc.marketing)}</td></tr></tbody></table></div>
<div class="totals-section"><h2>5. Financial Summary</h2>
<table class="totals-table"><tbody>
<tr><td>Talent</td><td class="r">${fmt(calc.talent)}</td></tr>
<tr><td>Venue & Staffing</td><td class="r">${fmt(calc.venue)}</td></tr>
<tr><td>Production</td><td class="r">${fmt(calc.production)}</td></tr>
<tr><td>Marketing</td><td class="r">${fmt(calc.marketing)}</td></tr>
<tr class="grand"><td>Total Event Costs</td><td class="r">${fmt(calc.total)}</td></tr>
<tr><td>Profit Margin (${margin}%)</td><td class="r">${fmt(calc.profit)}</td></tr>
<tr class="grand"><td>Target Revenue</td><td class="r">${fmt(calc.targetRevenue)}</td></tr>
<tr class="highlight"><td>Recommended Ticket Price (${headcount} tickets)</td><td class="r">${fmt(calc.ticketPrice)}</td></tr>
</tbody></table></div>
${calc.barBreakeven > 0 || weeksUntil > 0 ? `<div class="notes section"><h3>Notes & Assumptions</h3>${calc.barBreakeven > 0 ? `<p><strong>Bar Minimum:</strong> The venue requires a ${fmt(barMin)} bar minimum. At ${headcount} attendees, each guest must average ${fmt(calc.barBreakeven)} in bar spend to meet this threshold.</p>` : ""}<p><strong>Marketing Runway:</strong> ${weeksUntil} weeks of promotion at ${fmt(paidAds + contentGen)}/wk combined spend (${fmt(calc.adsCost + calc.contentCost)} total).</p><p><strong>Event Duration:</strong> ${eventHours.toFixed(1)} hours (${startTime} – ${endTime}). Hourly staffing rates are multiplied by this duration.</p>${showVenueStaff ? `<p><strong>Venue Staffing:</strong> ${venueStaff.reduce((s, v) => s + v.count, 0)} staff across ${venueStaff.length} role(s) for ${eventHours.toFixed(1)} hours.</p>` : ""}</div>` : ""}
<div class="footer"><span>Beyond the Rhythm — Financial Planner</span><span>Generated ${generated}</span></div>
</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const eventHours = useMemo(() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    let start = sh * 60 + sm;
    let end = eh * 60 + em;
    if (end <= start) end += 1440;
    return (end - start) / 60;
  }, [startTime, endTime]);

  const weeksUntil = useMemo(() => {
    const diff = new Date(eventDate).getTime() - Date.now();
    return Math.max(1, Math.ceil(diff / (7 * 86400000)));
  }, [eventDate]);

  const calc = useMemo(() => {
    const talentFees = artists.reduce((s, a) => s + a.fee, 0);
    const travelCosts = artists.reduce((s, a) => s + a.travel, 0);
    const venueStaffCost = showVenueStaff ? venueStaff.reduce((s, v) => s + v.rate * v.count * eventHours, 0) : 0;
    const prodStaffCost = showProdStaff ? prodStaff.reduce((s, p) => s + p.rate * p.count, 0) : 0;
    const prodHW = audioHW + visualHW;
    const adsCost = paidAds * weeksUntil;
    const contentCost = contentGen * weeksUntil;
    const talent = talentFees + travelCosts;
    const venue = venueFee + venueStaffCost;
    const production = prodHW + prodStaffCost;
    const marketing = adsCost + contentCost;
    const total = talent + venue + production + marketing;
    const targetRevenue = total * (1 + margin / 100);
    const ticketPrice = headcount > 0 ? targetRevenue / headcount : 0;
    const profit = targetRevenue - total;
    const barBreakeven = barMin > 0 && headcount > 0 ? barMin / headcount : 0;
    return { talent, venue, production, marketing, total, targetRevenue, ticketPrice, profit, barBreakeven, talentFees, travelCosts, venueStaffCost, prodStaffCost, prodHW, adsCost, contentCost };
  }, [artists, venueFee, barMin, audioHW, visualHW, showVenueStaff, venueStaff, showProdStaff, prodStaff, paidAds, contentGen, headcount, margin, eventHours, weeksUntil]);

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const inputClass = "w-20 bg-surface border border-border rounded-lg px-2 py-2 text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-magenta";
  const dateInputClass = "bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-magenta [color-scheme:dark]";
  const nameInputClass = "bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground w-36 focus:outline-none focus:ring-1 focus:ring-magenta";

  function CostRow({ label, children, muted }: { label: string; children: React.ReactNode; muted?: boolean }) {
    return (
      <div className="flex items-center justify-between gap-4">
        <label className={`text-sm shrink-0 ${muted ? "text-foreground-muted" : ""}`}>{label}</label>
        <div className="flex items-center gap-1.5 shrink-0">{children}</div>
      </div>
    );
  }

  function DollarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
      <>
        <span className="text-foreground-muted text-sm">$</span>
        <input type="number" value={value} onChange={(e) => onChange(+e.target.value)} className={inputClass} />
      </>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="font-heading text-2xl font-bold">Ticket Calculator</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Dropdown
            label="Event"
            options={eventNames.map((k) => ({ value: k, label: k }))}
            value={selectedEvent}
            onChange={loadEvent}
          />
          <button onClick={exportPDF} className="btn btn--gradient btn--sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-5">Event Details</h2>
            <div className="space-y-3">
              <CostRow label="Event Date"><input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={dateInputClass} /></CostRow>
              <CostRow label="Start Time"><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={dateInputClass} /></CostRow>
              <CostRow label="End Time"><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={dateInputClass} /></CostRow>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-5">Talent Costs</h2>
            {artists.map((a, i) => (
              <div key={i} className="border-l-2 border-border pl-4 mb-5">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <input value={a.name} onChange={(e) => { const n = [...artists]; n[i].name = e.target.value; setArtists(n); }} className={nameInputClass + " w-40"} />
                  <button onClick={() => setArtists(artists.filter((_, j) => j !== i))} className="text-foreground-muted hover:text-coral shrink-0"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-3">
                  <CostRow label="Talent Fee" muted><DollarInput value={a.fee} onChange={(v) => { const n = [...artists]; n[i].fee = v; setArtists(n); }} /></CostRow>
                  <CostRow label="Travel / Hospitality" muted><DollarInput value={a.travel} onChange={(v) => { const n = [...artists]; n[i].travel = v; setArtists(n); }} /></CostRow>
                </div>
              </div>
            ))}
            <button onClick={() => setArtists([...artists, { name: "", fee: 0, travel: 0 }])} className="text-sm text-foreground-muted hover:text-foreground border border-border rounded-lg px-4 py-2 flex items-center gap-1.5">
              <Plus className="w-3 h-3" /> Add Artist
            </button>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-5">Production Costs</h2>
            <div className="space-y-3">
              <CostRow label="Venue Fee"><DollarInput value={venueFee} onChange={setVenueFee} /></CostRow>
              <CostRow label="Bar Minimum"><DollarInput value={barMin} onChange={setBarMin} /></CostRow>
              <button onClick={() => setShowVenueStaff(!showVenueStaff)} className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground">
                {showVenueStaff ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />} Venue Staffing
              </button>
              {showVenueStaff && venueStaff.map((v, i) => (
                <div key={i} className="border-l-2 border-border pl-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <input value={v.role} onChange={(e) => { const n = [...venueStaff]; n[i].role = e.target.value; setVenueStaff(n); }} className={nameInputClass} />
                    <button onClick={() => setVenueStaff(venueStaff.filter((_, j) => j !== i))} className="text-foreground-muted hover:text-coral shrink-0"><X className="w-3 h-3" /></button>
                  </div>
                  <CostRow label="Hourly Rate" muted><DollarInput value={v.rate} onChange={(val) => { const n = [...venueStaff]; n[i].rate = val; setVenueStaff(n); }} /></CostRow>
                  <CostRow label="Team Size" muted><input type="number" value={v.count} onChange={(e) => { const n = [...venueStaff]; n[i].count = +e.target.value; setVenueStaff(n); }} className={inputClass} /></CostRow>
                </div>
              ))}
              <CostRow label="Audio Hardware"><DollarInput value={audioHW} onChange={setAudioHW} /></CostRow>
              <CostRow label="Visual Hardware"><DollarInput value={visualHW} onChange={setVisualHW} /></CostRow>
              <button onClick={() => setShowProdStaff(!showProdStaff)} className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground">
                {showProdStaff ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />} Production Staffing
              </button>
              {showProdStaff && prodStaff.map((p, i) => (
                <div key={i} className="border-l-2 border-border pl-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <input value={p.role} onChange={(e) => { const n = [...prodStaff]; n[i].role = e.target.value; setProdStaff(n); }} className={nameInputClass} />
                    <button onClick={() => setProdStaff(prodStaff.filter((_, j) => j !== i))} className="text-foreground-muted hover:text-coral shrink-0"><X className="w-3 h-3" /></button>
                  </div>
                  <CostRow label="Fee" muted><DollarInput value={p.rate} onChange={(val) => { const n = [...prodStaff]; n[i].rate = val; setProdStaff(n); }} /></CostRow>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-5">Marketing Costs</h2>
            <p className="text-xs text-foreground-muted mb-3">{weeksUntil} weeks until event</p>
            <div className="space-y-3">
              <CostRow label="Paid Ads / Week"><DollarInput value={paidAds} onChange={setPaidAds} /></CostRow>
              <CostRow label="Content Gen / Week"><DollarInput value={contentGen} onChange={setContentGen} /></CostRow>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-5">Attendance Goal</h2>
            <div className="space-y-3">
              <CostRow label="Expected Headcount"><input type="number" value={headcount} onChange={(e) => setHeadcount(+e.target.value)} className={inputClass} /></CostRow>
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm shrink-0">Profit Margin</label>
                <div className="flex items-center gap-3 shrink-0">
                  <input type="range" min={0} max={50} value={margin} onChange={(e) => setMargin(+e.target.value)} className="w-28 accent-magenta" />
                  <span className="text-sm font-bold w-10 text-right">{margin}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-80 xl:shrink-0">
          <div ref={breakdownRef} className="xl:sticky xl:top-4 bg-surface border border-border rounded-xl p-5">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-5">Cost Breakdown</h3>
            <div className="space-y-2 text-sm">
              <p className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted pt-1">Talent</p>
              <div className="flex justify-between"><span className="text-foreground-muted">Talent Fees</span><span>{fmt(calc.talentFees)}</span></div>
              <div className="flex justify-between"><span className="text-foreground-muted">Travel / Hospitality</span><span>{fmt(calc.travelCosts)}</span></div>
              <p className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted pt-4">Venue</p>
              <div className="flex justify-between"><span className="text-foreground-muted">Venue Fee</span><span>{fmt(venueFee)}</span></div>
              {showVenueStaff && <div className="flex justify-between"><span className="text-foreground-muted">Venue Staffing</span><span>{fmt(calc.venueStaffCost)}</span></div>}
              <p className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted pt-4">Production</p>
              <div className="flex justify-between"><span className="text-foreground-muted">Audio + Visual HW</span><span>{fmt(calc.prodHW)}</span></div>
              {showProdStaff && <div className="flex justify-between"><span className="text-foreground-muted">Production Staff</span><span>{fmt(calc.prodStaffCost)}</span></div>}
              <p className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted pt-4">Marketing</p>
              <div className="flex justify-between"><span className="text-foreground-muted">Paid Ads ({weeksUntil}wk)</span><span>{fmt(calc.adsCost)}</span></div>
              <div className="flex justify-between"><span className="text-foreground-muted">Content ({weeksUntil}wk)</span><span>{fmt(calc.contentCost)}</span></div>
            </div>
            <div className="border-t border-border mt-5 pt-5 space-y-3">
              <div className="flex justify-between text-base font-bold"><span>Total Costs</span><span>{fmt(calc.total)}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Target Revenue</span><span>{fmt(calc.targetRevenue)}</span></div>
              <div className="flex justify-between text-sm text-foreground-muted"><span>Profit</span><span>{fmt(calc.profit)}</span></div>
            </div>
            <div className="border-t border-border mt-5 pt-5 text-center">
              <p className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-2">Recommended Ticket Price</p>
              <p className="font-heading text-4xl font-bold gradient-text">{fmt(calc.ticketPrice)}</p>
              <p className="text-xs text-foreground-muted mt-2">Per Ticket Across {headcount} Tickets</p>
            </div>
            {calc.barBreakeven > 0 && (
              <div className="mt-5 p-4 rounded-lg bg-ink/50 border border-border">
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Bar Minimum: each attendee must spend <span className="font-bold text-foreground">{fmt(calc.barBreakeven)}</span> at the bar to cover the {fmt(barMin)} minimum.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
