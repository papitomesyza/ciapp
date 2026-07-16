import { useEffect, useState, useCallback } from 'react';
import { Plus, Flame, Gauge } from 'lucide-react';
import { api } from '../api.js';
import { sumMacros, todayISO } from '../nutrition.js';
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

export default function Today() {
  const [entries, setEntries] = useState([]);
  const [targets, setTargets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [editing, setEditing] = useState(null);
  const date = todayISO();

  const load = useCallback(async () => {
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

  if (loading || !targets) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 10px' }} />
          Loading…
        </div>
      </div>
    );
  }

  const totals = sumMacros(entries);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1>Today</h1>
        </div>
      </div>

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
    </div>
  );
}
