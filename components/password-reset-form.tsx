"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useStore } from "./store-provider";

export function PasswordResetForm() {
  const { liveMode } = useStore();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email"));
    setBusy(true);
    try {
      if (liveMode) {
        const { createClient } = await import("../lib/supabase/client");
        const { error } = await createClient().auth.resetPasswordForEmail(
          email,
          { redirectTo: `${window.location.origin}/profile` },
        );
        if (error) throw error;
      }
      setMessage(
        "If an account exists for that email, password-reset instructions are on the way.",
      );
    } catch {
      setMessage(
        "Password reset is temporarily unavailable. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="reset-email">Email address</label>
        <input
          id="reset-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
        />
      </div>
      <button className="button button-primary" disabled={busy}>
        {busy
          ? "Sending…"
          : liveMode
            ? "Send reset link"
            : "Preview reset flow"}
      </button>
      {message && <p role="status">{message}</p>}
      <p className="auth-switch">
        <Link href="/login">Return to sign in</Link>
      </p>
    </form>
  );
}
