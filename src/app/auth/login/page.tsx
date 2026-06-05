"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Preencha email e senha.");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    // Força reload para o middleware redirecionar corretamente
    window.location.href = callbackUrl;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl italic text-brand-primary">Wee Finances</h1>
          <p className="mt-2 text-sm text-text-tertiary">Gestão financeira para solo e casal</p>
        </div>

        <section className="card-surface space-y-6 p-6">
          <header>
            <h2 className="text-xl font-semibold text-text-primary">Entrar na sua conta</h2>
            <p className="mt-1 text-sm text-text-secondary">Login individual por parceiro.</p>
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

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-text-primary">
                  Senha
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-text-brand hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Sua senha"
                className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm text-text-primary outline-none transition focus:border-border-focus"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-[12px] bg-brand-primary text-sm font-semibold text-text-inverse transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            Ainda não tem conta?{" "}
            <Link href="/register" className="font-medium text-text-brand hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
