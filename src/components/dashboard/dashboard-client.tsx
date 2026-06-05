"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, X } from "lucide-react";
import Link from "next/link";

import type { DashboardData, DashboardScope } from "@/app/api/dashboard/route";
import { ScopeToggle } from "./scope-toggle";
import { CardSaldo } from "./card-saldo";
import { CardScore } from "./card-score";
import { CardContas } from "./card-contas";
import { CardMetas } from "./card-metas";
import { CardCategorias } from "./card-categorias";
import { CardEvolucao } from "./card-evolucao";
import { DashboardSkeleton } from "./loading-skeletons";

type Props = {
  initialData: DashboardData | null;
  mode: "solo" | "couple";
  partnerName: string | null;
};

async function fetchDashboard(scope: DashboardScope): Promise<DashboardData> {
  const res = await fetch(`/api/dashboard?scope=${scope}`);
  if (!res.ok) throw new Error("Falha ao carregar dados do dashboard");
  return res.json();
}

// CTA para convidar parceiro (modo solo) - dismissível, 1x/semana
function SoloCTA({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-1"
      style={{
        background: "var(--brand-primary-light)",
        border: "1px solid var(--brand-primary-muted)",
      }}
    >
      <UserPlus size={18} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />
      <p className="text-sm flex-1" style={{ color: "var(--text-brand)" }}>
        Gerencie a dois —{" "}
        <Link
          href="/onboarding/convite"
          className="font-semibold underline underline-offset-2"
          style={{ color: "var(--brand-primary)" }}
        >
          Convide seu parceiro(a)
        </Link>
      </p>
      <button
        onClick={onDismiss}
        aria-label="Fechar"
        className="p-1 rounded-full transition-colors"
        style={{ color: "var(--text-brand)" }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function SoloCTAWrapper() {
  const STORAGE_KEY = "wee_solo_cta_dismissed";

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    const ts = localStorage.getItem(STORAGE_KEY);
    if (!ts) return false;
    const diff = Date.now() - parseInt(ts, 10);
    return diff < 7 * 24 * 60 * 60 * 1000;
  });

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
  }

  return <SoloCTA onDismiss={handleDismiss} />;
}

// Greeting com hora do dia
function Greeting() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div>
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        {greeting} 👋
      </h1>
      <p className="text-sm mt-0.5 capitalize" style={{ color: "var(--text-tertiary)" }}>
        {mesAtual}
      </p>
    </div>
  );
}

export function DashboardClient({ initialData, mode, partnerName }: Props) {
  const [scope, setScope] = useState<DashboardScope>("meu");

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard", scope],
    queryFn: () => fetchDashboard(scope),
    initialData: scope === "meu" && initialData ? initialData : undefined,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  // Fallback empty state se não tiver dados
  const d = data ?? {
    saldo: { receitas: 0, despesas: 0, saldo: 0 },
    score: {
      total: 0,
      breakdown: {
        reservaEmergencia: 0,
        taxaPoupanca: 0,
        endividamento: 0,
        alinhamentoMetas: 0,
        checkIns: 0,
        progressoMetas: 0,
        diversificacao: 0,
      },
    },
    proximasContas: [],
    metas: [],
    gastosPorCategoria: [],
    evolucaoMensal: [],
  };

  return (
    <div className="px-4 md:px-6 py-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <Greeting />
        {mode === "couple" ? (
          <ScopeToggle
            scope={scope}
            onScopeChange={setScope}
            partnerName={partnerName}
          />
        ) : null}
      </div>

      {/* Solo CTA */}
      {mode === "solo" && <SoloCTAWrapper />}

      {/* Grid de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Card 1: Saldo */}
        <CardSaldo data={d.saldo} />

        {/* Card 2: Score */}
        <CardScore data={d.score} mode={mode} />

        {/* Card 3: Próximas Contas */}
        <CardContas data={d.proximasContas} />

        {/* Card 4: Metas */}
        <CardMetas data={d.metas} />

        {/* Card 5: Gastos por Categoria — ocupa 2 colunas em sm */}
        <div className="sm:col-span-2 xl:col-span-1">
          <CardCategorias data={d.gastosPorCategoria} />
        </div>

        {/* Card 6: Evolução Mensal — ocupa toda a largura */}
        <div className="sm:col-span-2 xl:col-span-3">
          <CardEvolucao data={d.evolucaoMensal} />
        </div>
      </div>
    </div>
  );
}
