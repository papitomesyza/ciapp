import { NUTRIENT_KEYS, NUTRIENT_LABELS, NUTRIENT_UNITS } from './nutrition.js';
import { MEAL_ORDER, MEAL_LABELS } from './components/EntryList.jsx';

// Calories: within +/-10% of target is "on goal"; outside that is over/under.
// With zero logged days there's nothing to judge — "unknown", not "under".
export function calorieStatus(avgCalories, target, loggedDays = 1) {
  if (!target || target <= 0 || !loggedDays) return { status: 'unknown', delta: 0 };
  const delta = avgCalories - target;
  const pct = delta / target;
  const status = pct > 0.1 ? 'over' : pct < -0.1 ? 'under' : 'on';
  return { status, delta: Math.round(delta) };
}

// Protein is a floor: met at or above target, under otherwise. Same
// zero-logged-days guard as calorieStatus.
export function proteinStatus(avgProtein, target, loggedDays = 1) {
  if (!target || target <= 0 || !loggedDays) return { status: 'unknown', delta: 0 };
  const delta = avgProtein - target;
  return { status: delta >= 0 ? 'met' : 'under', delta: Math.round(delta * 10) / 10 };
}

export const STATUS_LABEL = { on: 'On goal', met: 'Met', over: 'Over', under: 'Under', unknown: 'No data' };
export const STATUS_COLOR = {
  on: 'var(--accent)',
  met: 'var(--accent)',
  over: 'var(--sugar)',
  under: 'var(--sodium)',
  unknown: 'var(--text-faint)',
};

export function monthLabel(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function monthShortLabel(monthNum, year) {
  return new Date(Date.UTC(year, monthNum - 1, 1)).toLocaleDateString(undefined, { month: 'long', timeZone: 'UTC' });
}

export function weekLabel(start, end) {
  const startD = new Date(`${start}T00:00:00`);
  const endD = new Date(`${end}T00:00:00`);
  const startStr = startD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endStr = endD.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

export function fullDateLabel(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function fmt(key, value) {
  const n = Math.round((Number(value) || 0) * 10) / 10;
  return `${n}${NUTRIENT_UNITS[key] === 'kcal' ? ' kcal' : NUTRIENT_UNITS[key]}`;
}

function totalsLine(totals) {
  return NUTRIENT_KEYS.map((key) => `${NUTRIENT_LABELS[key]} ${fmt(key, totals[key])}`).join(' · ');
}

// --- Copy-to-plain-text builders -------------------------------------------
// Plain, readable text meant for pasting into notes/messages — not CSV/JSON.

export function buildDayCopyText({ date, totals, entries }) {
  const lines = [fullDateLabel(date), '', totalsLine(totals)];

  const grouped = {};
  for (const meal of MEAL_ORDER) grouped[meal] = [];
  for (const e of entries) {
    if (!grouped[e.meal]) grouped[e.meal] = [];
    grouped[e.meal].push(e);
  }

  for (const meal of MEAL_ORDER) {
    const mealEntries = grouped[meal];
    if (!mealEntries.length) continue;
    lines.push('', MEAL_LABELS[meal]);
    for (const e of mealEntries) {
      lines.push(`- ${e.food_name} — ${e.amount}${e.unit} (${Math.round(e.calories)} kcal)`);
    }
  }

  return lines.join('\n');
}

export function buildWeekCopyText({ label, loggedDays, averages, targets, days }) {
  const lines = [label, '', `${loggedDays} logged day${loggedDays === 1 ? '' : 's'}`];

  if (loggedDays === 0) {
    lines.push('No data logged this week.');
    return lines.join('\n');
  }

  const cal = calorieStatus(averages.calories, targets.calories_target, loggedDays);
  const pro = proteinStatus(averages.protein_g, targets.protein_g_target, loggedDays);
  lines.push(
    `Calories: avg ${Math.round(averages.calories)} kcal/day vs ${Math.round(targets.calories_target)} target — ${STATUS_LABEL[cal.status]} (${cal.delta >= 0 ? '+' : ''}${cal.delta}/day)`,
    `Protein: avg ${Math.round(averages.protein_g)} g/day vs ${Math.round(targets.protein_g_target)} g floor — ${STATUS_LABEL[pro.status]} (${pro.delta >= 0 ? '+' : ''}${pro.delta}/day)`,
    '',
  );

  for (const d of days.filter((d) => d.entryCount > 0)) {
    lines.push(`${fullDateLabel(d.date)}: ${Math.round(d.totals.calories)} kcal, ${Math.round(d.totals.protein_g)}g protein`);
  }

  return lines.join('\n');
}

export function buildMonthCopyText({ label, loggedDays, averages, targets, days }) {
  const lines = [label, '', `${loggedDays} logged day${loggedDays === 1 ? '' : 's'}`];

  if (loggedDays === 0) {
    lines.push('No data logged this month.');
    return lines.join('\n');
  }

  const cal = calorieStatus(averages.calories, targets.calories_target, loggedDays);
  const pro = proteinStatus(averages.protein_g, targets.protein_g_target, loggedDays);
  lines.push(
    `Calories: avg ${Math.round(averages.calories)} kcal/day vs ${Math.round(targets.calories_target)} target — ${STATUS_LABEL[cal.status]} (${cal.delta >= 0 ? '+' : ''}${cal.delta}/day)`,
    `Protein: avg ${Math.round(averages.protein_g)} g/day vs ${Math.round(targets.protein_g_target)} g floor — ${STATUS_LABEL[pro.status]} (${pro.delta >= 0 ? '+' : ''}${pro.delta}/day)`,
    '',
  );

  for (const d of days.filter((d) => d.entryCount > 0)) {
    lines.push(`${d.date}: ${Math.round(d.totals.calories)} kcal, ${Math.round(d.totals.protein_g)}g protein`);
  }

  return lines.join('\n');
}

export function buildYearCopyText({ year, months, targets }) {
  const lines = [String(year), ''];

  for (const m of months) {
    const label = monthShortLabel(m.month, year);
    if (m.loggedDays === 0) {
      lines.push(`${label}: no logged days`);
      continue;
    }
    const cal = calorieStatus(m.averages.calories, targets.calories_target, m.loggedDays);
    const pro = proteinStatus(m.averages.protein_g, targets.protein_g_target, m.loggedDays);
    lines.push(
      `${label}: avg ${Math.round(m.averages.calories)} kcal (target ${Math.round(targets.calories_target)}, ${STATUS_LABEL[cal.status]}), `
      + `avg ${Math.round(m.averages.protein_g)}g protein (${STATUS_LABEL[pro.status]}) — ${m.loggedDays} logged day${m.loggedDays === 1 ? '' : 's'}`
    );
  }

  return lines.join('\n');
}

export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

// Pure calendar-date arithmetic (UTC-anchored so the browser's local
// timezone never leaks in) — used only to page an already-resolved range
// forward/back by a day. The server resolves what week/month/year that
// lands in, so no "today" computation is needed on the client.
export function addDaysStr(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

// Paging a resolved range: the day after its end / the day before its start
// always lands in the next/previous week, month, or year respectively.
export function nextRangeAnchor(range) {
  return addDaysStr(range.end, 1);
}

export function prevRangeAnchor(range) {
  return addDaysStr(range.start, -1);
}

// 1 = Monday .. 7 = Sunday, for building a Monday-start calendar grid.
export function isoWeekdayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}
