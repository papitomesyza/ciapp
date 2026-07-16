import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatDateLabel, formatWeekdayShort } from '../nutrition.js';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{formatDateLabel(label)}</div>
      {payload.map((p) => (
        <div key={p.dataKey}>
          {p.name}: {Math.round(p.value)}
        </div>
      ))}
    </div>
  );
}

// days: [{ date, totals: { calories, protein_g, ... } }]. Ticks show short
// weekday labels for week ranges (<=7 days) and day-of-month otherwise.
export default function TrendChart({ days, compactTicks = false }) {
  const data = days.map((d) => ({ date: d.date, Calories: d.totals.calories, Protein: d.totals.protein_g }));
  const tickFormatter = compactTicks
    ? (d) => String(Number(d.slice(-2)))
    : formatWeekdayShort;

  return (
    <>
      <div className="glass-card">
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 700 }}>CALORIES</div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={data}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} interval={compactTicks ? 4 : 0} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-strong)' }} />
            <Bar dataKey="Calories" fill="var(--accent)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card">
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 700 }}>PROTEIN (G)</div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={data}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} interval={compactTicks ? 4 : 0} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-strong)' }} />
            <Bar dataKey="Protein" fill="var(--protein)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
