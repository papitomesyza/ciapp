import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { scaleMacros, NUTRIENT_KEYS, NUTRIENT_LABELS } from '../nutrition.js';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

// food: { name, basisAmount, unit, defaultAmount, basisMacros, barcode?, source }
export default function PortionPicker({ food, defaultMeal, onClose, onConfirm }) {
  const [amount, setAmount] = useState(food.defaultAmount || food.basisAmount || 100);
  const [meal, setMeal] = useState(defaultMeal || 'snack');
  const [saving, setSaving] = useState(false);

  const scaled = useMemo(
    () => scaleMacros(food.basisMacros, food.basisAmount, amount),
    [food, amount]
  );

  async function handleSave() {
    setSaving(true);
    try {
      await onConfirm({
        food_name: food.name,
        amount: Number(amount) || 0,
        unit: food.unit,
        meal,
        source: food.source || 'search',
        ...scaled,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>{food.name}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="sheet-body">
          <div className="field-row">
            <div className="field">
              <label>Amount ({food.unit})</label>
              <input
                type="number"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Meal</label>
              <select value={meal} onChange={(e) => setMeal(e.target.value)}>
                {MEALS.map((m) => (
                  <option key={m} value={m}>
                    {m[0].toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass-card">
            {NUTRIENT_KEYS.map((key) => (
              <div key={key} className="bar-row" style={{ padding: '5px 0' }}>
                <div className="bar-labels">
                  <span>{NUTRIENT_LABELS[key]}</span>
                  <span>{scaled[key]}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={saving || !amount} onClick={handleSave}>
            {saving ? 'Logging…' : 'Log it'}
          </button>
        </div>
      </div>
    </div>
  );
}
