import { useEffect, useState, useCallback } from 'react';
import { Plus, Flame, Gauge, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api.js';
import { sumMacros, todayISO, formatDateLabel } from '../nutrition.js';
import MacroRing from '../components/MacroRing.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import EntryList from '../components/EntryList.jsx';
import EditEntryModal from '../components/EditEntryModal.jsx';
import LogSheet from '../components/LogSheet.jsx';

function currentMealGuess() {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}

function shiftDate(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

export default function Today() {
  const [entries, setEntries] = useState([]);
  const [targets, setTargets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [date, setDate] = useState(todayISO());
  const isToday = date === todayISO();

  const load = useCallback(async () => {
    setLoading(true);
    const [entriesData, targetsData] = await Promise.all([api.getEntries({ date }), api.getTargets()]);
    setEntries(entriesData);
    setTargets(targetsData);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLogged(entry) {
    await api.createEntry({ ...entry, date });
    await load();
  }

  async function handleSaveEdit(form) {
    await api.updateEntry(form.id, form);
    setEditing(null);
    await load();
  }

  async function handleDelete(entry) {
    if (!window.confirm(`Remove ${entry.food_name}?`)) return;
    await api.deleteEntry(entry.id);
    await load();
  }

  const totals = sumMacros(entries);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">{formatDateLabel(date)}</div>
          <h1>{isToday ? 'Today' : 'Log entry'}</h1>
        </div>
        <div className="range-nav" style={{ alignSelf: 'center' }}>
          <button aria-label="Previous day" onClick={() => setDate((d) => shiftDate(d, -1))}>
            <ChevronLeft size={18} />
          </button>
          {!isToday && (
            <button onClick={() => setDate(todayISO())} aria-label="Jump to today">
              <span style={{ fontSize: 11, fontWeight: 700, padding: '0 4px' }}>Today</span>
            </button>
          )}
          <button aria-label="Next day" disabled={isToday} onClick={() => setDate((d) => shiftDate(d, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading || !targets ? (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 10px' }} />
          Loading…
        </div>
      ) : (
        <>

      <div className="glass-card">
        <div className="card-header" style={{ color: 'var(--accent)' }}>
          <Flame size={16} />
          Macros
        </div>
        <div className="rings-grid">
          <MacroRing label="Calories" value={totals.calories} target={targets.calories_target} unit="" color="var(--accent)" />
          <MacroRing label="Protein" value={totals.protein_g} target={targets.protein_g_target} unit="g" color="var(--protein)" />
          <MacroRing label="Carbs" value={totals.carbs_g} target={targets.carbs_g_target} unit="g" color="var(--carbs)" />
          <MacroRing label="Fat" value={totals.fat_g} target={targets.fat_g_target} unit="g" color="var(--fat)" />
        </div>
      </div>

      <div className="glass-card">
        <div className="card-header" style={{ color: 'var(--sodium)' }}>
          <Gauge size={16} />
          Nutrients
        </div>
        <ProgressBar label="Fiber" value={totals.fiber_g} target={targets.fiber_g_target} unit="g" color="var(--fiber)" />
        <ProgressBar label="Sugar" value={totals.sugar_g} target={targets.sugar_g_target} unit="g" color="var(--sugar)" />
        <ProgressBar label="Sodium" value={totals.sodium_mg} target={targets.sodium_mg_target} unit="mg" color="var(--sodium)" />
        <ProgressBar label="Sat. Fat" value={totals.sat_fat_g} target={targets.sat_fat_g_target} unit="g" color="var(--satfat)" />
      </div>

      <EntryList entries={entries} onEdit={setEditing} onDelete={handleDelete} />

      <button className="fab" onClick={() => setShowLog(true)} aria-label="Log food">
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {showLog && (
        <LogSheet defaultMeal={currentMealGuess()} onClose={() => setShowLog(false)} onLogged={handleLogged} />
      )}
      {editing && (
        <EditEntryModal entry={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} />
      )}
        </>
      )}
    </div>
  );
}
