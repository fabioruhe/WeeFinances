"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, ChevronLeft, ChevronRight, PartyPopper, Star, TrendingUp, AlertTriangle, Check } from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { CurrencyInput } from "@/components/ui/currency-input";
import { OnboardingStepper } from "@/components/onboarding/stepper";
import {
  fetchCheckinPreview,
  createCheckin,
  STEP_LABELS_COUPLE,
  STEP_LABELS_SOLO,
  SENTIMENT_EMOJI,
  SENTIMENT_LABELS,
  type CheckinPreview,
  type BudgetAdjustment,
} from "@/lib/clients/checkins-client";

// ─── Formatação ───────────────────────────────────────────────────────────────

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Barra de progresso ──────────────────────────────────────────────────────

function ProgressBar({ progresso }: { progresso: number }) {
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: 8, background: "var(--bg-tertiary)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.min(progresso, 100)}%`,
          background:
            progresso >= 100
              ? "var(--success)"
              : "linear-gradient(90deg, var(--brand-primary) 0%, var(--brand-accent) 100%)",
        }}
      />
    </div>
  );
}

// ─── Sentiment Picker ────────────────────────────────────────────────────────

function SentimentPicker({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {label}
      </p>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="transition-transform hover:scale-110"
            style={{ padding: 4 }}
          >
            <Star
              size={36}
              fill={n <= value ? "var(--brand-accent)" : "none"}
              stroke={n <= value ? "var(--brand-accent)" : "var(--text-tertiary)"}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {SENTIMENT_EMOJI[value]} {SENTIMENT_LABELS[value]}
        </p>
      )}
    </div>
  );
}

// ─── Ajuste Option ──────────────────────────────────────────────────────────

type AjusteOpcao = "aumentar" | "manter" | "atipico";

type AjusteState = {
  opcao: AjusteOpcao;
  novoLimite: number;
};

// ─── Main Component ─────────────────────────────────────────────────────────

export function CheckinClient() {
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<CheckinPreview | null>(null);
  const [step, setStep] = useState(1);
  const [sentimentoA, setSentimentoA] = useState(0);
  const [sentimentoB, setSentimentoB] = useState(0);
  const [ajustes, setAjustes] = useState<Map<string, AjusteState>>(new Map());
  const [saving, setSaving] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const confettiFired = useRef(false);
  const celebrationFired = useRef(false);

  const isCouple = preview?.isCouple ?? false;
  const stepLabels = isCouple ? STEP_LABELS_COUPLE : STEP_LABELS_SOLO;
  const totalSteps = stepLabels.length;

  // Current month as YYYY-MM
  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const loadPreview = useCallback(async () => {
    setLoading(true);
    const res = await fetchCheckinPreview(mesAtual);
    if (res.ok) {
      setPreview(res.data);
      // Initialize ajustes state for each estourada
      const map = new Map<string, AjusteState>();
      for (const cat of res.data.categoriasEstouradas) {
        map.set(cat.categoriaId, { opcao: "manter", novoLimite: cat.limite });
      }
      setAjustes(map);
    } else {
      pushToast({ type: "error", title: res.error });
    }
    setLoading(false);
  }, [mesAtual, pushToast]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  // ── Celebration confetti ──
  useEffect(() => {
    if (
      step === 2 &&
      preview &&
      !celebrationFired.current &&
      (preview.metasAvancaram.length > 0 ||
        preview.dividasPagas.length > 0 ||
        preview.valorEconomizado > 0)
    ) {
      celebrationFired.current = true;
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    }
  }, [step, preview]);

  // ── Submit ──
  const handleSubmit = async () => {
    if (!preview) return;
    if (sentimentoA === 0) {
      pushToast({ type: "error", title: "Selecione seu sentimento antes de finalizar." });
      return;
    }

    setSaving(true);

    // Build budget adjustments
    const budgetAjustes: BudgetAdjustment[] = [];
    for (const [catId, state] of ajustes) {
      if (state.opcao === "aumentar") {
        budgetAjustes.push({
          categoriaId: catId,
          novoLimite: state.novoLimite,
          mesReferencia: mesAtual,
        });
      }
    }

    const resumoJson = {
      receitas: preview.receitas,
      despesas: preview.despesas,
      saldo: preview.saldo,
      categoriasEstouradas: preview.categoriasEstouradas.length,
      categoriasDentro: preview.categoriasDentro,
      metasAvancaram: preview.metasAvancaram.length,
      dividasPagas: preview.dividasPagas.length,
      valorEconomizado: preview.valorEconomizado,
    };

    const res = await createCheckin({
      mes: mesAtual,
      sentimentoA,
      sentimentoB: isCouple && sentimentoB > 0 ? sentimentoB : null,
      ajustes: budgetAjustes.length > 0 ? budgetAjustes : undefined,
      resumoJson,
    });

    setSaving(false);

    if (res.ok) {
      setConcluido(true);
      if (!confettiFired.current) {
        confettiFired.current = true;
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    } else {
      pushToast({ type: "error", title: res.error });
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
      </div>
    );
  }

  if (!preview) return null;

  // ── Already done ──
  if (preview.jaFezCheckin && !concluido) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <div
          className="rounded-2xl p-8 shadow-lg"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <Check size={48} style={{ color: "var(--success)" }} className="mx-auto mb-4" />
          <h2
            className="font-display text-xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Check-in já realizado!
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            {isCouple ? "Vocês já fizeram" : "Você já fez"} o check-in deste mês.
          </p>
          <Link
            href="/dashboard/checkin/historico"
            className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--brand-primary)", color: "#fff" }}
          >
            Ver histórico
          </Link>
        </div>
      </div>
    );
  }

  // ── Concluído ──
  if (concluido) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <div
          className="rounded-2xl p-8 shadow-lg"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <PartyPopper size={48} style={{ color: "var(--brand-accent)" }} className="mx-auto mb-4" />
          <h2
            className="font-display text-xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Check-in concluído!
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            {isCouple
              ? "Parabéns! Vocês dedicaram um tempo para revisar as finanças juntos."
              : "Parabéns! Você dedicou um tempo para revisar suas finanças."}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: "var(--brand-primary)", color: "#fff" }}
            >
              Voltar ao Dashboard
            </Link>
            <Link
              href="/dashboard/checkin/historico"
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                border: "1px solid var(--brand-primary)",
                color: "var(--brand-primary)",
              }}
            >
              Ver histórico
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Wizard ──
  const canGoNext = () => {
    if (step === totalSteps) {
      // Last step needs sentimentoA
      return sentimentoA > 0;
    }
    // Solo step 4 (metas + sentimento) also needs sentimentoA
    if (!isCouple && step === 4) return sentimentoA > 0;
    return true;
  };

  const isLastStep = step === totalSteps;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-10">
      <h1
        className="font-display text-2xl font-bold text-center mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {isCouple ? "Check-in Mensal" : "Revisão Mensal"}
      </h1>
      <p className="text-center text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        {new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        })}
      </p>

      <OnboardingStepper
        current={step}
        total={totalSteps}
        label={`${stepLabels[step - 1]} — Etapa ${step} de ${totalSteps}`}
      />

      <div
        className="rounded-2xl p-6 shadow-lg mb-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {step === 1 && <StepRevisao preview={preview} isCouple={isCouple} />}
        {step === 2 && <StepCelebracao preview={preview} isCouple={isCouple} />}
        {step === 3 && (
          <StepAjustes
            preview={preview}
            ajustes={ajustes}
            setAjustes={setAjustes}
            isCouple={isCouple}
          />
        )}
        {/* Couple: step 4 = Metas, step 5 = Sentimento */}
        {/* Solo: step 4 = Metas + Sentimento */}
        {isCouple && step === 4 && <StepMetas preview={preview} />}
        {isCouple && step === 5 && (
          <StepSentimento
            sentimentoA={sentimentoA}
            setSentimentoA={setSentimentoA}
            sentimentoB={sentimentoB}
            setSentimentoB={setSentimentoB}
          />
        )}
        {!isCouple && step === 4 && (
          <>
            <StepMetas preview={preview} />
            <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
              <SentimentPicker
                value={sentimentoA}
                onChange={setSentimentoA}
                label="Como você se sente sobre suas finanças este mês?"
              />
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
          style={{
            border: "1px solid var(--brand-primary)",
            color: "var(--brand-primary)",
          }}
        >
          <ChevronLeft size={16} /> Anterior
        </button>

        {isLastStep ? (
          <button
            onClick={handleSubmit}
            disabled={!canGoNext() || saving}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--brand-primary)", color: "#fff" }}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Finalizar
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
            disabled={!canGoNext()}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--brand-primary)", color: "#fff" }}
          >
            Próximo <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Revisão ────────────────────────────────────────────────────────

function StepRevisao({
  preview,
  isCouple,
}: {
  preview: CheckinPreview;
  isCouple: boolean;
}) {
  const pronome = isCouple ? "vocês ficaram" : "você ficou";
  const { totalCategorias, categoriasDentro } = preview;

  return (
    <div className="space-y-5">
      <h3
        className="font-display text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Revisão do Mês
      </h3>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Receitas", value: preview.receitas, color: "var(--success)" },
          { label: "Despesas", value: preview.despesas, color: "var(--danger)" },
          {
            label: "Saldo",
            value: preview.saldo,
            color: preview.saldo >= 0 ? "var(--success)" : "var(--danger)",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center"
            style={{ background: "var(--bg-secondary)" }}
          >
            <p className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>
              {label}
            </p>
            <p
              className="font-display text-sm font-bold italic"
              style={{ color }}
            >
              {fmt(value)}
            </p>
          </div>
        ))}
      </div>

      {/* Frase resumo */}
      {totalCategorias > 0 && (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Esse mês, {pronome}{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            dentro do orçamento em {categoriasDentro} de {totalCategorias}
          </strong>{" "}
          categorias.
        </p>
      )}

      {/* Categorias estouradas */}
      {preview.categoriasEstouradas.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--danger)" }}>
            Acima do orçamento
          </p>
          <div className="space-y-2">
            {preview.categoriasEstouradas.map((cat) => (
              <div
                key={cat.categoriaId}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  background: "var(--danger-light, rgba(239,68,68,0.08))",
                  border: "1px solid var(--danger-border, rgba(239,68,68,0.2))",
                }}
              >
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {cat.icone} {cat.nome}
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--danger)" }}>
                  +{fmt(cat.excesso)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorias abaixo do orçamento */}
      {preview.categoriasAbaixo.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--success)" }}>
            Abaixo do orçamento
          </p>
          <div className="space-y-2">
            {preview.categoriasAbaixo.slice(0, 3).map((cat) => (
              <div
                key={cat.categoriaId}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  background: "var(--success-light, rgba(34,197,94,0.08))",
                  border: "1px solid var(--success-border, rgba(34,197,94,0.2))",
                }}
              >
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {cat.icone} {cat.nome}
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--success)" }}>
                  {Math.round(cat.percentual)}% usado
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Celebração ─────────────────────────────────────────────────────

function StepCelebracao({
  preview,
  isCouple,
}: {
  preview: CheckinPreview;
  isCouple: boolean;
}) {
  const hasConquistas =
    preview.metasAvancaram.length > 0 ||
    preview.dividasPagas.length > 0 ||
    preview.valorEconomizado > 0;

  return (
    <div className="space-y-5">
      <h3
        className="font-display text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Celebração
      </h3>

      {!hasConquistas ? (
        <div
          className="rounded-xl p-5 text-center"
          style={{ background: "var(--bg-secondary)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Todo mês é uma chance de recomeçar.{" "}
            {isCouple ? "Vamos planejar o próximo juntos?" : "Vamos planejar o próximo?"}
          </p>
        </div>
      ) : (
        <>
          {preview.valorEconomizado > 0 && (
            <div
              className="rounded-xl p-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,193,7,0.08) 0%, rgba(255,152,0,0.06) 100%)",
                border: "1px solid rgba(255,193,7,0.2)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {isCouple ? "Vocês pouparam" : "Você poupou"}{" "}
                <span
                  className="font-display font-bold italic"
                  style={{ color: "var(--brand-accent)" }}
                >
                  {fmt(preview.valorEconomizado)}
                </span>{" "}
                este mês!
              </p>
            </div>
          )}

          {preview.metasAvancaram.map((meta) => (
            <div
              key={meta.id}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "var(--bg-secondary)" }}
            >
              <TrendingUp size={18} style={{ color: "var(--brand-primary)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {meta.nome}
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Avançou {fmt(meta.contribuicaoMes)} — {Math.round(meta.progresso)}% concluída
                </p>
              </div>
            </div>
          ))}

          {preview.dividasPagas.map((div) => (
            <div
              key={div.id}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "var(--bg-secondary)" }}
            >
              <Check size={18} style={{ color: "var(--success)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {div.nome}
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Pago: {fmt(div.valorPago)} — Restante: {fmt(div.valorRestante)}
                </p>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Step 3: Ajustes ────────────────────────────────────────────────────────

function StepAjustes({
  preview,
  ajustes,
  setAjustes,
  isCouple,
}: {
  preview: CheckinPreview;
  ajustes: Map<string, AjusteState>;
  setAjustes: React.Dispatch<React.SetStateAction<Map<string, AjusteState>>>;
  isCouple: boolean;
}) {
  const updateAjuste = (catId: string, update: Partial<AjusteState>) => {
    setAjustes((prev) => {
      const next = new Map(prev);
      const current = next.get(catId) ?? { opcao: "manter" as const, novoLimite: 0 };
      next.set(catId, { ...current, ...update });
      return next;
    });
  };

  if (preview.categoriasEstouradas.length === 0) {
    return (
      <div className="space-y-5">
        <h3
          className="font-display text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Ajustes
        </h3>
        <div
          className="rounded-xl p-5 text-center"
          style={{ background: "var(--bg-secondary)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Nenhuma categoria estourou o orçamento.{" "}
            {isCouple ? "Ótimo trabalho em equipe!" : "Ótimo trabalho!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h3
        className="font-display text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Ajustes
      </h3>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {isCouple
          ? "Algumas categorias ficaram acima do planejado. Querem ajustar?"
          : "Algumas categorias ficaram acima do planejado. Quer ajustar?"}
      </p>

      {preview.categoriasEstouradas.map((cat) => {
        const state = ajustes.get(cat.categoriaId) ?? {
          opcao: "manter" as AjusteOpcao,
          novoLimite: cat.limite,
        };

        return (
          <div
            key={cat.categoriaId}
            className="rounded-xl p-4 space-y-3"
            style={{
              background: "var(--danger-light, rgba(239,68,68,0.05))",
              border: "1px solid var(--danger-border, rgba(239,68,68,0.15))",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {cat.icone} {cat.nome}
              </span>
              <span className="text-xs" style={{ color: "var(--danger)" }}>
                {fmt(cat.gasto)} / {fmt(cat.limite)}
              </span>
            </div>

            <div className="space-y-2">
              {(
                [
                  { key: "aumentar", label: "Aumentar o limite" },
                  { key: "manter", label: "Reduzir gastos no próximo mês" },
                  { key: "atipico", label: "Manter — foi um mês atípico" },
                ] as const
              ).map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`ajuste-${cat.categoriaId}`}
                    checked={state.opcao === key}
                    onChange={() => updateAjuste(cat.categoriaId, { opcao: key })}
                    className="accent-[var(--brand-primary)]"
                  />
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {label}
                  </span>
                </label>
              ))}

              {state.opcao === "aumentar" && (
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Novo limite:
                  </span>
                  <div className="w-32">
                    <CurrencyInput
                      value={state.novoLimite}
                      onChange={(v) =>
                        updateAjuste(cat.categoriaId, {
                          novoLimite: v,
                        })
                      }
                      className="h-8 w-full rounded-lg border border-border bg-bg-primary py-1 pl-8 pr-2 text-sm font-medium text-text-primary outline-none transition focus:border-border-focus"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 4: Metas ──────────────────────────────────────────────────────────

function StepMetas({ preview }: { preview: CheckinPreview }) {
  if (preview.metasAtivas.length === 0) {
    return (
      <div className="space-y-5">
        <h3
          className="font-display text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Metas
        </h3>
        <div
          className="rounded-xl p-5 text-center"
          style={{ background: "var(--bg-secondary)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Nenhuma meta ativa no momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h3
        className="font-display text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Metas
      </h3>

      {preview.metasAtivas.map((meta) => (
        <div
          key={meta.id}
          className="rounded-xl p-4 space-y-2"
          style={{ background: "var(--bg-secondary)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {meta.nome}
            </span>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {Math.round(meta.progresso)}%
            </span>
          </div>
          <ProgressBar progresso={meta.progresso} />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {fmt(meta.valorAtual)} / {fmt(meta.valorAlvo)}
            </span>
            {meta.projecaoConclusao && (
              <span className="text-xs" style={{ color: "var(--brand-primary)" }}>
                Projeção:{" "}
                {new Date(meta.projecaoConclusao).toLocaleDateString("pt-BR", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Step 5: Sentimento (Couple only) ───────────────────────────────────────

function StepSentimento({
  sentimentoA,
  setSentimentoA,
  sentimentoB,
  setSentimentoB,
}: {
  sentimentoA: number;
  setSentimentoA: (v: number) => void;
  sentimentoB: number;
  setSentimentoB: (v: number) => void;
}) {
  const diff = sentimentoA > 0 && sentimentoB > 0
    ? Math.abs(sentimentoA - sentimentoB)
    : 0;

  return (
    <div className="space-y-6">
      <h3
        className="font-display text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Sentimento
      </h3>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Cada um responde: como vocês se sentem sobre as finanças do casal este mês?
      </p>

      <SentimentPicker
        value={sentimentoA}
        onChange={setSentimentoA}
        label="Parceiro A"
      />

      <div style={{ borderTop: "1px solid var(--border)" }} className="pt-4">
        <SentimentPicker
          value={sentimentoB}
          onChange={setSentimentoB}
          label="Parceiro B (opcional)"
        />
      </div>

      {diff >= 2 && (
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--warning-light, rgba(251,191,36,0.1))",
            border: "1px solid var(--warning, rgba(251,191,36,0.3))",
          }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} style={{ color: "var(--warning, #f59e0b)" }} className="mt-0.5 shrink-0" />
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              Parece que vocês estão em momentos diferentes. Que tal conversar com
              carinho sobre o que está preocupando? Entender o ponto de vista do
              outro fortalece a parceria.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
