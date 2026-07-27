import { useEffect, useState } from 'react';

// Bars start empty on first paint and fill to their value, matching the
// macro rings' mount sweep.
function useEntered() {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(raf);
  }, []);
  return entered;
}

export default function ProgressBar({ label, value, target, unit, color }) {
  const entered = useEntered();
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div className="bar-row">
      <div className="bar-labels">
        <span>{label}</span>
        <span>
          <span className="bar-value">{Math.round(value)}</span>
          <span className="bar-target"> / {Math.round(target)} {unit}</span>
        </span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${entered ? pct : 0}%`, background: color }} />
      </div>
    </div>
  );
}
