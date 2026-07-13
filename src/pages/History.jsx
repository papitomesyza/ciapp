import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../api.js';
import { formatDateLabel, formatWeekdayShort, todayISO } from '../nutrition.js';
import EntryList from '../components/EntryList.jsx';
import EditEntryModal from '../components/EditEntryModal.jsx';

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

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

export default function History() {
  const [week, setWeek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEntries, setDayEntries] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const from = daysAgoISO(6);
    const to = todayISO();
    api.getWeekSummary(from, to).then((data) => {
      setWeek(data.days);
      setLoading(false);
    });
  }, []);

  async function selectDay(date) {
    if (selectedDate === date) {
      setSelectedDate(null);
      return;
    }
    setSelectedDate(date);
    const entries = await api.getEntries({ date });
    setDayEntries(entries);
  }

  async function handleDelete(entry) {
    if (!window.confirm(`Remove ${entry.food_name}?`)) return;
    await api.deleteEntry(entry.id);
    const entries = await api.getEntries({ date: selectedDate });
    setDayEntries(entries);
  }

  async function handleSaveEdit(form) {
    await api.updateEntry(form.id, form);
    setEditing(null);
    const entries = await api.getEntries({ date: selectedDate });
    setDayEntries(entries);
  }

  const chartData = week.map((d) => ({
    date: d.date,
    Calories: d.totals.calories,
    Protein: d.totals.protein_g,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>History</h1>
          <div className="subtitle">Last 7 days</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 10px' }} />
          Loading…
        </div>
      ) : (
        <>
          <div className="glass-card">
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 700 }}>CALORIES</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatWeekdayShort} tick={{ fill: 'var(--text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-strong)' }} />
                <Bar dataKey="Calories" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 700 }}>PROTEIN (G)</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatWeekdayShort} tick={{ fill: 'var(--text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-strong)' }} />
                <Bar dataKey="Protein" fill="#4da3ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card">
            {[...week].reverse().map((d) => (
              <div key={d.date}>
                <div className="history-day-row" onClick={() => selectDay(d.date)}>
                  <span>{formatDateLabel(d.date)}</span>
                  <span>{Math.round(d.totals.calories)} kcal</span>
                </div>
                {selectedDate === d.date && (
                  <div style={{ padding: '4px 0 12px' }}>
                    <EntryList entries={dayEntries} onEdit={setEditing} onDelete={handleDelete} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {editing && <EditEntryModal entry={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} />}
    </div>
  );
}
