"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}

type FieldErrors = {
  nome?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function setField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateLocal(): FieldErrors {
    const errs: FieldErrors = {};
    if (form.nome.trim().length < 2) errs.nome = "Nome deve ter ao menos 2 caracteres";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email inválido";
    if (form.password.length < 8) errs.password = "Senha deve ter ao menos 8 caracteres";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "As senhas não conferem";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const localErrs = validateLocal();
    if (Object.keys(localErrs).length > 0) {
      setErrors(localErrs);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "email_taken") {
          setErrors({ email: "Este email já está em uso." });
        } else {
          setErrors({ general: "Ocorreu um erro. Tente novamente." });
        }
        setLoading(false);
        return;
      }

      // Login automático após cadastro
      const signInRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInRes?.error) {
        setErrors({ general: "Cadastro feito, mas não foi possível fazer login automático. Tente entrar manualmente." });
        setLoading(false);
        return;
      }

      router.push("/onboarding/perfil");
    } catch {
      setErrors({ general: "Ocorreu um erro de rede. Tente novamente." });
      setLoading(false);
    }
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
            <h2 className="text-xl font-semibold text-text-primary">Criar sua conta</h2>
            <p className="mt-1 text-sm text-text-secondary">Comece em menos de 2 minutos.</p>
          </header>

          {errors.general && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger-light px-3 py-2 text-sm text-danger"
            >
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="nome" className="text-sm font-medium text-text-primary">
                Nome
              </label>
              <input
                id="nome"
                type="text"
                autoComplete="name"
                value={form.nome}
                onChange={(e) => setField("nome", e.target.value)}
                placeholder="Seu nome"
                aria-invalid={!!errors.nome}
                aria-describedby={errors.nome ? "nome-error" : undefined}
                className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm text-text-primary outline-none transition focus:border-border-focus aria-invalid:border-danger"
              />
              <FieldError message={errors.nome} />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-text-primary">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="voce@email.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm text-text-primary outline-none transition focus:border-border-focus aria-invalid:border-danger"
              />
              <FieldError message={errors.email} />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-text-primary">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                placeholder="Mínimo 8 caracteres"
                aria-invalid={!!errors.password}
                className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm text-text-primary outline-none transition focus:border-border-focus aria-invalid:border-danger"
              />
              <FieldError message={errors.password} />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-text-primary">
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                placeholder="Repita a senha"
                aria-invalid={!!errors.confirmPassword}
                className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm text-text-primary outline-none transition focus:border-border-focus aria-invalid:border-danger"
              />
              <FieldError message={errors.confirmPassword} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-[12px] bg-brand-primary text-sm font-semibold text-text-inverse transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Criando conta…" : "Criar conta"}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            Já tem conta?{" "}
            <Link href="/auth/login" className="font-medium text-text-brand hover:underline">
              Entrar
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
