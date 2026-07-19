import { useEffect, useState } from 'react';
import { X, Flame, Trophy, Archive, ArchiveRestore, Trash2, Pencil } from 'lucide-react';
import { api } from '../api.js';
import { HABIT_ACCENT_COLORS, HABIT_EMOJI_CHOICES } from '../habitPresets.js';

export default function HabitDetailModal({ habitId, onClose, onChanged, onDeleted }) {
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const d = await api.getHabitDetail(habitId);
    setDetail(d);
    setForm({ name: d.habit.name, emoji: d.habit.emoji, color: d.habit.color, target_count: d.habit.target_count });
  }

  useEffect(() => { load(); }, [habitId]);

  if (!detail) {
    return (
      <div className="sheet-backdrop" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-header">
            <h2>Habit</h2>
            <button className="icon-btn" onClick={onClose}><X size={20} /></button>
          </div>
          <div className="sheet-body">
            <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
          </div>
        </div>
      </div>
    );
  }

  const { habit, currentStreak, bestStreak, last30 } = detail;

  async function handleSaveEdit() {
    setSaving(true);
    try {
      await api.updateHabit(habit.id, form);
      setEditing(false);
      await load();
      await onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveToggle() {
    await api.updateHabit(habit.id, { archived: !habit.archived });
    await load();
    await onChanged();
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${habit.name}" and all its history? This can't be undone.`)) return;
    await api.deleteHabit(habit.id);
    await onDeleted();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>{habit.emoji} {habit.name}</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="sheet-body">
          {!editing ? (
            <>
              <div className="habit-streak-row">
                <div className="glass-card habit-streak-card">
                  <div className="card-header" style={{ color: habit.color }}><Flame size={16} /> Current streak</div>
                  <div className="habit-streak-value">{currentStreak}<span> day{currentStreak === 1 ? '' : 's'}</span></div>
                </div>
                <div className="glass-card habit-streak-card">
                  <div className="card-header" style={{ color: 'var(--accent)' }}><Trophy size={16} /> Best streak</div>
                  <div className="habit-streak-value">{bestStreak}<span> day{bestStreak === 1 ? '' : 's'}</span></div>
                </div>
              </div>

              <div className="list-section-title">Last 30 days</div>
              <div className="habit-grid">
                {last30.map((d) => (
                  <div
                    key={d.date}
                    className={`habit-grid-cell ${d.completed ? 'met' : ''}`}
                    style={d.completed ? { background: habit.color } : undefined}
                    title={`${d.date}: ${d.count}/${habit.target_count}`}
                  />
                ))}
              </div>

              <div className="list-section-title">Manage</div>
              <div className="glass-card">
                <button className="btn btn-ghost btn-block" onClick={() => setEditing(true)}>
                  <Pencil size={16} /> Edit
                </button>
                <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={handleArchiveToggle}>
                  {habit.archived ? <><ArchiveRestore size={16} /> Unarchive</> : <><Archive size={16} /> Archive</>}
                </button>
                <button className="btn btn-danger btn-block" style={{ marginTop: 10 }} onClick={handleDelete}>
                  <Trash2 size={16} /> Delete habit
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="field">
                <label>Emoji</label>
                <div className="emoji-picker">
                  {HABIT_EMOJI_CHOICES.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className={`emoji-choice ${form.emoji === e ? 'active' : ''}`}
                      onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                    >{e}</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Accent color</label>
                <div className="color-picker">
                  {HABIT_ACCENT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-swatch ${form.color === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                    />
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Daily target</label>
                <input
                  type="number"
                  min="1"
                  value={form.target_count}
                  onChange={(e) => setForm((f) => ({ ...f, target_count: Math.max(1, Number(e.target.value) || 1) }))}
                />
              </div>
              <button className="btn btn-primary btn-block" disabled={saving || !form.name.trim()} onClick={handleSaveEdit}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => setEditing(false)}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
