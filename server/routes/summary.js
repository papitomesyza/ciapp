import { Router } from 'express';
import db from '../db.js';

const router = Router();

const NUTRIENTS = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg', 'sat_fat_g'];

function emptyTotals() {
  const t = {};
  for (const n of NUTRIENTS) t[n] = 0;
  return t;
}

function sumEntries(entries) {
  const totals = emptyTotals();
  for (const e of entries) {
    for (const n of NUTRIENTS) totals[n] += e[n];
  }
  for (const n of NUTRIENTS) totals[n] = Math.round(totals[n] * 100) / 100;
  return totals;
}

router.get('/day', (req, res) => {
  const date = String(req.query.date || '');
  if (!date) return res.status(400).json({ error: 'date is required' });
  const entries = db.prepare('SELECT * FROM entries WHERE date = ?').all(date);
  res.json({ date, totals: sumEntries(entries), entry_count: entries.length });
});

router.get('/week', (req, res) => {
  const from = String(req.query.from || '');
  const to = String(req.query.to || '');
  if (!from || !to) return res.status(400).json({ error: 'from and to are required' });

  const entries = db.prepare('SELECT * FROM entries WHERE date BETWEEN ? AND ? ORDER BY date ASC').all(from, to);
  const byDate = {};
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  const days = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    days.push({ date: dateStr, totals: sumEntries(byDate[dateStr] || []) });
  }

  res.json({ from, to, days });
});

export default router;
