import { Router } from 'express';
import db from '../db.js';
import { todayInPristina, weekRange, monthRange, yearRange, yearOf, eachDateInRange } from '../lib/tz.js';

const router = Router();

const NUTRIENTS = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg', 'sat_fat_g'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function emptyTotals() {
  const t = {};
  for (const k of NUTRIENTS) t[k] = 0;
  return t;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function fetchEntriesInRange(start, end) {
  return db.prepare('SELECT * FROM entries WHERE date BETWEEN ? AND ?').all(start, end);
}

// { 'YYYY-MM-DD': { totals: {8 nutrients}, entryCount } } — this is the read-only
// aggregation boundary; nothing here writes to or reshapes the entries table.
function groupByDate(entries) {
  const byDate = {};
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = { totals: emptyTotals(), entryCount: 0 };
    const bucket = byDate[e.date];
    for (const k of NUTRIENTS) bucket.totals[k] += e[k];
    bucket.entryCount += 1;
  }
  for (const date of Object.keys(byDate)) {
    for (const k of NUTRIENTS) byDate[date].totals[k] = round2(byDate[date].totals[k]);
  }
  return byDate;
}

// Averages are computed only over the days that actually have entries — a
// month with 12 logged days divides by 12, never by the calendar length of
// the range.
function computeAverages(byDate, dateFilter) {
  const dates = Object.keys(byDate).filter(dateFilter || (() => true));
  const loggedDays = dates.length;
  const averages = emptyTotals();
  if (loggedDays === 0) return { loggedDays: 0, averages };
  for (const date of dates) {
    for (const k of NUTRIENTS) averages[k] += byDate[date].totals[k];
  }
  for (const k of NUTRIENTS) averages[k] = round2(averages[k] / loggedDays);
  return { loggedDays, averages };
}

function buildDaySeries(start, end, byDate) {
  return eachDateInRange(start, end).map((date) => {
    const bucket = byDate[date];
    return {
      date,
      entryCount: bucket ? bucket.entryCount : 0,
      totals: bucket ? bucket.totals : emptyTotals(),
    };
  });
}

// GET /api/history/range?scope=week|month|year&date=YYYY-MM-DD
// `date` is an anchor within the desired week/month/year; omit it to get the
// current one (computed in Pristina local time). Read-only: aggregates the
// existing entries table, never writes to it.
router.get('/range', (req, res) => {
  const scope = String(req.query.scope || 'week');
  const anchor = String(req.query.date || '').trim() || todayInPristina();

  if (!DATE_RE.test(anchor)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  }

  if (scope === 'week' || scope === 'month') {
    const { start, end } = scope === 'week' ? weekRange(anchor) : monthRange(anchor);
    const byDate = groupByDate(fetchEntriesInRange(start, end));
    const { loggedDays, averages } = computeAverages(byDate);
    const days = buildDaySeries(start, end, byDate);
    return res.json({ scope, start, end, loggedDays, averages, days });
  }

  if (scope === 'year') {
    const year = yearOf(anchor);
    const { start, end } = yearRange(year);
    const byDate = groupByDate(fetchEntriesInRange(start, end));
    const { loggedDays, averages } = computeAverages(byDate);

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, '0');
      const prefix = `${year}-${mm}-`;
      const { start: monthStart, end: monthEnd } = monthRange(`${year}-${mm}-01`);
      const monthAgg = computeAverages(byDate, (d) => d.startsWith(prefix));
      months.push({ month: m, start: monthStart, end: monthEnd, loggedDays: monthAgg.loggedDays, averages: monthAgg.averages });
    }
    return res.json({ scope, year, start, end, loggedDays, averages, months });
  }

  return res.status(400).json({ error: 'scope must be week, month, or year' });
});

export default router;
