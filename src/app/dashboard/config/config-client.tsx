"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Crown, HeartHandshake, History, Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiRequest } from "@/lib/api-client";

type UserProfile = {
  id: string;
  nome: string | null;
  email: string | null;
  image: string | null;
  plano: "FREE" | "PREMIUM";
  onboardingCompleto: boolean;
  perfilFinanceiro: string | null;
  coupleId: string | null;
};

type ApiMessage = {
  type: "success" | "error";
  text: string;
};

function MessageBanner({ message }: { message: ApiMessage | null }) {
  if (!message) return null;
  const className =
    message.type === "success"
      ? "border-success/30 bg-success-light text-success"
      : "border-danger/30 bg-danger-light text-danger";
  return <p className={`rounded-xl border px-3 py-2 text-sm ${className}`}>{message.text}</p>;
}

export function ConfigClient() {
  const { pushToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [nome, setNome] = useState("");
  const [image, setImage] = useState("");

  const [profileMessage, setProfileMessage] = useState<ApiMessage | null>(null);
  const [planMessage, setPlanMessage] = useState<ApiMessage | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  const load = useCallback(async () => {
    const result = await apiRequest<UserProfile>("/api/users/me", undefined, "Erro ao carregar perfil.");
    if (result.ok) {
      setProfile(result.data);
      setNome(result.data.nome ?? "");
      setImage(result.data.image ?? "");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveProfile() {
    setSavingProfile(true);
    setProfileMessage(null);

    const body: Record<string, string | null> = {};
    if (nome.trim()) body.nome = nome.trim();
    body.image = image.trim() || null;

    const result = await apiRequest<UserProfile>("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, "Erro ao salvar perfil.");

    if (!result.ok) {
      setProfileMessage({ type: "error", text: result.error });
      pushToast({ type: "error", title: "Erro", description: result.error });
    } else {
      setProfile(result.data);
      setProfileMessage({ type: "success", text: "Perfil atualizado." });
      pushToast({ type: "success", title: "Perfil salvo", description: "Dados atualizados." });
    }
    setSavingProfile(false);
  }

  async function togglePlan() {
    if (!profile) return;
    setSavingPlan(true);
    setPlanMessage(null);

    const newPlan = profile.plano === "FREE" ? "PREMIUM" : "FREE";

    const result = await apiRequest<{ ok: boolean; plano: "FREE" | "PREMIUM" }>(
      "/api/users/me/plan",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: newPlan }),
      },
      "Erro ao alterar plano."
    );

    if (!result.ok) {
      setPlanMessage({ type: "error", text: result.error });
      pushToast({ type: "error", title: "Erro", description: result.error });
    } else {
      setProfile((prev) => prev ? { ...prev, plano: result.data.plano } : prev);
      const label = result.data.plano === "PREMIUM" ? "Premium ativado!" : "Plano alterado para Free.";
      setPlanMessage({ type: "success", text: label });
      pushToast({ type: "success", title: "Plano atualizado", description: label });
    }
    setSavingPlan(false);
  }

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        <p className="text-sm text-text-secondary">Carregando configuracoes...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
        <p className="text-sm text-danger">Erro ao carregar perfil.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-8 md:px-8">
      {/* Header */}
      <section className="card-surface p-5">
        <h1 className="text-2xl font-semibold text-text-primary">Configuracoes</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Gerencie seu perfil, plano e configuracoes de relacionamento.
        </p>
      </section>

      {/* Perfil */}
      <section className="card-surface space-y-4 p-5">
        <h2 className="text-lg font-semibold text-text-primary">Perfil</h2>

        <div>
          <label htmlFor="config-nome" className="text-sm font-medium text-text-primary">
            Nome
          </label>
          <input
            id="config-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm text-text-primary outline-none transition focus:border-border-focus"
          />
        </div>

        <div>
          <label htmlFor="config-image" className="text-sm font-medium text-text-primary">
            URL da foto
          </label>
          <input
            id="config-image"
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://exemplo.com/foto.jpg"
            className="mt-1.5 h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm text-text-primary outline-none transition focus:border-border-focus"
          />
        </div>

        <div className="rounded-xl border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-secondary">
          Email: <span className="font-medium text-text-primary">{profile.email}</span>
        </div>

        <Button onClick={saveProfile} disabled={savingProfile}>
          {savingProfile ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar perfil"
          )}
        </Button>

        <MessageBanner message={profileMessage} />
      </section>

      {/* Plano */}
      <section className="card-surface space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Plano</h2>
          <span
            className="rounded-[20px] px-3 py-1 text-xs font-medium"
            style={{
              background: profile.plano === "PREMIUM" ? "var(--brand-accent-light, rgba(212,168,83,0.15))" : "var(--bg-tertiary)",
              color: profile.plano === "PREMIUM" ? "var(--brand-accent)" : "var(--text-secondary)",
            }}
          >
            {profile.plano === "PREMIUM" ? "Premium" : "Free"}
          </span>
        </div>

        {profile.plano === "FREE" ? (
          <>
            <p className="text-sm text-text-secondary">
              Desbloqueie relatorios avancados, detector de assinaturas, e mais.
            </p>
            <Button variant="premium" onClick={togglePlan} disabled={savingPlan} className="gap-2">
              {savingPlan ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
              {savingPlan ? "Ativando..." : "Ativar Premium"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-text-secondary">
              Voce tem acesso a todos os recursos premium.
            </p>
            <Button variant="secondary" onClick={togglePlan} disabled={savingPlan}>
              {savingPlan ? "Alterando..." : "Voltar para o plano Free"}
            </Button>
          </>
        )}

        <MessageBanner message={planMessage} />
      </section>

      {/* Links para settings existentes */}
      <section className="card-surface space-y-3 p-5">
        <h2 className="text-lg font-semibold text-text-primary">Relacionamento</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/settings/relationship"
            className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-bg-card px-4 py-2.5 text-sm font-medium text-text-primary transition hover:border-border-focus"
          >
            <HeartHandshake className="h-4 w-4 text-brand-secondary" />
            Configuracoes de casal
          </Link>
          <Link
            href="/settings/history"
            className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-bg-card px-4 py-2.5 text-sm font-medium text-text-primary transition hover:border-border-focus"
          >
            <History className="h-4 w-4 text-text-secondary" />
            Historico read-only
          </Link>
        </div>
      </section>

      {/* Sair */}
      <section className="card-surface p-5">
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--danger)" }}>
          <LogOut size={16} />
          Sair da conta
        </button>
      </section>
    </main>
  );
}
