import { formatDateLabel } from '../nutrition.js';
import TrendChart from './TrendChart.jsx';

export default function WeekView({ range, onDateClick }) {
  return (
    <div>
      <TrendChart days={range.days} />
      <div className="glass-card">
        {[...range.days].reverse().map((d) => (
          <div className="history-day-row" key={d.date} onClick={() => onDateClick(d.date)}>
            <span>{formatDateLabel(d.date)}</span>
            <span>{d.entryCount > 0 ? `${Math.round(d.totals.calories)} kcal` : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
