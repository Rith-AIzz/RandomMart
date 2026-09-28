export default function AdminLoading() {
  return (
    <main className="admin-shell">
      <div className="admin-layout">
        <section className="admin-main">
          <p className="eyebrow">Loading</p>
          <h1>Preparing dashboard…</h1>
          <div className="stats-grid" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="stat-card dashboard-skeleton" key={index} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
