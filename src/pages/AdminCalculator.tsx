import { useState, useMemo } from "react";
import { Download, ChevronDown, ChevronRight, X, Plus } from "lucide-react";

interface Artist {
  name: string;
  fee: number;
  travel: number;
}

interface StaffEntry {
  role: string;
  rate: number;
  count: number;
}

export default function AdminCalculator() {
  const [eventDate, setEventDate] = useState("2026-05-01");
  const [startTime, setStartTime] = useState("20:00");
  const [endTime, setEndTime] = useState("02:00");

  const [artists, setArtists] = useState<Artist[]>([
    { name: "Chmura", fee: 2000, travel: 500 },
    { name: "Saturna", fee: 1500, travel: 200 },
  ]);

  const [venueFee, setVenueFee] = useState(2500);
  const [barMin, setBarMin] = useState(2500);
  const [audioHW, setAudioHW] = useState(1200);
  const [visualHW, setVisualHW] = useState(600);

  const [showVenueStaff, setShowVenueStaff] = useState(false);
  const [venueStaff, setVenueStaff] = useState<StaffEntry[]>([{ role: "Security", rate: 25, count: 3 }]);

  const [showProdStaff, setShowProdStaff] = useState(false);
  const [prodStaff, setProdStaff] = useState<StaffEntry[]>([{ role: "Sound Engineer", rate: 400, count: 1 }]);

  const [paidAds, setPaidAds] = useState(75);
  const [contentGen, setContentGen] = useState(50);
  const [headcount, setHeadcount] = useState(100);
  const [margin, setMargin] = useState(20);

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
    const venueStaffCost = showVenueStaff
      ? venueStaff.reduce((s, v) => s + v.rate * v.count * eventHours, 0)
      : 0;
    const prodStaffCost = showProdStaff
      ? prodStaff.reduce((s, p) => s + p.rate * p.count, 0)
      : 0;
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
        <h1 className="font-heading text-2xl font-bold">Financial Planner</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="flex items-center gap-2 text-sm border border-border rounded-lg px-3 py-2 text-foreground-muted hover:text-foreground hover:border-magenta/40 transition-colors">
            Event: BtR San Diego <ChevronDown className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-2 text-sm border border-border rounded-lg px-3 py-2 text-foreground-muted hover:text-foreground hover:border-magenta/40 transition-colors">
            Load Saved <ChevronDown className="w-3 h-3" />
          </button>
          <button className="btn btn--gradient btn--sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-5">Event Details</h2>
            <div className="space-y-3">
              <CostRow label="Event Date">
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={dateInputClass} />
              </CostRow>
              <CostRow label="Start Time">
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={dateInputClass} />
              </CostRow>
              <CostRow label="End Time">
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={dateInputClass} />
              </CostRow>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-5">Talent Costs</h2>
            {artists.map((a, i) => (
              <div key={i} className="border-l-2 border-border pl-4 mb-5">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <input
                    value={a.name}
                    onChange={(e) => { const n = [...artists]; n[i].name = e.target.value; setArtists(n); }}
                    className={nameInputClass + " w-40"}
                  />
                  <button onClick={() => setArtists(artists.filter((_, j) => j !== i))} className="text-foreground-muted hover:text-coral shrink-0">
                    <X className="w-4 h-4" />
                  </button>
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
                    <input
                      value={v.role}
                      onChange={(e) => { const n = [...venueStaff]; n[i].role = e.target.value; setVenueStaff(n); }}
                      className={nameInputClass}
                    />
                    <button onClick={() => setVenueStaff(venueStaff.filter((_, j) => j !== i))} className="text-foreground-muted hover:text-coral shrink-0">
                      <X className="w-3 h-3" />
                    </button>
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
                    <input
                      value={p.role}
                      onChange={(e) => { const n = [...prodStaff]; n[i].role = e.target.value; setProdStaff(n); }}
                      className={nameInputClass}
                    />
                    <button onClick={() => setProdStaff(prodStaff.filter((_, j) => j !== i))} className="text-foreground-muted hover:text-coral shrink-0">
                      <X className="w-3 h-3" />
                    </button>
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
              <CostRow label="Expected Headcount">
                <input type="number" value={headcount} onChange={(e) => setHeadcount(+e.target.value)} className={inputClass} />
              </CostRow>
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
          <div className="xl:sticky xl:top-4 bg-surface border border-border rounded-xl p-5">
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
              <div className="flex justify-between text-base font-bold">
                <span>Total Costs</span><span>{fmt(calc.total)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Target Revenue</span><span>{fmt(calc.targetRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm text-foreground-muted">
                <span>Profit</span><span>{fmt(calc.profit)}</span>
              </div>
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
