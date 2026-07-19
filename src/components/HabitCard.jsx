import { Check } from 'lucide-react';

export default function HabitCard({ habit, onToggle, onOpen }) {
  const pct = Math.min(100, Math.round((habit.count / habit.target_count) * 100));

  return (
    <div className={`habit-card ${habit.completed ? 'completed' : ''}`} onClick={onOpen}>
      <div className="habit-card-emoji" style={{ background: `${habit.color}26` }}>{habit.emoji}</div>
      <div className="habit-card-info">
        <div className="habit-card-name">{habit.name}</div>
        {habit.target_count > 1 && (
          <div className="habit-card-progress">
            <div className="habit-card-progress-track">
              <div className="habit-card-progress-fill" style={{ width: `${pct}%`, background: habit.color }} />
            </div>
            <span>{habit.count}/{habit.target_count}</span>
          </div>
        )}
      </div>
      <button
        className={`habit-check ${habit.completed ? 'completed' : ''}`}
        style={{ borderColor: habit.color, background: habit.completed ? habit.color : 'transparent' }}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        aria-label={habit.completed ? 'Mark not done' : 'Mark done'}
      >
        {habit.completed && <Check size={18} strokeWidth={3} color="#05130a" />}
      </button>
    </div>
  );
}
