import { Router } from 'express';
import db from '../db.js';

const router = Router();
const NUTRIENTS = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg', 'sat_fat_g'];

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM custom_foods ORDER BY name ASC').all());
});

router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.name) return res.status(400).json({ error: 'name is required' });
  const values = {
    name: String(body.name).slice(0, 200),
    serving_size: num(body.serving_size, 1) || 1,
    serving_unit: String(body.serving_unit || 'serving').slice(0, 20),
  };
  for (const n of NUTRIENTS) values[n] = num(body[n]);

  const info = db.prepare(`
    INSERT INTO custom_foods (name, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, sat_fat_g)
    VALUES (@name, @serving_size, @serving_unit, @calories, @protein_g, @carbs_g, @fat_g, @fiber_g, @sugar_g, @sodium_mg, @sat_fat_g)
  `).run(values);

  res.status(201).json(db.prepare('SELECT * FROM custom_foods WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM custom_foods WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'custom food not found' });
  const body = req.body || {};
  const values = {
    id: existing.id,
    name: body.name !== undefined ? String(body.name).slice(0, 200) : existing.name,
    serving_size: body.serving_size !== undefined ? (num(body.serving_size, 1) || 1) : existing.serving_size,
    serving_unit: body.serving_unit !== undefined ? String(body.serving_unit).slice(0, 20) : existing.serving_unit,
  };
  for (const n of NUTRIENTS) values[n] = body[n] !== undefined ? num(body[n]) : existing[n];

  db.prepare(`
    UPDATE custom_foods SET name=@name, serving_size=@serving_size, serving_unit=@serving_unit,
      calories=@calories, protein_g=@protein_g, carbs_g=@carbs_g, fat_g=@fat_g, fiber_g=@fiber_g,
      sugar_g=@sugar_g, sodium_mg=@sodium_mg, sat_fat_g=@sat_fat_g
    WHERE id=@id
  `).run(values);

  res.json(db.prepare('SELECT * FROM custom_foods WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM custom_foods WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'custom food not found' });
  res.status(204).end();
});

export default router;
