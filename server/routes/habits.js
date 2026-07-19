import { Router } from 'express';
import db from '../db.js';
import { todayInPristina, addDays, eachDateInRange } from '../lib/tz.js';

const router = Router();

// Self-contained schema for the Habit Tracker feature. Created here (rather
// than in db.js) so this parallel feature never touches the nutrition
// schema/migrations — it owns its own two tables end to end.
db.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '✅',
    color TEXT NOT NULL DEFAULT '#00d341',
    target_count INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS habit_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(habit_id, date)
  );
  CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(date);
  CREATE INDEX IF NOT EXISTS idx_habit_completions_habit ON habit_completions(habit_id);
`);

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function serializeHabit(h) {
  return { ...h, archived: !!h.archived };
}

// GET /api/habits — every habit (active + archived), display order first.
// Used by the management list; the today checklist has its own endpoint below.
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM habits ORDER BY display_order ASC, id ASC').all();
  res.json(rows.map(serializeHabit));
});

// GET /api/habits/today — active habits + today's completion state, all in
// Pristina local time. A new day simply has no completion row yet, so a
// habit's count/completed come back as 0/false without anything being wiped.
router.get('/today', (req, res) => {
  const date = todayInPristina();
  const habits = db.prepare('SELECT * FROM habits WHERE archived = 0 ORDER BY display_order ASC, id ASC').all();
  const completions = db.prepare('SELECT * FROM habit_completions WHERE date = ?').all(date);
  const countByHabit = new Map(completions.map((c) => [c.habit_id, c.count]));
  const withProgress = habits.map((h) => {
    const count = countByHabit.get(h.id) || 0;
    return { ...serializeHabit(h), count, completed: count >= h.target_count };
  });
  res.json({ date, habits: withProgress });
});

router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.name || !String(body.name).trim()) return res.status(400).json({ error: 'name is required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(display_order), -1) AS m FROM habits').get().m;
  const values = {
    name: String(body.name).trim().slice(0, 80),
    emoji: String(body.emoji || '✅').slice(0, 8),
    color: String(body.color || '#00d341').slice(0, 20),
    target_count: Math.max(1, Math.round(num(body.target_count, 1))),
    display_order: maxOrder + 1,
  };
  const info = db.prepare(`
    INSERT INTO habits (name, emoji, color, target_count, display_order)
    VALUES (@name, @emoji, @color, @target_count, @display_order)
  `).run(values);
  res.status(201).json(serializeHabit(db.prepare('SELECT * FROM habits WHERE id = ?').get(info.lastInsertRowid)));
});

// PUT /api/habits/reorder — body { ids: [id, ...] } in the desired display
// order. Must be declared before PUT /:id or Express would match "reorder"
// as an :id param.
router.put('/reorder', (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : null;
  if (!ids) return res.status(400).json({ error: 'ids array is required' });
  const update = db.prepare('UPDATE habits SET display_order = ? WHERE id = ?');
  const tx = db.transaction((list) => {
    list.forEach((id, index) => update.run(index, id));
  });
  tx(ids);
  res.json(db.prepare('SELECT * FROM habits ORDER BY display_order ASC, id ASC').all().map(serializeHabit));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'habit not found' });
  const body = req.body || {};
  const values = {
    id: existing.id,
    name: body.name !== undefined ? String(body.name).trim().slice(0, 80) || existing.name : existing.name,
    emoji: body.emoji !== undefined ? String(body.emoji).slice(0, 8) : existing.emoji,
    color: body.color !== undefined ? String(body.color).slice(0, 20) : existing.color,
    target_count: body.target_count !== undefined ? Math.max(1, Math.round(num(body.target_count, existing.target_count))) : existing.target_count,
    archived: body.archived !== undefined ? (body.archived ? 1 : 0) : existing.archived,
  };
  db.prepare(`
    UPDATE habits SET name=@name, emoji=@emoji, color=@color, target_count=@target_count, archived=@archived
    WHERE id=@id
  `).run(values);
  res.json(serializeHabit(db.prepare('SELECT * FROM habits WHERE id = ?').get(existing.id)));
});

// DELETE /api/habits/:id — the only thing that ever removes a habit's
// history (habit_completions cascades via the FK).
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM habits WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'habit not found' });
  res.status(204).end();
});

// POST /api/habits/:id/toggle — writes/updates today's completion row only
// (Pristina calendar day), never touching any other date. Increments toward
// the target while incomplete; once met, the next tap steps back down —
// that's the "uncheck decrements" behavior.
router.post('/:id/toggle', (req, res) => {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  if (!habit) return res.status(404).json({ error: 'habit not found' });

  const date = todayInPristina();
  const row = db.prepare('SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?').get(habit.id, date);
  const current = row ? row.count : 0;
  const next = current >= habit.target_count ? current - 1 : current + 1;

  if (next <= 0) {
    if (row) db.prepare('DELETE FROM habit_completions WHERE id = ?').run(row.id);
    return res.json({ habit_id: habit.id, date, count: 0, completed: false });
  }

  if (row) {
    db.prepare('UPDATE habit_completions SET count = ? WHERE id = ?').run(next, row.id);
  } else {
    db.prepare('INSERT INTO habit_completions (habit_id, date, count) VALUES (?, ?, ?)').run(habit.id, date, next);
  }
  res.json({ habit_id: habit.id, date, count: next, completed: next >= habit.target_count });
});

// GET /api/habits/:id/detail — streaks + last-30-days grid, all computed in
// Pristina local time from the permanent habit_completions history.
router.get('/:id/detail', (req, res) => {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  if (!habit) return res.status(404).json({ error: 'habit not found' });

  const rows = db.prepare('SELECT date, count FROM habit_completions WHERE habit_id = ?').all(habit.id);
  const countByDate = new Map(rows.map((r) => [r.date, r.count]));
  const completedDates = new Set(rows.filter((r) => r.count >= habit.target_count).map((r) => r.date));

  const today = todayInPristina();
  const yesterday = addDays(today, -1);
  // Current streak ends today or yesterday — today not yet done shouldn't
  // break the streak until the day is actually over.
  const streakStart = completedDates.has(today) ? today : (completedDates.has(yesterday) ? yesterday : null);
  let currentStreak = 0;
  if (streakStart) {
    let d = streakStart;
    while (completedDates.has(d)) {
      currentStreak++;
      d = addDays(d, -1);
    }
  }

  const sortedCompleted = [...completedDates].sort();
  let bestStreak = 0;
  let run = 0;
  let prevDate = null;
  for (const d of sortedCompleted) {
    run = prevDate && addDays(prevDate, 1) === d ? run + 1 : 1;
    if (run > bestStreak) bestStreak = run;
    prevDate = d;
  }

  const gridStart = addDays(today, -29);
  const last30 = eachDateInRange(gridStart, today).map((date) => ({
    date,
    count: countByDate.get(date) || 0,
    completed: completedDates.has(date),
  }));

  res.json({ habit: serializeHabit(habit), currentStreak, bestStreak, last30 });
});

export default router;
