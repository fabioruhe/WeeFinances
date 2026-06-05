"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Pencil,
  Check,
  X,
  AlertTriangle,
  Wallet,
  TrendingUp,
  ShoppingBag,
  Home,
  Loader2,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  getBudgets,
  upsertBudgets,
  generateBudget,
  type BudgetItem,
  type BudgetGrupo,
  type BudgetStatus,
  type BudgetSugestao,
  type GenerateResult,
} from "@/lib/clients/budgets-client";
import { mesToLabel } from "@/lib/budget-utils";

// ─── Helpers visuais ──────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return LucideIcons.Tag;
  const key = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("") as keyof typeof LucideIcons;
  return (LucideIcons[key] as LucideIcon) ?? LucideIcons.Tag;
}

function navMes(mes: string, delta: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const STATUS_COLOR: Record<BudgetStatus, string> = {
  NORMAL: "var(--success)",
  ATENCAO: "var(--warning)",
  CRITICO: "#d97706",
  ESTOURADO: "var(--danger)",
  SEM_LIMITE: "var(--text-tertiary)",
};

const STATUS_BG: Record<BudgetStatus, string> = {
  NORMAL: "var(--success-light)",
  ATENCAO: "var(--warning-light)",
  CRITICO: "#fffbeb",
  ESTOURADO: "var(--danger-light)",
  SEM_LIMITE: "var(--bg-secondary)",
};

const STATUS_LABEL: Record<BudgetStatus, string> = {
  NORMAL: "Normal",
  ATENCAO: "Atenção",
  CRITICO: "Crítico",
  ESTOURADO: "Estourado",
  SEM_LIMITE: "Sem limite",
};

const GRUPO_CONFIG: Record<BudgetGrupo, { label: string; icon: LucideIcon; cor: string; percent: number }> = {
  NECESSIDADES: { label: "Necessidades", icon: Home, cor: "var(--info)", percent: 50 },
  DESEJOS: { label: "Desejos", icon: ShoppingBag, cor: "var(--brand-secondary)", percent: 30 },
  FUTURO: { label: "Futuro", icon: TrendingUp, cor: "var(--success)", percent: 20 },
};

// ─── Barra de progresso ───────────────────────────────────────────────────────

function ProgressBar({
  percentual,
  status,
  height = 6,
}: {
  percentual: number | null;
  status: BudgetStatus;
  height?: number;
}) {
  const pct = Math.min(percentual ?? 0, 100);
  if (status === "SEM_LIMITE") {
    return (
      <div
        className="w-full rounded-full"
        style={{ height, background: "var(--bg-tertiary)" }}
      />
    );
  }
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height, background: "var(--bg-tertiary)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: STATUS_COLOR[status] }}
      />
    </div>
  );
}

// ─── Card de grupo ────────────────────────────────────────────────────────────

function GrupoCard({
  grupo,
  budgets,
}: {
  grupo: BudgetGrupo;
  budgets: BudgetItem[];
}) {
  const cfg = GRUPO_CONFIG[grupo];
  const Icon = cfg.icon;
  const items = budgets.filter((b) => b.grupo === grupo);
  const gasto = items.reduce((acc, b) => acc + b.gasto_atual, 0);
  const limite = items.reduce((acc, b) => acc + (b.limite ?? 0), 0);
  const pct = limite > 0 ? Math.min((gasto / limite) * 100, 100) : null;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${cfg.cor} 15%, transparent)` }}
        >
          <Icon size={14} style={{ color: cfg.cor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
            {cfg.label} · {cfg.percent}%
          </p>
        </div>
      </div>
      <ProgressBar percentual={pct} status={pct === null ? "SEM_LIMITE" : pct > 100 ? "ESTOURADO" : pct >= 90 ? "CRITICO" : pct >= 70 ? "ATENCAO" : "NORMAL"} height={4} />
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {formatCurrency(gasto)}
        </span>
        {limite > 0 ? (
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            / {formatCurrency(limite)}
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            sem limite
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Modal de sugestão 50/30/20 ───────────────────────────────────────────────

type SugestaoModalProps = {
  result: GenerateResult;
  mes: string;
  onConfirm: (sugestoes: BudgetSugestao[]) => void;
  onClose: () => void;
  saving: boolean;
};

function SugestaoModal({ result, mes, onConfirm, onClose, saving }: SugestaoModalProps) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(result.sugestoes.map((s) => [s.categoriaId, s.limiteSugerido]))
  );

  const total = Object.values(values).reduce((a, b) => a + b, 0);
  const diff = total - result.rendaTotal;

  const handleConfirm = () => {
    const sugestoes = result.sugestoes.map((s) => ({
      ...s,
      limiteSugerido: values[s.categoriaId] ?? s.limiteSugerido,
    }));
    onConfirm(sugestoes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full md:max-w-lg rounded-t-3xl md:rounded-2xl flex flex-col max-h-[90vh]"
        style={{ background: "var(--bg-card)" }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} style={{ color: "var(--brand-accent)" }} />
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                Sugestão 50/30/20
              </h2>
            </div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Renda do casal em {mesToLabel(mes)}:{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {formatCurrency(result.rendaTotal)}
              </strong>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: "var(--text-tertiary)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Distribuição */}
        <div className="grid grid-cols-3 gap-2 px-5 pb-3 shrink-0">
          {(["NECESSIDADES", "DESEJOS", "FUTURO"] as BudgetGrupo[]).map((g) => {
            const cfg = GRUPO_CONFIG[g];
            return (
              <div
                key={g}
                className="rounded-xl p-2.5 text-center"
                style={{ background: `color-mix(in srgb, ${cfg.cor} 10%, transparent)` }}
              >
                <p className="text-xs font-medium" style={{ color: cfg.cor }}>
                  {cfg.label}
                </p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                  {formatCurrency(result.distribuicao[g])}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  {cfg.percent}%
                </p>
              </div>
            );
          })}
        </div>

        {/* Lista editável */}
        <div className="overflow-y-auto flex-1 px-5 pb-2 divide-y" style={{ borderColor: "var(--divider)" }}>
          {(["NECESSIDADES", "DESEJOS", "FUTURO"] as BudgetGrupo[]).map((g) => {
            const cfg = GRUPO_CONFIG[g];
            const items = result.sugestoes.filter((s) => s.grupo === g);
            if (items.length === 0) return null;
            return (
              <div key={g} className="py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: cfg.cor }}>
                  {cfg.label}
                </p>
                <div className="space-y-1.5">
                  {items.map((s) => {
                    const Icon = getIcon(s.icone);
                    return (
                      <div key={s.categoriaId} className="flex items-center gap-3">
                        <Icon size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                        <span className="flex-1 text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                          {s.categoriaNome}
                        </span>
                        <div className="w-32">
                          <CurrencyInput
                            value={values[s.categoriaId] ?? s.limiteSugerido}
                            onChange={(v) =>
                              setValues((prev) => ({
                                ...prev,
                                [s.categoriaId]: v,
                              }))
                            }
                            className="h-8 w-full rounded-lg border border-border bg-bg-secondary py-1 pl-8 pr-2 text-sm font-medium text-text-primary text-right outline-none transition focus:border-border-focus"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé */}
        <div
          className="px-5 py-4 border-t shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Total alocado
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: Math.abs(diff) < 1 ? "var(--success)" : "var(--warning)" }}
            >
              {formatCurrency(total)}
              {Math.abs(diff) >= 1 && (
                <span className="text-xs font-normal ml-1" style={{ color: "var(--text-tertiary)" }}>
                  ({diff > 0 ? "+" : ""}{formatCurrency(diff)})
                </span>
              )}
            </span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ background: "var(--brand-primary)", color: "white" }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Aplicar orçamento
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Linha de categoria ───────────────────────────────────────────────────────

type CategoriaRowProps = {
  item: BudgetItem;
  mes: string;
  onSaved: () => void;
};

function CategoriaRow({ item, mes, onSaved }: CategoriaRowProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.limite ?? 0);
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();

  const Icon = getIcon(item.categoria.icone);
  const hasBudget = item.limite !== null;

  const handleSave = async () => {
    if (value < 0) {
      pushToast({ title: "Valor inválido", type: "error" });
      return;
    }
    const limite = value;
    setSaving(true);
    const res = await upsertBudgets([
      { categoriaId: item.categoria.id, limiteMensal: limite, mesReferencia: mes },
    ]);
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      onSaved();
    } else {
      pushToast({ title: res.error, type: "error" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditing(false);
      setValue(item.limite ?? 0);
    }
  };

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3 mb-2.5">
        {/* Ícone */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: STATUS_BG[item.status] }}
        >
          <Icon size={14} style={{ color: STATUS_COLOR[item.status] }} />
        </div>

        {/* Nome */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {item.categoria.nome}
          </p>
          {hasBudget && (
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {formatCurrency(item.gasto_atual)}{" "}
              <span style={{ color: "var(--text-tertiary)" }}>/ {formatCurrency(item.limite!)}</span>
            </p>
          )}
        </div>

        {/* Badge de status */}
        {hasBudget && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: STATUS_BG[item.status], color: STATUS_COLOR[item.status] }}
          >
            {item.percentual !== null ? `${item.percentual.toFixed(0)}%` : STATUS_LABEL[item.status]}
          </span>
        )}

        {/* Botão editar / campos */}
        {editing ? (
          <div className="flex items-center gap-1 shrink-0">
            <div className="w-32">
              <CurrencyInput
                value={value}
                onChange={setValue}
                className="h-8 w-full rounded-lg border border-border-focus bg-bg-secondary py-1 pl-8 pr-2 text-sm font-medium text-text-primary text-right outline-none transition focus:border-border-focus"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-60"
              style={{ background: "var(--brand-primary)" }}
            >
              {saving ? (
                <Loader2 size={12} className="animate-spin" style={{ color: "white" }} />
              ) : (
                <Check size={12} style={{ color: "white" }} />
              )}
            </button>
            <button
              onClick={() => { setEditing(false); setValue(item.limite ?? 0); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--bg-secondary)" }}
            >
              <X size={12} style={{ color: "var(--text-tertiary)" }} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setEditing(true); setValue(item.limite ?? 0); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-opacity hover:opacity-70"
            style={{ background: "var(--bg-secondary)" }}
          >
            <Pencil size={12} style={{ color: "var(--text-tertiary)" }} />
          </button>
        )}
      </div>

      {/* Barra de progresso */}
      {hasBudget ? (
        <ProgressBar percentual={item.percentual} status={item.status} height={5} />
      ) : (
        <div
          className="text-xs py-1 px-2 rounded-lg inline-flex items-center gap-1"
          style={{ background: "var(--bg-secondary)", color: "var(--text-tertiary)" }}
        >
          Sem limite definido · clique em{" "}
          <Pencil size={10} className="inline" /> para configurar
        </div>
      )}

      {/* Alertas */}
      {item.status === "ESTOURADO" && (
        <div
          className="mt-2 text-xs rounded-lg px-3 py-2 flex items-start gap-2"
          style={{ background: "var(--danger-light)", color: "var(--danger)" }}
        >
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          O orçamento de {item.categoria.nome} foi atingido. Querem realocar de outra categoria?
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

type Props = { userId: string; isCouple: boolean };

export function OrcamentoClient({ isCouple }: Props) {
  const [mes, setMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sugestaoResult, setSugestaoResult] = useState<GenerateResult | null>(null);
  const [savingSugestao, setSavingSugestao] = useState(false);
  const { pushToast } = useToast();

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    const res = await getBudgets(mes);
    if (res.ok) {
      setBudgets(res.data.budgets);
    } else {
      pushToast({ title: res.error, type: "error" });
    }
    setLoading(false);
  }, [mes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const handleGenerate = async () => {
    setGenerating(true);
    const res = await generateBudget(mes);
    setGenerating(false);
    if (res.ok) {
      setSugestaoResult(res.data);
    } else {
      pushToast({ title: res.error, type: "error" });
    }
  };

  const handleApplySugestao = async (sugestoes: BudgetSugestao[]) => {
    setSavingSugestao(true);
    const items = sugestoes.map((s) => ({
      categoriaId: s.categoriaId,
      limiteMensal: s.limiteSugerido,
      mesReferencia: mes,
    }));
    const res = await upsertBudgets(items);
    setSavingSugestao(false);
    if (res.ok) {
      setSugestaoResult(null);
      pushToast({ title: "Orçamento aplicado com sucesso!", type: "success" });
      loadBudgets();
    } else {
      pushToast({ title: res.error, type: "error" });
    }
  };

  // Métricas gerais
  const totalGasto = budgets.reduce((acc, b) => acc + b.gasto_atual, 0);
  const totalLimite = budgets.reduce((acc, b) => acc + (b.limite ?? 0), 0);
  const percentualGeral = totalLimite > 0 ? Math.min((totalGasto / totalLimite) * 100, 100) : null;
  const statusGeral: BudgetStatus =
    percentualGeral === null
      ? "SEM_LIMITE"
      : percentualGeral > 100
      ? "ESTOURADO"
      : percentualGeral >= 90
      ? "CRITICO"
      : percentualGeral >= 70
      ? "ATENCAO"
      : "NORMAL";

  // Alertas de atenção/crítico
  const alertas = budgets.filter((b) => b.status === "CRITICO" || b.status === "ESTOURADO");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-10">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--text-primary)" }}
          >
            Orçamento
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {isCouple ? "Planejamento do casal" : "Seu planejamento mensal"}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-60"
          style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)", border: "1px solid var(--brand-primary-muted)" }}
        >
          {generating ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Sparkles size={13} />
          )}
          50/30/20
        </button>
      </div>

      {/* ── Seletor de mês ─────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <button
          onClick={() => setMes((m) => navMes(m, -1))}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <ChevronLeft size={15} style={{ color: "var(--text-secondary)" }} />
        </button>
        <span className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)", minWidth: 160, textAlign: "center" }}>
          {mesToLabel(mes)}
        </span>
        <button
          onClick={() => setMes((m) => navMes(m, 1))}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <ChevronRight size={15} style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Carregando orçamento…
          </p>
        </div>
      ) : (
        <>
          {/* ── Seção 1: Resumo ─────────────────────────────────────── */}
          <section className="mb-5">
            {/* Barra geral */}
            <div
              className="rounded-2xl p-4 mb-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex justify-between items-end mb-2">
                <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Total gasto no mês
                </p>
                {percentualGeral !== null && (
                  <span
                    className="text-xs font-bold"
                    style={{ color: STATUS_COLOR[statusGeral] }}
                  >
                    {percentualGeral.toFixed(0)}%
                  </span>
                )}
              </div>
              <ProgressBar percentual={percentualGeral} status={statusGeral} height={8} />
              <div className="flex justify-between items-center mt-2">
                <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {formatCurrency(totalGasto)}
                </span>
                {totalLimite > 0 && (
                  <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    de {formatCurrency(totalLimite)}
                  </span>
                )}
              </div>
            </div>

            {/* Cards dos grupos */}
            <div className="grid grid-cols-3 gap-2">
              {(["NECESSIDADES", "DESEJOS", "FUTURO"] as BudgetGrupo[]).map((g) => (
                <GrupoCard key={g} grupo={g} budgets={budgets} />
              ))}
            </div>
          </section>

          {/* ── Alertas ─────────────────────────────────────────────── */}
          {alertas.length > 0 && (
            <div
              className="rounded-2xl p-3 mb-4 flex items-start gap-2"
              style={{ background: "var(--danger-light)", border: "1px solid var(--danger)" }}
            >
              <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: "var(--danger)" }} />
              <p className="text-xs" style={{ color: "var(--danger)" }}>
                {alertas.length === 1
                  ? `"${alertas[0].categoria.nome}" está ${STATUS_LABEL[alertas[0].status].toLowerCase()}.`
                  : `${alertas.length} categorias precisam de atenção.`}
              </p>
            </div>
          )}

          {/* ── Seção 2: Por categoria ──────────────────────────────── */}
          <section className="mb-5">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
              Por categoria
            </h2>
            <div className="space-y-2">
              {budgets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    Nenhuma categoria encontrada.
                  </p>
                </div>
              ) : (
                budgets.map((b) => (
                  <CategoriaRow
                    key={b.categoria.id}
                    item={b}
                    mes={mes}
                    onSaved={loadBudgets}
                  />
                ))
              )}
            </div>
          </section>

          {/* ── Seção 3: Dinheiro livre ─────────────────────────────── */}
          <section>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
              Dinheiro livre
            </h2>
            <div
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: "var(--brand-secondary-light)", border: "1px solid var(--brand-secondary)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--brand-secondary)", opacity: 0.85 }}
              >
                <Wallet size={18} style={{ color: "white" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Gasto pessoal sem justificativa
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  Cada parceiro pode ter um valor mensal livre.
                  Configure nas preferências do casal.
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Modal de sugestão ─────────────────────────────────────── */}
      {sugestaoResult && (
        <SugestaoModal
          result={sugestaoResult}
          mes={mes}
          onConfirm={handleApplySugestao}
          onClose={() => setSugestaoResult(null)}
          saving={savingSugestao}
        />
      )}
    </div>
  );
}
