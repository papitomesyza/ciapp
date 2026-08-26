import { useEffect, useState, useCallback } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { api } from '../api.js';
import { fullDateLabel, buildDayCopyText, copyToClipboard } from '../history.js';
import MacroRing from './MacroRing.jsx';
import ProgressBar from './ProgressBar.jsx';
import EntryList from './EntryList.jsx';
import EditEntryModal from './EditEntryModal.jsx';

export default function DayDetailModal({ date, targets, onClose, onChanged }) {
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const [summaryData, entriesData] = await Promise.all([api.getDaySummary(date), api.getEntries({ date })]);
    setSummary(summaryData);
    setEntries(entriesData);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveEdit(form) {
    await api.updateEntry(form.id, form);
    setEditing(null);
    await load();
    onChanged?.();
  }

  async function handleDelete(entry) {
    if (!window.confirm(`Remove ${entry.food_name}?`)) return;
    await api.deleteEntry(entry.id);
    await load();
    onChanged?.();
  }

  async function handleCopy() {
    const text = buildDayCopyText({ date, totals: summary.totals, entries });
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>{fullDateLabel(date)}</h2>
          <div style={{ display: 'flex', gap: 4 }}>
            {!loading && (
              <button className="icon-btn" onClick={handleCopy} aria-label="Copy day to clipboard">
                {copied ? <Check size={18} color="var(--accent)" /> : <Copy size={18} />}
              </button>
            )}
            <button className="icon-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="sheet-body">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: '0 auto 10px' }} />
              Loading…
            </div>
          ) : (
            <>
              <div className="glass-card">
                <div className="rings-grid">
                  <MacroRing label="Calories" value={summary.totals.calories} target={targets.calories_target} unit="" color="iridescent" />
                  <MacroRing label="Protein" value={summary.totals.protein_g} target={targets.protein_g_target} unit="g" color="var(--protein)" />
                  <MacroRing label="Carbs" value={summary.totals.carbs_g} target={targets.carbs_g_target} unit="g" color="var(--carbs)" />
                  <MacroRing label="Fat" value={summary.totals.fat_g} target={targets.fat_g_target} unit="g" color="var(--fat)" />
                </div>
              </div>
              <div className="glass-card">
                <ProgressBar label="Fiber" value={summary.totals.fiber_g} target={targets.fiber_g_target} unit="g" color="var(--fiber)" />
                <ProgressBar label="Sugar" value={summary.totals.sugar_g} target={targets.sugar_g_target} unit="g" color="var(--sugar)" />
                <ProgressBar label="Sodium" value={summary.totals.sodium_mg} target={targets.sodium_mg_target} unit="mg" color="var(--sodium)" />
                <ProgressBar label="Sat. Fat" value={summary.totals.sat_fat_g} target={targets.sat_fat_g_target} unit="g" color="var(--satfat)" />
              </div>
              <EntryList entries={entries} onEdit={setEditing} onDelete={handleDelete} />
            </>
          )}
        </div>
      </div>
      {editing && <EditEntryModal entry={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} />}
    </div>
  );
}
