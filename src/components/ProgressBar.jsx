export default function ProgressBar({ label, value, target, unit, color }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div className="bar-row">
      <div className="bar-labels">
        <span>{label}</span>
        <span>
          {Math.round(value)} / {Math.round(target)} {unit}
        </span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
