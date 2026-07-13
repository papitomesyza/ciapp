import { Router } from 'express';
import db from '../db.js';

const router = Router();
const NUTRIENTS = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg', 'sat_fat_g'];

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM favorites ORDER BY name ASC').all());
});

router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.name) return res.status(400).json({ error: 'name is required' });
  const values = {
    name: String(body.name).slice(0, 200),
    barcode: body.barcode ? String(body.barcode).slice(0, 64) : null,
    basis_amount: num(body.basis_amount, 100) || 100,
    unit: String(body.unit || 'g').slice(0, 20),
    default_amount: num(body.default_amount, 100) || 100,
    custom_food_id: body.custom_food_id ? Number(body.custom_food_id) : null,
  };
  for (const n of NUTRIENTS) values[n] = num(body[n]);

  const info = db.prepare(`
    INSERT INTO favorites (name, barcode, basis_amount, unit, default_amount, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, sat_fat_g, custom_food_id)
    VALUES (@name, @barcode, @basis_amount, @unit, @default_amount, @calories, @protein_g, @carbs_g, @fat_g, @fiber_g, @sugar_g, @sodium_mg, @sat_fat_g, @custom_food_id)
  `).run(values);

  res.status(201).json(db.prepare('SELECT * FROM favorites WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM favorites WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'favorite not found' });
  res.status(204).end();
});

export default router;
