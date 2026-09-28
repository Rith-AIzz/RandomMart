"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState, useSyncExternalStore } from "react";
import { LockKeyhole } from "lucide-react";
import { useStore } from "./store-provider";

const subscribeToHydration = () => () => {};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { signIn, signUp, liveMode } = useStore();
  const searchParams = useSearchParams();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Password managers can rewrite auth inputs before React hydrates them. Wait
  // until hydration is complete so those browser-injected nodes cannot make the
  // server and client trees disagree.
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "Darith");
    if (password.length < 8)
      return setError("Use at least eight characters for the local password.");
    setSubmitting(true);
    setError("");
    try {
      if (mode === "register") await signUp(email, password, name);
      else await signIn(email, password);
      const destination = searchParams.get("returnTo");
      window.location.assign(
        destination?.startsWith("/") && !destination.startsWith("//")
          ? destination
          : "/profile",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  if (!mounted) {
    return <p className="auth-form-status">Preparing secure sign-in…</p>;
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === "register" && (
        <div className="field">
          <label htmlFor="auth-name">Full name</label>
          <input id="auth-name" name="name" autoComplete="name" required />
        </div>
      )}
      <div className="field">
        <label htmlFor="auth-email">Email address</label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
        />
      </div>
      {error && (
        <p role="alert" style={{ color: "#a83718", fontSize: 13 }}>
          {error}
        </p>
      )}
      <button
        className="button button-primary"
        type="submit"
        disabled={submitting}
      >
        {submitting
          ? "Please wait…"
          : mode === "login"
            ? `Sign in${liveMode ? "" : " locally"}`
            : `Create ${liveMode ? "" : "local "}account`}
      </button>
      <p className="secure-note">
        <LockKeyhole size={19} />{" "}
        {liveMode
          ? "Authentication uses Supabase with secure cookie sessions."
          : "Preview mode stores a harmless local session. Add Supabase environment variables to enable real authentication."}
      </p>
      <p className="auth-switch">
        {mode === "login" ? (
          <>
            New to RandomMart? <Link href="/register">Create an account</Link>
          </>
        ) : (
          <>
            Already have an account? <Link href="/login">Sign in</Link>
          </>
        )}
      </p>
    </form>
  );
}
