import { Home, NotebookPen, History, Settings } from 'lucide-react';

const TABS = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'log', label: 'Log', icon: NotebookPen },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function BottomNav({ active, onSelect }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button key={id} className={active === id ? 'active' : ''} onClick={() => onSelect(id)}>
          <Icon size={22} strokeWidth={active === id ? 2.4 : 2} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
