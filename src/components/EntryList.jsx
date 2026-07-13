import { Pencil, Trash2 } from 'lucide-react';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

export default function EntryList({ entries, onEdit, onDelete }) {
  if (!entries.length) {
    return <div className="empty-state">Nothing logged yet. Tap the + button to add your first entry.</div>;
  }

  const grouped = {};
  for (const meal of MEAL_ORDER) grouped[meal] = [];
  for (const e of entries) {
    if (!grouped[e.meal]) grouped[e.meal] = [];
    grouped[e.meal].push(e);
  }

  return (
    <div>
      {MEAL_ORDER.filter((m) => grouped[m].length).map((meal) => {
        const mealEntries = grouped[meal];
        const mealCals = mealEntries.reduce((sum, e) => sum + e.calories, 0);
        return (
          <div className="meal-group" key={meal}>
            <div className="meal-group-title">
              <span>{MEAL_LABELS[meal]}</span>
              <span>{Math.round(mealCals)} kcal</span>
            </div>
            <div className="glass-card">
              {mealEntries.map((entry) => (
                <div className="entry-row" key={entry.id}>
                  <div className="entry-info">
                    <div className="entry-name">{entry.food_name}</div>
                    <div className="entry-meta">
                      {entry.amount}{entry.unit} · P{Math.round(entry.protein_g)} C{Math.round(entry.carbs_g)} F{Math.round(entry.fat_g)}
                    </div>
                  </div>
                  <div className="entry-cals">{Math.round(entry.calories)}</div>
                  <div className="entry-actions">
                    <button className="icon-btn" onClick={() => onEdit(entry)} aria-label="Edit entry">
                      <Pencil size={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => onDelete(entry)} aria-label="Delete entry">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
