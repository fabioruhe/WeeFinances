"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";

type Props = {
  code: string;
  inviterName: string;
  isLoggedIn: boolean;
  isExpired: boolean;
  isOwnInvite: boolean;
  onboardingCompleto: boolean;
};

export function JoinClient({
  code,
  inviterName,
  isLoggedIn,
  isExpired,
  isOwnInvite,
  onboardingCompleto,
}: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [regForm, setRegForm] = useState({
    nome: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  async function acceptInvite() {
    const res = await fetch("/api/couple/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? "Erro ao aceitar convite.");
    return data;
  }

  async function handleLoggedInAccept() {
    setLoading(true);
    setError(null);
    try {
      await acceptInvite();
      // Se onboarding incompleto, segue o fluxo normal (middleware redireciona)
      // Se completo (usuário solo existente), vai para divisão
      if (onboardingCompleto) {
        window.location.href = "/onboarding/divisao";
      } else {
        window.location.href = "/onboarding/perfil";
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao aceitar convite.");
      setLoading(false);
    }
  }

  async function handleLoginAndAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError("Preencha email e senha.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const signInRes = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });
      if (signInRes?.error) {
        setError("Email ou senha incorretos.");
        setLoading(false);
        return;
      }
      await acceptInvite();
      window.location.href = "/onboarding/divisao";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao processar. Tente novamente.");
      setLoading(false);
    }
  }

  async function handleRegisterAndAccept(e: React.FormEvent) {
    e.preventDefault();
    if (regForm.nome.trim().length < 2) {
      setError("Nome deve ter ao menos 2 caracteres.");
      return;
    }
    if (regForm.password.length < 8) {
      setError("Senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      if (!regRes.ok) {
        const d = await regRes.json();
        setError(d.error === "email_taken" ? "Este email já está em uso." : "Erro ao criar conta.");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email: regForm.email,
        password: regForm.password,
        redirect: false,
      });
      if (signInRes?.error) {
        setError("Conta criada, mas erro no login. Tente entrar manualmente.");
        setLoading(false);
        return;
      }

      await acceptInvite();
      // Novo usuário: precisa fazer onboarding
      window.location.href = "/onboarding/perfil";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao processar. Tente novamente.");
      setLoading(false);
    }
  }

  // ── Convite expirado / já aceito ──
  if (isExpired) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <span className="text-5xl" aria-hidden>🔒</span>
          <h1 className="text-xl font-semibold text-text-primary">Convite indisponível</h1>
          <p className="text-sm text-text-secondary">
            Este convite já foi usado ou expirou. Peça um novo código ao seu parceiro(a).
          </p>
          <Link href="/auth/login" className="inline-block text-sm font-medium text-text-brand hover:underline">
            Ir para o login
          </Link>
        </div>
      </main>
    );
  }

  // ── Convite próprio ──
  if (isOwnInvite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <span className="text-5xl" aria-hidden>🙃</span>
          <h1 className="text-xl font-semibold text-text-primary">Ei, esse é seu próprio convite!</h1>
          <p className="text-sm text-text-secondary">
            Compartilhe com seu(sua) parceiro(a) para ele(a) aceitar.
          </p>
          <Link href="/dashboard" className="inline-block text-sm font-medium text-text-brand hover:underline">
            Voltar ao dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header do convite */}
        <div className="text-center">
          <span className="text-4xl" aria-hidden>💌</span>
          <h1 className="mt-3 text-2xl font-semibold text-text-primary">
            {inviterName} te convidou
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Aceite o convite para gerenciar as finanças juntos no Wee Finances.
          </p>
          <p className="mt-2 font-mono text-xs font-medium tracking-widest text-text-tertiary">
            Código: {code}
          </p>
        </div>

        {/* Usuário já logado */}
        {isLoggedIn ? (
          <div className="card-surface space-y-4 p-6">
            <p className="text-sm text-text-secondary">
              Você está logado(a). Clique abaixo para aceitar o convite e vincular as contas.
            </p>
            {error && (
              <p className="text-sm text-danger" role="alert">{error}</p>
            )}
            <button
              onClick={handleLoggedInAccept}
              disabled={loading}
              className="h-11 w-full rounded-[12px] bg-brand-primary text-sm font-semibold text-text-inverse transition hover:bg-brand-primary-hover disabled:opacity-60"
            >
              {loading ? "Vinculando contas…" : "✓ Aceitar convite"}
            </button>
          </div>
        ) : (
          /* Usuário não logado */
          <div className="card-surface p-6">
            {/* Abas login/cadastro */}
            <div className="mb-5 flex rounded-[10px] bg-bg-secondary p-1" role="tablist">
              {(["login", "register"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => { setTab(t); setError(null); }}
                  className={[
                    "flex-1 rounded-[8px] py-2 text-sm font-medium transition",
                    tab === t
                      ? "bg-bg-card text-text-primary shadow-sm"
                      : "text-text-tertiary hover:text-text-secondary",
                  ].join(" ")}
                >
                  {t === "login" ? "Já tenho conta" : "Criar conta"}
                </button>
              ))}
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-3 py-2 text-sm text-danger"
              >
                {error}
              </div>
            )}

            {/* Login */}
            {tab === "login" && (
              <form onSubmit={handleLoginAndAccept} noValidate className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="text-sm font-medium text-text-primary">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm outline-none transition focus:border-border-focus"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="text-sm font-medium text-text-primary">Senha</label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="********"
                    className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm outline-none transition focus:border-border-focus"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-[12px] bg-brand-primary text-sm font-semibold text-text-inverse transition hover:bg-brand-primary-hover disabled:opacity-60"
                >
                  {loading ? "Entrando e vinculando…" : "Entrar e aceitar convite"}
                </button>
              </form>
            )}

            {/* Cadastro rápido */}
            {tab === "register" && (
              <form onSubmit={handleRegisterAndAccept} noValidate className="space-y-4">
                <div>
                  <label htmlFor="reg-nome" className="text-sm font-medium text-text-primary">Nome</label>
                  <input
                    id="reg-nome"
                    type="text"
                    autoComplete="name"
                    value={regForm.nome}
                    onChange={(e) => setRegForm((p) => ({ ...p, nome: e.target.value }))}
                    placeholder="Seu nome"
                    className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm outline-none transition focus:border-border-focus"
                  />
                </div>
                <div>
                  <label htmlFor="reg-email" className="text-sm font-medium text-text-primary">Email</label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    value={regForm.email}
                    onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="voce@email.com"
                    className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm outline-none transition focus:border-border-focus"
                  />
                </div>
                <div>
                  <label htmlFor="reg-password" className="text-sm font-medium text-text-primary">Senha</label>
                  <input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    value={regForm.password}
                    onChange={(e) => setRegForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm outline-none transition focus:border-border-focus"
                  />
                </div>
                <div>
                  <label htmlFor="reg-confirm" className="text-sm font-medium text-text-primary">Confirmar senha</label>
                  <input
                    id="reg-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={regForm.confirmPassword}
                    onChange={(e) => setRegForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Repita a senha"
                    className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm outline-none transition focus:border-border-focus"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-[12px] bg-brand-primary text-sm font-semibold text-text-inverse transition hover:bg-brand-primary-hover disabled:opacity-60"
                >
                  {loading ? "Criando conta e vinculando…" : "Criar conta e aceitar convite"}
                </button>
              </form>
            )}
          </div>
        )}

        <p className="text-center text-xs text-text-tertiary">
          Ao aceitar, você concorda com nossos termos de uso.
        </p>
      </div>
    </main>
  );
}
