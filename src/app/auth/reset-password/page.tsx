"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Token de redefinicao ausente ou invalido.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter no minimo 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.error === "invalid_or_expired_token") {
          setError("Token invalido ou expirado. Solicite um novo link de redefinicao.");
        } else {
          setError(data.error ?? "Erro ao redefinir senha. Tente novamente.");
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erro de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl italic text-brand-primary">Wee Finances</h1>
          <p className="mt-2 text-sm text-text-tertiary">Redefinir senha</p>
        </div>

        <section className="card-surface space-y-6 p-6">
          {success ? (
            <>
              <div className="rounded-xl border border-success/30 bg-success-light px-3 py-2 text-sm text-success">
                Senha redefinida com sucesso!
              </div>
              <p className="text-center text-sm text-text-secondary">
                <Link href="/auth/login" className="font-medium text-text-brand hover:underline">
                  Ir para o login
                </Link>
              </p>
            </>
          ) : (
            <>
              <header>
                <h2 className="text-xl font-semibold text-text-primary">Nova senha</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Escolha uma nova senha para sua conta.
                </p>
              </header>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-danger/30 bg-danger-light px-3 py-2 text-sm text-danger"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label htmlFor="password" className="text-sm font-medium text-text-primary">
                    Nova senha
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="Minimo 8 caracteres"
                    className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm text-text-primary outline-none transition focus:border-border-focus"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-text-primary">
                    Confirmar senha
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                    placeholder="Repita a senha"
                    className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm text-text-primary outline-none transition focus:border-border-focus"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-11 w-full rounded-[12px] bg-brand-primary text-sm font-semibold text-text-inverse transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Redefinindo..." : "Redefinir senha"}
                </button>
              </form>

              <p className="text-center text-sm text-text-secondary">
                <Link href="/auth/forgot-password" className="font-medium text-text-brand hover:underline">
                  Solicitar novo link
                </Link>
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
