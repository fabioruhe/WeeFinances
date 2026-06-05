"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiRequest } from "@/lib/api-client";

type ApiMessage = {
  type: "success" | "error";
  text: string;
};

type InvitePreview = {
  id: string;
  code: string;
  inviter: {
    id: string;
    name: string | null;
    email: string | null;
  };
  inviteeEmail?: string | null;
  expiresAt: string;
  status: string;
};

type CreateInviteResponse = {
  invite: {
    code: string;
  };
  reused: boolean;
  message?: string;
};

type ActionResponse = {
  message?: string;
};

function MessageBanner({ message }: { message: ApiMessage | null }) {
  if (!message) return null;

  const className =
    message.type === "success"
      ? "border-success/30 bg-success-light text-success"
      : "border-danger/30 bg-danger-light text-danger";

  return <p className={`rounded-xl border px-3 py-2 text-sm ${className}`}>{message.text}</p>;
}

export default function RelationshipSettingsPage() {
  const { pushToast } = useToast();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [acceptCode, setAcceptCode] = useState("");
  const [acceptIncome, setAcceptIncome] = useState("");
  const [income, setIncome] = useState("");
  const [unlinkReason, setUnlinkReason] = useState("");
  const [unlinkConfirmText, setUnlinkConfirmText] = useState("");

  const [inviteMessage, setInviteMessage] = useState<ApiMessage | null>(null);
  const [acceptMessage, setAcceptMessage] = useState<ApiMessage | null>(null);
  const [incomeMessage, setIncomeMessage] = useState<ApiMessage | null>(null);
  const [unlinkMessage, setUnlinkMessage] = useState<ApiMessage | null>(null);
  const [invitePreview, setInvitePreview] = useState<InvitePreview | null>(null);
  const [showUnlinkConfirmModal, setShowUnlinkConfirmModal] = useState(false);

  const [loadingAction, setLoadingAction] = useState<
    "invite" | "validate-invite" | "accept" | "income" | "unlink" | null
  >(null);

  function setErrorFeedback(
    setMessage: (message: ApiMessage) => void,
    title: string,
    description: string,
  ) {
    setMessage({ type: "error", text: description });
    pushToast({ type: "error", title, description });
  }

  function setSuccessFeedback(
    setMessage: (message: ApiMessage) => void,
    title: string,
    description: string,
  ) {
    setMessage({ type: "success", text: description });
    pushToast({ type: "success", title, description });
  }

  async function createInvite() {
    setLoadingAction("invite");
    setInviteMessage(null);

    const result = await apiRequest<CreateInviteResponse>(
      "/api/couple/invites",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteeEmail: inviteEmail.trim() ? inviteEmail.trim() : undefined,
        }),
      },
      "Nao foi possivel criar convite.",
    );

    if (!result.ok) {
      setErrorFeedback(setInviteMessage, "Falha ao criar convite", result.error);
      setLoadingAction(null);
      return;
    }

    const successText = result.data.reused
      ? `Convite pendente reutilizado: ${result.data.invite.code}`
      : `Convite criado com sucesso: ${result.data.invite.code}`;
    setInviteCode(result.data.invite.code);
    setSuccessFeedback(setInviteMessage, "Convite pronto", successText);
    setLoadingAction(null);
  }

  async function validateInviteCode() {
    setLoadingAction("validate-invite");
    setAcceptMessage(null);
    setInvitePreview(null);

    const code = acceptCode.trim();
    if (!code) {
      const errorText = "Informe um codigo para validar.";
      setErrorFeedback(setAcceptMessage, "Codigo obrigatorio", errorText);
      setLoadingAction(null);
      return;
    }

    const result = await apiRequest<InvitePreview>(
      `/api/couple/invites/${encodeURIComponent(code)}`,
      undefined,
      "Nao foi possivel validar o convite.",
    );

    if (!result.ok) {
      setErrorFeedback(setAcceptMessage, "Convite invalido", result.error);
      setLoadingAction(null);
      return;
    }

    setInvitePreview(result.data);
    setSuccessFeedback(
      setAcceptMessage,
      "Convite validado",
      "Dados do parceiro conferidos. Pode prosseguir com o aceite.",
    );
    setLoadingAction(null);
  }

  async function acceptInvite() {
    setLoadingAction("accept");
    setAcceptMessage(null);

    const parsedIncome = acceptIncome.trim() ? Number(acceptIncome) : undefined;
    const result = await apiRequest<ActionResponse>(
      "/api/couple/invites/accept",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: acceptCode.trim(),
          monthlyIncome: parsedIncome,
        }),
      },
      "Nao foi possivel aceitar convite.",
    );

    if (!result.ok) {
      setErrorFeedback(setAcceptMessage, "Falha ao aceitar convite", result.error);
      setLoadingAction(null);
      return;
    }

    setInvitePreview(null);
    const successText = result.data.message ?? "Modo casal ativado.";
    setSuccessFeedback(setAcceptMessage, "Modo casal ativado", successText);
    setLoadingAction(null);
  }

  async function saveIncome() {
    setLoadingAction("income");
    setIncomeMessage(null);

    const result = await apiRequest<ActionResponse>(
      "/api/couple/division",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyIncome: Number(income),
        }),
      },
      "Nao foi possivel salvar a renda.",
    );

    if (!result.ok) {
      setErrorFeedback(setIncomeMessage, "Falha ao salvar renda", result.error);
      setLoadingAction(null);
      return;
    }

    const successText = result.data.message ?? "Renda atualizada.";
    setSuccessFeedback(setIncomeMessage, "Renda atualizada", successText);
    setLoadingAction(null);
  }

  async function unlinkCouple() {
    setLoadingAction("unlink");
    setUnlinkMessage(null);

    const result = await apiRequest<ActionResponse>(
      "/api/couple/unlink",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: unlinkReason.trim() ? unlinkReason.trim() : undefined,
        }),
      },
      "Nao foi possivel desvincular neste momento.",
    );

    if (!result.ok) {
      setErrorFeedback(setUnlinkMessage, "Falha na desvinculacao", result.error);
      setLoadingAction(null);
      return;
    }

    const successText = result.data.message ?? "Desvinculacao concluida.";
    setSuccessFeedback(setUnlinkMessage, "Desvinculacao concluida", successText);
    setUnlinkConfirmText("");
    setShowUnlinkConfirmModal(false);
    setLoadingAction(null);
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-8 md:px-8">
        <section className="card-surface p-5">
          <h1 className="text-2xl font-semibold text-text-primary">Configuracoes de relacionamento</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Convide, aceite convite, configure divisao proporcional e gerencie desvinculacao.
          </p>
        </section>

        <section className="card-surface space-y-4 p-5">
          <h2 className="text-lg font-semibold text-text-primary">Convidar parceiro</h2>
          <input
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            className="h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm outline-none transition focus:border-border-focus"
            placeholder="Email opcional do parceiro"
          />
          <Button onClick={createInvite} disabled={loadingAction !== null}>
            {loadingAction === "invite" ? "Gerando convite..." : "Gerar convite"}
          </Button>
          {inviteCode ? (
            <p className="rounded-xl bg-brand-primary-light px-3 py-2 text-sm text-text-brand">
              Codigo atual: <span className="font-mono font-semibold">{inviteCode}</span>
            </p>
          ) : null}
          <MessageBanner message={inviteMessage} />
        </section>

        <section className="card-surface space-y-4 p-5">
          <h2 className="text-lg font-semibold text-text-primary">Aceitar convite</h2>
          <input
            value={acceptCode}
            onChange={(event) => {
              setAcceptCode(event.target.value);
              setInvitePreview(null);
              setAcceptMessage(null);
            }}
            className="h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm outline-none transition focus:border-border-focus"
            placeholder="Codigo de convite"
          />
          <input
            value={acceptIncome}
            onChange={(event) => setAcceptIncome(event.target.value)}
            className="h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm outline-none transition focus:border-border-focus"
            placeholder="Sua renda mensal (opcional)"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={validateInviteCode}
              disabled={!acceptCode || loadingAction !== null}
            >
              {loadingAction === "validate-invite" ? "Validando..." : "Validar codigo"}
            </Button>
            <Button
              onClick={acceptInvite}
              disabled={!acceptCode || loadingAction !== null || !invitePreview}
            >
              {loadingAction === "accept" ? "Aceitando..." : "Aceitar e entrar no modo casal"}
            </Button>
          </div>
          {invitePreview ? (
            <div className="rounded-xl border border-info/30 bg-info-light px-3 py-2 text-sm text-text-primary">
              <p>
                Convite de:{" "}
                <span className="font-medium">
                  {invitePreview.inviter.name ?? invitePreview.inviter.email ?? "Parceiro"}
                </span>
              </p>
              <p className="text-xs text-text-secondary">
                Expira em: {new Date(invitePreview.expiresAt).toLocaleString("pt-BR")}
              </p>
            </div>
          ) : null}
          <MessageBanner message={acceptMessage} />
        </section>

        <section className="card-surface space-y-4 p-5">
          <h2 className="text-lg font-semibold text-text-primary">Divisao proporcional</h2>
          <input
            value={income}
            onChange={(event) => setIncome(event.target.value)}
            className="h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm outline-none transition focus:border-border-focus"
            placeholder="Informe sua renda mensal"
          />
          <Button onClick={saveIncome} disabled={!income || loadingAction !== null}>
            {loadingAction === "income" ? "Salvando..." : "Salvar renda"}
          </Button>
          <MessageBanner message={incomeMessage} />
        </section>

        <section className="card-surface space-y-4 p-5">
          <h2 className="text-lg font-semibold text-danger">Desvincular casal</h2>
          <textarea
            value={unlinkReason}
            onChange={(event) => setUnlinkReason(event.target.value)}
            className="min-h-24 w-full rounded-[10px] border border-border bg-bg-card px-3 py-2 text-sm outline-none transition focus:border-border-focus"
            placeholder="Motivo opcional para registro no historico"
          />
          <Button
            variant="destructive"
            onClick={() => {
              setUnlinkConfirmText("");
              setShowUnlinkConfirmModal(true);
            }}
            disabled={loadingAction !== null}
            className="w-full md:w-auto"
          >
            Abrir confirmacao de desvinculacao
          </Button>
          <MessageBanner message={unlinkMessage} />
        </section>

        <section className="card-surface p-5">
          <p className="text-sm text-text-secondary">
            Quer conferir os dados compartilhados preservados?{" "}
            <Link href="/settings/history" className="font-medium text-text-brand">
              Abrir historico read-only
            </Link>
          </p>
        </section>
      </main>

      {showUnlinkConfirmModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-lg rounded-[12px] border border-border bg-bg-card p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-text-primary">Confirmar desvinculacao</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Esta acao volta as contas para modo solo. Dados individuais permanecem, e os dados
              compartilhados ficam disponiveis no historico read-only.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setUnlinkConfirmText("");
                  setShowUnlinkConfirmModal(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={unlinkCouple}
                disabled={loadingAction === "unlink" || unlinkConfirmText !== "DESVINCULAR"}
              >
                {loadingAction === "unlink" ? "Desvinculando..." : "Confirmar desvinculacao"}
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-text-secondary">
                Para confirmar, digite <span className="font-mono font-semibold">DESVINCULAR</span>
              </p>
              <input
                value={unlinkConfirmText}
                onChange={(event) => setUnlinkConfirmText(event.target.value)}
                className="h-10 w-full rounded-[10px] border border-border bg-bg-card px-3 text-sm outline-none transition focus:border-border-focus"
                placeholder="DESVINCULAR"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
