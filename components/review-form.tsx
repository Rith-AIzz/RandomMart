"use client";

import { FormEvent, useState } from "react";
import { useStore } from "./store-provider";

export function ReviewForm({ productId }: { productId: string }) {
  const { user, liveMode } = useStore();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  if (!liveMode || !user) return null;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        rating: form.get("rating"),
        title: form.get("title"),
        body: form.get("body"),
      }),
    });
    const body = (await response.json()) as { message?: string };
    setMessage(
      body.message ??
        (response.ok ? "Review submitted." : "Unable to submit review."),
    );
    setBusy(false);
    if (response.ok) event.currentTarget.reset();
  };
  return (
    <form className="form-card review-form" onSubmit={submit}>
      <h3>Review your purchase</h3>
      <p>
        Only delivered purchases are accepted. Reviews appear after moderation.
      </p>
      <div className="form-grid">
        <div className="field">
          <label>
            Rating
            <select name="rating" defaultValue="5">
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} star{rating === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="field">
          <label>
            Title
            <input name="title" maxLength={120} />
          </label>
        </div>
        <div className="field full">
          <label>
            Review
            <textarea name="body" minLength={10} maxLength={2000} required />
          </label>
        </div>
      </div>
      <button className="button button-primary" disabled={busy}>
        {busy ? "Submitting…" : "Submit review"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
