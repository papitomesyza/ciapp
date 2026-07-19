import { useEffect, useState } from 'react';
import { X, ChevronUp, ChevronDown, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { api } from '../api.js';

export default function ManageHabitsModal({ onClose, onChanged, onOpenDetail }) {
  const [habits, setHabits] = useState(null);

  async function load() {
    setHabits(await api.getHabits());
  }

  useEffect(() => { load(); }, []);

  async function move(index, dir) {
    const list = [...habits];
    const swapIndex = index + dir;
    if (swapIndex < 0 || swapIndex >= list.length) return;
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
    setHabits(list);
    await api.reorderHabits(list.map((h) => h.id));
    await onChanged();
  }

  async function toggleArchive(habit) {
    await api.updateHabit(habit.id, { archived: !habit.archived });
    await load();
    await onChanged();
  }

  async function remove(habit) {
    if (!window.confirm(`Delete "${habit.name}" and all its history? This can't be undone.`)) return;
    await api.deleteHabit(habit.id);
    await load();
    await onChanged();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>Manage habits</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="sheet-body">
          {!habits ? (
            <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : habits.length === 0 ? (
            <div className="empty-state">No habits yet.</div>
          ) : (
            habits.map((habit, i) => (
              <div className={`manage-habit-row ${habit.archived ? 'archived' : ''}`} key={habit.id}>
                <div className="manage-reorder">
                  <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)}><ChevronUp size={16} /></button>
                  <button className="icon-btn" disabled={i === habits.length - 1} onClick={() => move(i, 1)}><ChevronDown size={16} /></button>
                </div>
                <button className="manage-habit-info" onClick={() => onOpenDetail(habit)}>
                  <span className="manage-habit-emoji">{habit.emoji}</span>
                  <span className="manage-habit-name">{habit.name}{habit.archived ? ' (archived)' : ''}</span>
                </button>
                <div className="manage-habit-actions">
                  <button className="icon-btn" onClick={() => toggleArchive(habit)} aria-label={habit.archived ? 'Unarchive' : 'Archive'}>
                    {habit.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                  </button>
                  <button className="icon-btn danger" onClick={() => remove(habit)} aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
