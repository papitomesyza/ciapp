import { useState } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import { NUTRIENT_KEYS, NUTRIENT_LABELS } from '../nutrition.js';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function AITab({ defaultMeal, onLogged }) {
  const [text, setText] = useState('');
  const [items, setItems] = useState(null);
  const [meal, setMeal] = useState(defaultMeal || 'snack');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setItems(null);
    try {
      const data = await api.aiParse(text.trim());
      if (data.error && (!data.items || data.items.length === 0)) {
        setError(data.error);
      }
      setItems(data.items || []);
    } catch {
      setError('Could not reach the AI parser. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function updateItem(index, key, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      for (const item of items) {
        await onLogged({
          food_name: item.name,
          amount: Number(item.quantity) || 1,
          unit: item.unit || 'serving',
          meal,
          source: 'ai',
          calories: Number(item.calories) || 0,
          protein_g: Number(item.protein_g) || 0,
          carbs_g: Number(item.carbs_g) || 0,
          fat_g: Number(item.fat_g) || 0,
          fiber_g: Number(item.fiber_g) || 0,
          sugar_g: Number(item.sugar_g) || 0,
          sodium_mg: Number(item.sodium_mg) || 0,
          sat_fat_g: Number(item.sat_fat_g) || 0,
        });
      }
      setText('');
      setItems(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="field">
        <label>Describe what you ate</label>
        <textarea
          rows={3}
          placeholder="e.g. 2 eggs, coffee with milk, a banana"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <button className="btn btn-primary btn-block" disabled={loading || !text.trim()} onClick={handleParse}>
        <Sparkles size={16} />
        {loading ? 'Reading…' : 'Parse with AI'}
      </button>

      {error && <div className="error-text" style={{ marginTop: 12 }}>{error}</div>}

      {items && items.length > 0 && (
        <>
          <div className="field" style={{ marginTop: 18 }}>
            <label>Meal</label>
            <select value={meal} onChange={(e) => setMeal(e.target.value)}>
              {MEALS.map((m) => (
                <option key={m} value={m}>
                  {m[0].toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {items.map((item, i) => (
            <div className="glass-card" key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <input
                  style={{ background: 'transparent', border: 'none', fontSize: 15, fontWeight: 700, flex: 1 }}
                  value={item.name}
                  onChange={(e) => updateItem(i, 'name', e.target.value)}
                />
                <button className="icon-btn danger" onClick={() => removeItem(i)}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Qty</label>
                  <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                </div>
                <div className="field">
                  <label>Unit</label>
                  <input value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} />
                </div>
              </div>
              <div className="field-row" style={{ flexWrap: 'wrap' }}>
                {NUTRIENT_KEYS.map((key) => (
                  <div className="field" key={key} style={{ minWidth: 90 }}>
                    <label>{NUTRIENT_LABELS[key]}</label>
                    <input type="number" value={item[key]} onChange={(e) => updateItem(i, key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button className="btn btn-primary btn-block" disabled={saving} onClick={handleConfirm}>
            {saving ? 'Logging…' : `Log ${items.length} item${items.length === 1 ? '' : 's'}`}
          </button>
        </>
      )}
      {items && items.length === 0 && !error && (
        <div className="empty-state">Nothing parsed from that. Try describing it differently.</div>
      )}
    </div>
  );
}
