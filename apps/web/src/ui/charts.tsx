// Lightweight SVG charts (no chart library) — they inherit theme colours from CSS variables.
export function Donut({ pct, color = '#3b6cf6', size = 120, label }: { pct: number | null; color?: string; size?: number; label?: string }) {
  const r = 46, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, pct || 0));
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={`${v}%`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--panel-2)" strokeWidth="12" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(c * v) / 100} ${c}`} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray .8s' }} />
      <text x="60" y={label ? 60 : 67} textAnchor="middle" fontSize="24" fontWeight="800" fill="currentColor">{label ?? `${v}%`}</text>
      {label && <text x="60" y="80" textAnchor="middle" fontSize="11" fill="var(--ink-3)">{v}%</text>}
    </svg>
  );
}
export function RingLevel({ level }: { level: { level: number; pct: number } }) {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 76 76" width="76" height="76">
      <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="7" />
      <circle cx="38" cy="38" r={r} fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(c * level.pct) / 100} ${c}`} transform="rotate(-90 38 38)" />
      <text x="38" y="35" textAnchor="middle" fontSize="10" fill="#dbe5ff" fontWeight="600">LEVEL</text>
      <text x="38" y="52" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff">{level.level}</text>
    </svg>
  );
}
type Item = { name: string; short?: string; value: number | null; color: string };
export function Bars({ items }: { items: Item[] }) {
  return <div style={{ width: '100%' }}>{items.map((x) => (
    <div key={x.name} style={{ margin: '10px 0' }}><div className="row spread small"><b>{x.name}</b><span className="muted">{x.value == null ? '–' : `${x.value}%`}</span></div>
      <div className="bar"><i style={{ width: `${x.value || 0}%`, background: x.color }} /></div></div>))}</div>;
}
export function Radar({ items }: { items: Item[] }) {
  if (items.length < 3) return <Bars items={items} />;
  const n = items.length, cx = 160, cy = 150, R = 100;
  const pt = (i: number, f: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f]; };
  const poly = items.map((it, i) => pt(i, Math.max(0.04, (it.value || 0) / 100)).join(',')).join(' ');
  return (
    <svg viewBox="-20 0 360 300" width="100%" style={{ maxWidth: 400 }}>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={items.map((_, i) => pt(i, f).join(',')).join(' ')} fill="none" stroke="var(--line)" />)}
      {items.map((_, i) => <line key={i} x1={cx} y1={cy} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke="var(--line)" />)}
      <polygon points={poly} fill="rgba(59,108,246,.18)" stroke="#3b6cf6" strokeWidth="2.5" strokeLinejoin="round" />
      {items.map((it, i) => { const [x, y] = pt(i, Math.max(0.04, (it.value || 0) / 100)); return <circle key={i} cx={x} cy={y} r="4.5" fill={it.color} stroke="var(--panel)" strokeWidth="2"><title>{`${it.name}: ${it.value == null ? 'no data' : it.value + '%'}`}</title></circle>; })}
      {items.map((it, i) => { const [x, y] = pt(i, 1.2); const anchor = Math.abs(x - cx) < 10 ? 'middle' : x > cx ? 'start' : 'end'; return <text key={i} x={x} y={y + 4} textAnchor={anchor} fontSize="11" fill="var(--ink-2)" fontWeight="600">{it.short || it.name}</text>; })}
    </svg>
  );
}
export function LineChart({ points, h = 200, color = '#3b6cf6' }: { points: { label: string; title?: string; value: number; tag?: string | number | null }[]; h?: number; color?: string }) {
  if (!points.length) return <div className="empty small"><div className="e">📈</div>No exam results yet — take a checkpoint to see your trend.</div>;
  const W = 560, H = h, pl = 36, pr = 16, pt = 18, pb = 30;
  const xs = (i: number) => pl + (points.length === 1 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (points.length - 1));
  const ys = (v: number) => pt + (1 - v / 100) * (H - pt - pb);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${xs(i)},${ys(p.value)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".25" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {[0, 25, 50, 75, 100].map((v) => <g key={v}><line x1={pl} x2={W - pr} y1={ys(v)} y2={ys(v)} stroke="var(--line)" strokeDasharray="3 4" /><text x={pl - 8} y={ys(v) + 4} textAnchor="end" fontSize="11" fill="var(--ink-3)">{v}</text></g>)}
      <path d={`${path} L${xs(points.length - 1)},${ys(0)} L${xs(0)},${ys(0)} Z`} fill="url(#lg)" />
      <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => <g key={i}><circle cx={xs(i)} cy={ys(p.value)} r="5" fill={color} stroke="var(--panel)" strokeWidth="2.5"><title>{`${p.title || p.label}: ${p.value}%`}</title></circle>
        {points.length <= 12 && <text x={xs(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--ink-3)">{p.label}</text>}
        {p.tag != null && <text x={xs(i)} y={ys(p.value) - 12} textAnchor="middle" fontSize="12" fontWeight="800" fill={color}>{p.tag}</text>}</g>)}
    </svg>
  );
}
export function BarChart({ data, h = 200, color = '#3b6cf6', fmt = (v: number) => String(v) }: { data: { label: string; short?: string; value: number }[]; h?: number; color?: string; fmt?: (v: number) => string }) {
  const W = 600, H = h, pl = 40, pb = 26, pt = 12; const max = Math.max(1, ...data.map((d) => d.value)); const bw = (W - pl - 10) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%">
      {[0, 0.5, 1].map((f) => <g key={f}><line x1={pl} x2={W} y1={H - pb - f * (H - pb - pt)} y2={H - pb - f * (H - pb - pt)} stroke="var(--line)" strokeDasharray="3 4" /><text x={pl - 6} y={H - pb - f * (H - pb - pt) + 4} fontSize="10.5" textAnchor="end" fill="var(--ink-3)">{fmt(Math.round(max * f * 100) / 100)}</text></g>)}
      {data.map((d, i) => { const bh = (d.value / max) * (H - pb - pt); const x = pl + i * bw + bw * 0.18; return <g key={i}><rect x={x} y={H - pb - bh} width={bw * 0.64} height={Math.max(bh, d.value ? 2 : 0)} rx="3" fill={color}><title>{`${d.label}: ${fmt(d.value)}`}</title></rect>
        {i % Math.ceil(data.length / 8) === 0 && <text x={x + bw * 0.32} y={H - 8} textAnchor="middle" fontSize="10.5" fill="var(--ink-3)">{d.short || d.label}</text>}</g>; })}
    </svg>
  );
}
export function Heatmap({ days }: { days: { date: string; n: number }[] }) {
  if (!days.length) return null;
  const max = Math.max(1, ...days.map((d) => d.n)); const pad = (new Date(days[0].date).getUTCDay() + 6) % 7;
  return <div className="heatmap">{Array.from({ length: pad }, (_, i) => <i key={`p${i}`} style={{ visibility: 'hidden' }} />)}
    {days.map((d) => { const f = d.n ? 0.25 + 0.75 * (d.n / max) : 0; return <i key={d.date} title={`${d.date}: ${d.n} questions`} style={f ? { background: `rgba(59,108,246,${f.toFixed(2)})` } : undefined} />; })}</div>;
}
