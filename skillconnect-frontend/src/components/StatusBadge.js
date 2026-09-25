/**
 * WHAT IT DOES:
 *   Renders a colored pill/badge reflecting the current status of a booking
 *   ('pending', 'confirmed', 'pending_start', 'started', 'completed', 'cancelled', 'expired').
 * 
 * WHY WE ADDED IT:
 *   - Visual Consistency: Standardizes booking status design and colors across customer, provider,
 *     and admin views.
 * 
 * @param {Object} props
 * @param {string} props.status - Raw status string from database
 */
function StatusBadge({ status }) {
  const label = String(status || "unknown").replace("_", " ");

  return <span className={`status-badge ${status || "unknown"}`}>{label}</span>;
}

export default StatusBadge;
