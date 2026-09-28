import { Suspense } from "react";
import { AuthForm } from "../../components/auth-form";
export default function LoginPage() {
  return (
    <main>
      <section className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">Welcome back</p>
          <h1>Sign in</h1>
          <p>Access your cart, profile, and simulated order history.</p>
          <Suspense fallback={<p>Preparing secure sign-in…</p>}>
            <AuthForm mode="login" />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
