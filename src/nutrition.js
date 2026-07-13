export const NUTRIENT_KEYS = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg', 'sat_fat_g'];

export const NUTRIENT_LABELS = {
  calories: 'Calories',
  protein_g: 'Protein',
  carbs_g: 'Carbs',
  fat_g: 'Fat',
  fiber_g: 'Fiber',
  sugar_g: 'Sugar',
  sodium_mg: 'Sodium',
  sat_fat_g: 'Sat. Fat',
};

export const NUTRIENT_UNITS = {
  calories: 'kcal',
  protein_g: 'g',
  carbs_g: 'g',
  fat_g: 'g',
  fiber_g: 'g',
  sugar_g: 'g',
  sodium_mg: 'mg',
  sat_fat_g: 'g',
};

export function scaleMacros(macrosAtBasis, basisAmount, amountEaten) {
  const basis = Number(basisAmount) || 0;
  const amount = Number(amountEaten) || 0;
  const factor = basis > 0 ? amount / basis : 0;
  const out = {};
  for (const key of NUTRIENT_KEYS) {
    out[key] = Math.round((Number(macrosAtBasis[key]) || 0) * factor * 100) / 100;
  }
  return out;
}

export function sumMacros(entries) {
  const totals = {};
  for (const key of NUTRIENT_KEYS) totals[key] = 0;
  for (const e of entries) {
    for (const key of NUTRIENT_KEYS) totals[key] += Number(e[key]) || 0;
  }
  return totals;
}

export function todayISO() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function formatDateLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatWeekdayShort(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}
