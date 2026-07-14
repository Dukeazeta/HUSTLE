export default function Loading() {
  return (
    <div className="skeleton-shell" aria-label="Loading workspace">
      <aside className="skeleton-sidebar" />
      <main className="skeleton-main">
        <div className="skeleton-line short" />
        <div className="skeleton-line medium" />
        <div className="skeleton-block" />
        <div className="skeleton-block" />
      </main>
    </div>
  );
}
