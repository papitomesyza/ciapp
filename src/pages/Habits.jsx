import { useEffect, useState, useCallback } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { api } from '../api.js';
import HabitCard from '../components/HabitCard.jsx';
import AddHabitModal from '../components/AddHabitModal.jsx';
import HabitDetailModal from '../components/HabitDetailModal.jsx';
import ManageHabitsModal from '../components/ManageHabitsModal.jsx';

export default function Habits() {
  const [data, setData] = useState(null); // { date, habits }
  const [showAdd, setShowAdd] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [detailHabitId, setDetailHabitId] = useState(null);

  const load = useCallback(async () => {
    const today = await api.getHabitsToday();
    setData(today);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle(habit) {
    setData((d) => {
      if (!d) return d;
      return {
        ...d,
        habits: d.habits.map((h) => {
          if (h.id !== habit.id) return h;
          const next = Math.max(0, h.completed ? h.count - 1 : h.count + 1);
          return { ...h, count: next, completed: next >= h.target_count };
        }),
      };
    });
    try {
      await api.toggleHabit(habit.id);
    } finally {
      load();
    }
  }

  if (!data) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 10px' }} />
          Loading…
        </div>
      </div>
    );
  }

  const doneCount = data.habits.filter((h) => h.completed).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1>Habits</h1>
        </div>
        <button className="icon-btn" onClick={() => setShowManage(true)} aria-label="Manage habits">
          <SlidersHorizontal size={20} />
        </button>
      </div>

      <div className="glass-card habits-summary">
        <div className="habits-summary-count">{doneCount}/{data.habits.length}</div>
        <div className="habits-summary-label">done today</div>
      </div>

      {data.habits.length === 0 ? (
        <div className="empty-state">No habits yet — tap + to add your first one.</div>
      ) : (
        <div className="habit-list">
          {data.habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={() => handleToggle(habit)}
              onOpen={() => setDetailHabitId(habit.id)}
            />
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setShowAdd(true)} aria-label="Add habit">
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {showAdd && (
        <AddHabitModal
          onClose={() => setShowAdd(false)}
          onAdded={async () => { setShowAdd(false); await load(); }}
        />
      )}

      {showManage && (
        <ManageHabitsModal
          onClose={() => setShowManage(false)}
          onChanged={load}
          onOpenDetail={(habit) => setDetailHabitId(habit.id)}
        />
      )}

      {detailHabitId != null && (
        <HabitDetailModal
          habitId={detailHabitId}
          onClose={() => setDetailHabitId(null)}
          onChanged={load}
          onDeleted={async () => { setDetailHabitId(null); await load(); }}
        />
      )}
    </div>
  );
}
