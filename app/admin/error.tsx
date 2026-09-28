"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="admin-shell">
      <section className="admin-main">
        <div className="empty-state">
          <p className="eyebrow">Dashboard unavailable</p>
          <h1>We could not load this report.</h1>
          <p>
            Check the database connection or try again. No account or payment
            information is shown in this message.
          </p>
          <button
            className="button button-primary"
            type="button"
            onClick={reset}
          >
            Try again
          </button>
        </div>
      </section>
    </main>
  );
}
