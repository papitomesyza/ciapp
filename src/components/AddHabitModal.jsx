import { useState } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { api } from '../api.js';
import { HABIT_CATEGORIES, HABIT_PRESETS, HABIT_ACCENT_COLORS, HABIT_EMOJI_CHOICES } from '../habitPresets.js';

const EMPTY_FORM = { name: '', emoji: HABIT_EMOJI_CHOICES[0], color: HABIT_ACCENT_COLORS[0], target_count: 1 };

export default function AddHabitModal({ onClose, onAdded }) {
  const [mode, setMode] = useState('gallery'); // 'gallery' | 'custom'
  const [category, setCategory] = useState(HABIT_CATEGORIES[0]);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  async function addPreset(preset) {
    if (adding) return;
    setAdding(true);
    try {
      await api.createHabit({ name: preset.name, emoji: preset.emoji, target_count: preset.target_count });
      await onAdded();
    } finally {
      setAdding(false);
    }
  }

  async function handleCreateCustom() {
    if (!form.name.trim() || adding) return;
    setAdding(true);
    try {
      await api.createHabit(form);
      await onAdded();
    } finally {
      setAdding(false);
    }
  }

  const q = query.trim().toLowerCase();
  const presets = q
    ? Object.values(HABIT_PRESETS).flat().filter((p) => p.name.toLowerCase().includes(q))
    : HABIT_PRESETS[category];

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>{mode === 'gallery' ? 'Add habit' : 'Create custom habit'}</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {mode === 'gallery' ? (
          <div className="sheet-body">
            <button className="template-custom-btn" onClick={() => setMode('custom')}>
              <Plus size={18} /> Create custom habit
            </button>

            <div className="template-search">
              <Search size={15} />
              <input placeholder="Search habits…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>

            {!q && (
              <div className="template-category-tabs">
                {HABIT_CATEGORIES.map((c) => (
                  <button key={c} className={c === category ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>
                ))}
              </div>
            )}

            <div className="template-list">
              {presets.length === 0 && <div className="empty-state">No matches.</div>}
              {presets.map((preset) => (
                <button key={preset.name} className="template-row" disabled={adding} onClick={() => addPreset(preset)}>
                  <span className="template-emoji">{preset.emoji}</span>
                  <span className="template-name">{preset.name}</span>
                  <Plus size={16} className="template-add-icon" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="sheet-body">
            <div className="field">
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Drink water"
                autoFocus
              />
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
              <label>Daily target (optional, default 1)</label>
              <input
                type="number"
                min="1"
                value={form.target_count}
                onChange={(e) => setForm((f) => ({ ...f, target_count: Math.max(1, Number(e.target.value) || 1) }))}
              />
            </div>

            <button className="btn btn-primary btn-block" disabled={adding || !form.name.trim()} onClick={handleCreateCustom}>
              {adding ? 'Adding…' : 'Add habit'}
            </button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => setMode('gallery')}>
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
