import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { formatDateLabel } from '../nutrition.js';
import { weekLabel, buildWeekCopyText, copyToClipboard } from '../history.js';
import TrendChart from './TrendChart.jsx';

export default function WeekView({ range, targets, onDateClick }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = buildWeekCopyText({
      label: weekLabel(range.start, range.end),
      loggedDays: range.loggedDays,
      averages: range.averages,
      targets,
      days: range.days,
    });
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

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

      <button className="copy-btn" onClick={handleCopy}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'Copied' : 'Copy week summary'}
      </button>
    </div>
  );
}
