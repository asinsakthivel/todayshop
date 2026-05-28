const MetricCard = ({ label, value, hint, accent = "neutral", icon = "bi bi-graph-up" }) => (
  <div className={`card shadow-sm border-0 metric-surface metric-${accent}`}>
    <div className="card-body p-4">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <div className="text-muted small text-uppercase metric-label">{label}</div>
          <div className="h3 mb-1">{value}</div>
          {hint ? <div className="text-muted small">{hint}</div> : null}
        </div>
        <div className="metric-icon">
          <i className={icon} />
        </div>
      </div>
    </div>
  </div>
);

export default MetricCard;
