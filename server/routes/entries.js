import { Router } from 'express';
import db from '../db.js';

const router = Router();

const MEALS = new Set(['breakfast', 'lunch', 'dinner', 'snack']);
const NUTRIENTS = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg', 'sat_fat_g'];

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

router.get('/', (req, res) => {
  const { date, from, to } = req.query;
  let rows;
  if (date) {
    rows = db.prepare('SELECT * FROM entries WHERE date = ? ORDER BY created_at ASC').all(date);
  } else if (from && to) {
    rows = db.prepare('SELECT * FROM entries WHERE date BETWEEN ? AND ? ORDER BY date ASC, created_at ASC').all(from, to);
  } else {
    rows = db.prepare('SELECT * FROM entries ORDER BY date DESC, created_at DESC LIMIT 200').all();
  }
  res.json(rows);
});

router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.date || !MEALS.has(body.meal) || !body.food_name || !body.amount || !body.unit) {
    return res.status(400).json({ error: 'date, meal, food_name, amount, and unit are required' });
  }
  const values = {
    date: String(body.date),
    meal: String(body.meal),
    food_name: String(body.food_name).slice(0, 200),
    amount: num(body.amount),
    unit: String(body.unit).slice(0, 20),
    source: String(body.source || 'manual').slice(0, 20),
  };
  for (const n of NUTRIENTS) values[n] = num(body[n]);

  const info = db.prepare(`
    INSERT INTO entries (date, meal, food_name, amount, unit, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, sat_fat_g, source)
    VALUES (@date, @meal, @food_name, @amount, @unit, @calories, @protein_g, @carbs_g, @fat_g, @fiber_g, @sugar_g, @sodium_mg, @sat_fat_g, @source)
  `).run(values);

  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'entry not found' });

  const body = req.body || {};
  const values = {
    id: existing.id,
    date: body.date !== undefined ? String(body.date) : existing.date,
    meal: body.meal !== undefined && MEALS.has(body.meal) ? String(body.meal) : existing.meal,
    food_name: body.food_name !== undefined ? String(body.food_name).slice(0, 200) : existing.food_name,
    amount: body.amount !== undefined ? num(body.amount) : existing.amount,
    unit: body.unit !== undefined ? String(body.unit).slice(0, 20) : existing.unit,
  };
  for (const n of NUTRIENTS) values[n] = body[n] !== undefined ? num(body[n]) : existing[n];

  db.prepare(`
    UPDATE entries SET date=@date, meal=@meal, food_name=@food_name, amount=@amount, unit=@unit,
      calories=@calories, protein_g=@protein_g, carbs_g=@carbs_g, fat_g=@fat_g, fiber_g=@fiber_g,
      sugar_g=@sugar_g, sodium_mg=@sodium_mg, sat_fat_g=@sat_fat_g
    WHERE id=@id
  `).run(values);

  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'entry not found' });
  res.status(204).end();
});

export default router;
