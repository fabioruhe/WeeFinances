"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Informe seu email.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erro ao enviar. Tente novamente.");
        setLoading(false);
        return;
      }

      setSent(true);
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
          <p className="mt-2 text-sm text-text-tertiary">Recuperacao de senha</p>
        </div>

        <section className="card-surface space-y-6 p-6">
          {sent ? (
            <>
              <div className="rounded-xl border border-success/30 bg-success-light px-3 py-2 text-sm text-success">
                Se o email informado estiver cadastrado, voce recebera um link para redefinir sua senha.
              </div>
              <p className="text-center text-sm text-text-secondary">
                <Link href="/auth/login" className="font-medium text-text-brand hover:underline">
                  Voltar para o login
                </Link>
              </p>
            </>
          ) : (
            <>
              <header>
                <h2 className="text-xl font-semibold text-text-primary">Esqueceu sua senha?</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Informe seu email e enviaremos um link para redefinir sua senha.
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
                  <label htmlFor="email" className="text-sm font-medium text-text-primary">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="voce@email.com"
                    className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm text-text-primary outline-none transition focus:border-border-focus"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-11 w-full rounded-[12px] bg-brand-primary text-sm font-semibold text-text-inverse transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Enviando..." : "Enviar link de redefinicao"}
                </button>
              </form>

              <p className="text-center text-sm text-text-secondary">
                Lembrou a senha?{" "}
                <Link href="/auth/login" className="font-medium text-text-brand hover:underline">
                  Voltar para o login
                </Link>
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
