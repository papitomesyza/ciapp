import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { calorieStatus, proteinStatus, STATUS_LABEL, STATUS_COLOR, monthShortLabel, buildYearCopyText, copyToClipboard } from '../history.js';

export default function YearView({ range, targets, onMonthClick }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = buildYearCopyText({ year: range.year, months: range.months, targets });
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div>
      <div className="glass-card">
        {range.months.map((m) => {
          const label = monthShortLabel(m.month, range.year);
          if (m.loggedDays === 0) {
            return (
              <div className="year-month-row" key={m.month} onClick={() => onMonthClick(m.start)}>
                <span className="year-month-name">{label}</span>
                <div className="year-month-stats">
                  <div className="year-month-status" style={{ color: STATUS_COLOR.unknown }}>No logs</div>
                </div>
              </div>
            );
          }
          const cal = calorieStatus(m.averages.calories, targets.calories_target, m.loggedDays);
          const pro = proteinStatus(m.averages.protein_g, targets.protein_g_target, m.loggedDays);
          return (
            <div className="year-month-row" key={m.month} onClick={() => onMonthClick(m.start)}>
              <span className="year-month-name">{label}</span>
              <div className="year-month-stats">
                <div className="year-month-status" style={{ color: STATUS_COLOR[cal.status] }}>
                  {Math.round(m.averages.calories)} kcal · {STATUS_LABEL[cal.status]}
                </div>
                <div className="year-month-meta">
                  {Math.round(m.averages.protein_g)}g protein ({STATUS_LABEL[pro.status]}) · {m.loggedDays} day{m.loggedDays === 1 ? '' : 's'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="copy-btn" onClick={handleCopy}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'Copied' : 'Copy year summary'}
      </button>
    </div>
  );
}
