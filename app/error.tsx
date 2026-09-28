"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <section className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p className="eyebrow">Something went wrong</p>
          <h1>We hit a small snag.</h1>
          <p>
            Please try again. Technical details are intentionally hidden to
            protect the application.
          </p>
          <button className="button button-primary" onClick={reset}>
            Try again
          </button>
        </div>
      </section>
    </main>
  );
}
