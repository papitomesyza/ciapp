import { Router } from 'express';
import db from '../db.js';

const router = Router();

const FIELDS = [
  'calories_target', 'protein_g_target', 'carbs_g_target', 'fat_g_target',
  'fiber_g_target', 'sugar_g_target', 'sodium_mg_target', 'sat_fat_g_target',
];

router.get('/', (req, res) => {
  const row = db.prepare(`SELECT ${FIELDS.join(', ')} FROM settings WHERE id = 1`).get();
  res.json(row);
});

router.put('/', (req, res) => {
  const body = req.body || {};
  const existing = db.prepare(`SELECT ${FIELDS.join(', ')} FROM settings WHERE id = 1`).get();
  const values = { id: 1 };
  for (const f of FIELDS) {
    const n = Number(body[f]);
    values[f] = Number.isFinite(n) && n >= 0 ? n : existing[f];
  }
  db.prepare(`
    UPDATE settings SET
      calories_target=@calories_target, protein_g_target=@protein_g_target, carbs_g_target=@carbs_g_target,
      fat_g_target=@fat_g_target, fiber_g_target=@fiber_g_target, sugar_g_target=@sugar_g_target,
      sodium_mg_target=@sodium_mg_target, sat_fat_g_target=@sat_fat_g_target, updated_at=datetime('now')
    WHERE id=@id
  `).run(values);
  const row = db.prepare(`SELECT ${FIELDS.join(', ')} FROM settings WHERE id = 1`).get();
  res.json(row);
});

export default router;
