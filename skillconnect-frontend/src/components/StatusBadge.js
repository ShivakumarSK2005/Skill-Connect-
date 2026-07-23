function StatusBadge({ status }) {
  const label = String(status || "unknown").replace("_", " ");

  return <span className={`status-badge ${status || "unknown"}`}>{label}</span>;
}

export default StatusBadge;
