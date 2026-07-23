function EmptyState({ title, description }) {
  return (
    <div className="status-panel empty-panel">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}

export default EmptyState;
