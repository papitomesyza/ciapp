export default function MacroRing({ label, value, target, unit, color = 'var(--accent)', size = 84 }) {
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const dash = circumference * pct;

  // The lone iridescent gesture: sage green → molten amber → oxblood, used as
  // atmospheric media on the hero (Calories) ring only.
  const iridescent = color === 'iridescent';
  const strokeColor = iridescent ? 'url(#iridescent-ring)' : color;

  return (
    <div className="ring-tile">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {iridescent && (
          <defs>
            <linearGradient id="iridescent-ring" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(160, 224, 171)" />
              <stop offset="50%" stopColor="rgb(255, 172, 46)" />
              <stop offset="100%" stopColor="rgb(165, 45, 37)" />
            </linearGradient>
          </defs>
        )}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-strong)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          letterSpacing="-0.3"
          fill="var(--text)"
        >
          {Math.round(value)}
        </text>
        <text x="50%" y="64%" textAnchor="middle" fontSize="9" fontWeight="500" fill="var(--text-dim)">
          /{Math.round(target)}{unit}
        </text>
      </svg>
      <div className="ring-label">{label}</div>
    </div>
  );
}
