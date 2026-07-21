"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useStore } from "./store-provider";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { signIn } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "Darith");
    if (password.length < 8) return setError("Use at least eight characters for the demonstration password.");
    signIn(email, name);
    const destination = searchParams.get("returnTo");
    router.push(destination?.startsWith("/") && !destination.startsWith("//") ? destination : "/profile");
  };
  return <form className="auth-form" onSubmit={submit}>{mode === "register" && <div className="field"><label htmlFor="auth-name">Full name</label><input id="auth-name" name="name" autoComplete="name" required defaultValue="Nhem Darith" /></div>}<div className="field"><label htmlFor="auth-email">Email address</label><input id="auth-email" name="email" type="email" autoComplete="email" required defaultValue="darith@example.com" /></div><div className="field"><label htmlFor="auth-password">Password</label><input id="auth-password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} defaultValue="DemoPass123!" /></div>{error && <p role="alert" style={{color:"#a83718",fontSize:13}}>{error}</p>}<button className="button button-primary" type="submit">{mode === "login" ? "Sign in to demo" : "Create demo account"}</button><p className="secure-note"><LockKeyhole size={19} /> This deployed portfolio uses a local demo session. The included production architecture connects these forms to Supabase Auth with secure cookie sessions.</p><p className="auth-switch">{mode === "login" ? <>New to RandomMart? <Link href="/register">Create an account</Link></> : <>Already have an account? <Link href="/login">Sign in</Link></>}</p></form>;
}
