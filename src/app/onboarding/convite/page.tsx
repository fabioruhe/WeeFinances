"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStepper } from "@/components/onboarding/stepper";

type InviteState =
  | { status: "loading" }
  | { status: "ready"; code: string; coupleId: string }
  | { status: "error"; message: string };

export default function ConvitePage() {
  const router = useRouter();
  const [invite, setInvite] = useState<InviteState>({ status: "loading" });
  const [copied, setCopied] = useState(false);
  const hasFetched = useRef(false);

  async function createInvite() {
    setInvite({ status: "loading" });
    try {
      const res = await fetch("/api/couple/invites", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao criar convite");
      setInvite({ status: "ready", code: data.invite.code, coupleId: data.invite.coupleId });
    } catch (err: unknown) {
      setInvite({
        status: "error",
        message: err instanceof Error ? err.message : "Não foi possível gerar o convite.",
      });
    }
  }

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    void createInvite();
  }, []);

  async function handleCopy() {
    if (invite.status !== "ready") return;
    const link = `${window.location.origin}/join/${invite.code}`;
    await navigator.clipboard.writeText(link).catch(() => {
      navigator.clipboard.writeText(invite.code);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleSkip() {
    router.push("/onboarding/renda?mode=solo");
  }

  const inviteLink =
    invite.status === "ready"
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${invite.code}`
      : "";

  return (
    <div className="space-y-6">
      <OnboardingStepper current={3} total={5} label="Convidar parceiro(a)" />

      <div className="card-surface space-y-6 p-6">
        <header>
          <h2 className="text-xl font-semibold text-text-primary">Convide seu(sua) parceiro(a)</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Compartilhe o código abaixo ou envie o link diretamente.
          </p>
        </header>

        {invite.status === "loading" && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" aria-label="Gerando convite…" />
          </div>
        )}

        {invite.status === "error" && (
          <div className="rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
            <p>{invite.message}</p>
            <button
              onClick={createInvite}
              className="mt-2 font-medium underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {invite.status === "ready" && (
          <div className="space-y-5">
            {/* Código grande */}
            <div className="rounded-[12px] border border-border bg-bg-secondary px-4 py-5 text-center">
              <p className="mb-1 text-xs text-text-tertiary">Código de convite</p>
              <p
                className="font-mono text-4xl font-bold tracking-[0.25em] text-text-primary"
                aria-label={`Código ${invite.code.split("").join(" ")}`}
              >
                {invite.code}
              </p>
            </div>

            {/* Link de convite */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-[10px] border border-border bg-bg-card px-3 py-2">
                <p className="flex-1 truncate font-mono text-xs text-text-secondary" title={inviteLink}>
                  {inviteLink}
                </p>
              </div>

              <button
                onClick={handleCopy}
                className="h-11 w-full rounded-[12px] bg-brand-primary text-sm font-semibold text-text-inverse transition hover:bg-brand-primary-hover"
              >
                {copied ? "✓ Link copiado!" : "Copiar link de convite"}
              </button>
            </div>

            {/* Aguardando */}
            <div className="flex items-center gap-3 rounded-[12px] bg-bg-secondary px-4 py-3">
              <span className="text-xl" aria-hidden>⏳</span>
              <div>
                <p className="text-sm font-medium text-text-primary">Aguardando seu(sua) parceiro(a)…</p>
                <p className="text-xs text-text-secondary">
                  Assim que ele(a) aceitar, você será notificado(a) no dashboard.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={handleSkip}
          className="text-sm text-text-tertiary underline-offset-2 hover:text-text-secondary hover:underline"
        >
          Pular por enquanto — usar sozinho(a)
        </button>
        <p className="mt-1 text-xs text-text-tertiary">
          O convite continuará válido. Seu parceiro(a) pode aceitar depois.
        </p>
      </div>
    </div>
  );
}
