import { calorieStatus, proteinStatus, STATUS_LABEL, STATUS_COLOR } from '../history.js';

export default function BalanceCard({ title, loading, loggedDays, averages, targets }) {
  const ready = !loading && averages && targets;
  const cal = ready ? calorieStatus(averages.calories, targets.calories_target, loggedDays) : null;
  const pro = ready ? proteinStatus(averages.protein_g, targets.protein_g_target, loggedDays) : null;

  return (
    <div className="glass-card balance-card">
      <div className="balance-card-head">
        <div className="balance-card-title">{title}</div>
        {ready && (
          <div className="balance-logged-days">{loggedDays} logged day{loggedDays === 1 ? '' : 's'}</div>
        )}
      </div>

      {!ready ? (
        <div className="spinner" style={{ margin: '18px auto' }} />
      ) : (
        <div className="balance-metrics">
          <div className="balance-metric">
            <div className="balance-metric-label">Calories</div>
            <div className="balance-metric-status" style={{ color: STATUS_COLOR[cal.status] }}>
              {STATUS_LABEL[cal.status]}
            </div>
            <div className="balance-metric-detail">
              {cal.status === 'unknown'
                ? '—'
                : `${Math.round(averages.calories)} kcal/day · ${cal.delta >= 0 ? '+' : ''}${cal.delta}`}
            </div>
          </div>
          <div className="balance-metric">
            <div className="balance-metric-label">Protein</div>
            <div className="balance-metric-status" style={{ color: STATUS_COLOR[pro.status] }}>
              {STATUS_LABEL[pro.status]}
            </div>
            <div className="balance-metric-detail">
              {pro.status === 'unknown'
                ? '—'
                : `${Math.round(averages.protein_g)} g/day · ${pro.delta >= 0 ? '+' : ''}${pro.delta}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
