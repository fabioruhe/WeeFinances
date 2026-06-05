"use client";

import { useState, useEffect } from "react";
import { OnboardingStepper } from "@/components/onboarding/stepper";

type DivisaoTipo = "PROPORCIONAL" | "IGUALITARIA" | "FIXA";

type UserData = {
  id: string;
  nome: string;
  income: number | null;
  incomeTipo: string | null;
};

type DivisaoData = {
  userA: UserData;
  userB: UserData | null;
  divisaoTipo: DivisaoTipo | null;
};

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function computePercents(incomeA: number | null, incomeB: number | null) {
  if (!incomeA || !incomeB) return { pctA: 50, pctB: 50 };
  const total = incomeA + incomeB;
  const pctA = Math.round((incomeA / total) * 100);
  return { pctA, pctB: 100 - pctA };
}

type TipoCardProps = {
  tipo: DivisaoTipo;
  selected: boolean;
  onSelect: () => void;
  userA: UserData;
  userB: UserData | null;
};

function TipoCard({ tipo, selected, onSelect, userA, userB }: TipoCardProps) {
  const { pctA, pctB } = computePercents(userA.income, userB?.income ?? null);

  const labels: Record<DivisaoTipo, { title: string; description: string }> = {
    PROPORCIONAL: {
      title: "Proporcional",
      description: `${userA.nome} contribui ${pctA}% e ${userB?.nome ?? "parceiro(a)"} contribui ${pctB}% das despesas comuns.`,
    },
    IGUALITARIA: {
      title: "50/50 — Igualitária",
      description: "Cada um contribui com metade das despesas comuns, independente da renda.",
    },
    FIXA: {
      title: "Valor fixo",
      description: "Cada pessoa define um valor fixo de contribuição mensal para despesas comuns.",
    },
  };

  const info = labels[tipo];

  return (
    <label
      className={[
        "flex cursor-pointer flex-col gap-3 rounded-[14px] border p-4 transition-all",
        selected
          ? "border-brand-primary bg-brand-primary-light"
          : "border-border bg-bg-card hover:border-brand-primary-muted",
      ].join(" ")}
    >
      <input
        type="radio"
        name="divisao-tipo"
        value={tipo}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />

      <div className="flex items-start gap-3">
        <span
          className={[
            "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected ? "border-brand-primary bg-brand-primary" : "border-border",
          ].join(" ")}
          aria-hidden
        >
          {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        <div>
          <p className="font-semibold text-text-primary">{info.title}</p>
          <p className="mt-0.5 text-sm text-text-secondary">{info.description}</p>
        </div>
      </div>

      {/* Barra de simulação visual */}
      {tipo !== "FIXA" && (
        <div className="h-3 overflow-hidden rounded-full bg-bg-tertiary" aria-hidden>
          <div className="flex h-full">
            <div
              className="bg-partner-a transition-all duration-500"
              style={{
                width: tipo === "PROPORCIONAL" ? `${pctA}%` : "50%",
              }}
            />
            <div
              className="bg-partner-b transition-all duration-500"
              style={{
                width: tipo === "PROPORCIONAL" ? `${pctB}%` : "50%",
              }}
            />
          </div>
        </div>
      )}

      {tipo === "PROPORCIONAL" && (
        <div className="flex justify-between text-xs text-text-tertiary" aria-hidden>
          <span className="font-medium text-partner-a">{userA.nome}: {pctA}%</span>
          <span className="font-medium text-partner-b">{userB?.nome ?? "Parceiro(a)"}: {pctB}%</span>
        </div>
      )}
    </label>
  );
}

export default function DivisaoPage() {
  const [data, setData] = useState<DivisaoData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedTipo, setSelectedTipo] = useState<DivisaoTipo>("PROPORCIONAL");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/onboarding/divisao")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.divisaoTipo) setSelectedTipo(d.divisaoTipo);
      })
      .catch(() => setError("Não foi possível carregar os dados. Tente recarregar."))
      .finally(() => setLoadingData(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/divisao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divisaoTipo: selectedTipo }),
      });
      if (!res.ok) throw new Error();
      window.location.href = "/dashboard";
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
        <p className="text-sm text-text-secondary">Carregando dados do casal…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger-light p-4 text-sm text-danger">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const partnerAIncome = data.userA.income;
  const partnerBIncome = data.userB?.income ?? null;
  const bothHaveIncome = partnerAIncome !== null && partnerBIncome !== null;

  return (
    <div className="space-y-6">
      <OnboardingStepper current={5} total={5} label="Configurar divisão" />

      <div className="card-surface space-y-6 p-6">
        <header>
          <h2 className="text-xl font-semibold text-text-primary">Como vão dividir as despesas?</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Você pode mudar isso a qualquer momento em Configurações.
          </p>
        </header>

        {/* Rendas lado a lado */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[12px] border-l-4 border-partner-a bg-bg-secondary p-3">
            <p className="text-xs font-medium text-partner-a">{data.userA.nome}</p>
            <p className="mt-1 font-display text-lg italic font-bold text-text-primary">
              {formatMoney(partnerAIncome)}
            </p>
            {!partnerAIncome && (
              <p className="text-xs text-text-tertiary">Renda não informada</p>
            )}
          </div>
          <div className="rounded-[12px] border-l-4 border-partner-b bg-bg-secondary p-3">
            <p className="text-xs font-medium text-partner-b">{data.userB?.nome ?? "Parceiro(a)"}</p>
            <p className="mt-1 font-display text-lg italic font-bold text-text-primary">
              {formatMoney(partnerBIncome)}
            </p>
            {!partnerBIncome && (
              <p className="text-xs text-text-tertiary">Aguardando renda</p>
            )}
          </div>
        </div>

        {!bothHaveIncome && (
          <div className="rounded-xl border border-warning/30 bg-warning-light px-4 py-3 text-sm text-warning">
            Aguardando seu(sua) parceiro(a) informar a renda. Você pode configurar a divisão agora e ajustar depois.
          </div>
        )}

        <fieldset className="space-y-3">
          <legend className="sr-only">Escolha o tipo de divisão</legend>
          {(["PROPORCIONAL", "IGUALITARIA", "FIXA"] as DivisaoTipo[]).map((tipo) => (
            <TipoCard
              key={tipo}
              tipo={tipo}
              selected={selectedTipo === tipo}
              onSelect={() => setSelectedTipo(tipo)}
              userA={data.userA}
              userB={data.userB}
            />
          ))}
        </fieldset>

        {error && (
          <p className="text-sm text-danger" role="alert">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="h-11 w-full rounded-[12px] bg-brand-primary text-sm font-semibold text-text-inverse transition hover:bg-brand-primary-hover disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Confirmar e ir para o Dashboard →"}
        </button>
      </div>
    </div>
  );
}
