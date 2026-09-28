import { Suspense } from "react";
import { AuthForm } from "../../components/auth-form";
export default function RegisterPage() {
  return (
    <main>
      <section className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">Join RandomMart</p>
          <h1>Create account</h1>
          <p>
            Save your details and move smoothly from guest cart to checkout.
          </p>
          <Suspense fallback={<p>Preparing registration…</p>}>
            <AuthForm mode="register" />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
