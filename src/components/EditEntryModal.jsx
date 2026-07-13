import { useState } from 'react';
import { X } from 'lucide-react';
import { NUTRIENT_KEYS, NUTRIENT_LABELS, NUTRIENT_UNITS } from '../nutrition.js';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function EditEntryModal({ entry, onClose, onSave }) {
  const [form, setForm] = useState({ ...entry });
  const [saving, setSaving] = useState(false);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>Edit entry</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="sheet-body">
          <div className="field">
            <label>Food</label>
            <input value={form.food_name} onChange={(e) => setField('food_name', e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Amount</label>
              <input type="number" value={form.amount} onChange={(e) => setField('amount', e.target.value)} />
            </div>
            <div className="field">
              <label>Unit</label>
              <input value={form.unit} onChange={(e) => setField('unit', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Meal</label>
            <select value={form.meal} onChange={(e) => setField('meal', e.target.value)}>
              {MEALS.map((m) => (
                <option key={m} value={m}>
                  {m[0].toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="field-row">
            {NUTRIENT_KEYS.slice(0, 4).map((key) => (
              <div className="field" key={key}>
                <label>{NUTRIENT_LABELS[key]} ({NUTRIENT_UNITS[key]})</label>
                <input type="number" value={form[key]} onChange={(e) => setField(key, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="field-row">
            {NUTRIENT_KEYS.slice(4).map((key) => (
              <div className="field" key={key}>
                <label>{NUTRIENT_LABELS[key]} ({NUTRIENT_UNITS[key]})</label>
                <input type="number" value={form[key]} onChange={(e) => setField(key, e.target.value)} />
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-block" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
