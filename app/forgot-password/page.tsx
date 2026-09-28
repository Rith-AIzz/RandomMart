import { PasswordResetForm } from "../../components/password-reset-form";

export default function ForgotPasswordPage() {
  return (
    <main>
      <section className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">Account recovery</p>
          <h1>Reset password</h1>
          <p>
            Enter your account email. In live mode, Supabase sends a secure
            reset link.
          </p>
          <PasswordResetForm />
        </div>
      </section>
    </main>
  );
}
