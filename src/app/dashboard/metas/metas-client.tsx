"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, X, Target, Loader2, Check, AlertTriangle, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import confetti from "canvas-confetti";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useToast } from "@/components/ui/toast";
import {
  listGoals,
  createGoal,
  contributeToGoal,
  calcProjecaoSimulada,
  formatMesAno,
  GOAL_EMOJI,
  GOAL_TIPO_LABEL,
  type GoalItem,
  type GoalTipo,
  type CoupleCtx,
} from "@/lib/clients/goals-client";

// ─── Formatação ───────────────────────────────────────────────────────────────

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
}

// ─── Simulador de projeção ────────────────────────────────────────────────────

function calcProjecaoTexto(
  valorAtual: number,
  valorAlvo: number,
  contribuicaoMensal: number,
): string {
  const resultado = calcProjecaoSimulada(valorAtual, valorAlvo, contribuicaoMensal);
  if (!resultado) return "Defina uma contribuição mensal";
  if (resultado.meses === 0) return "Meta já atingida!";
  return `Vocês atingem em ${resultado.meses} ${resultado.meses === 1 ? "mês" : "meses"} (${formatMesAno(resultado.data)})`;
}

// ─── Barra de progresso com gradiente ─────────────────────────────────────────

function GoalProgressBar({ progresso }: { progresso: number }) {
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

// ─── Mini barras de contribuição por parceiro ─────────────────────────────────

function PartnerBars({
  totalA,
  totalB,
  nomeA,
  nomeB,
}: {
  totalA: number;
  totalB: number;
  nomeA: string;
  nomeB: string | null;
}) {
  const total = totalA + totalB;
  const pctA = total > 0 ? (totalA / total) * 100 : 50;
  const pctB = total > 0 ? (totalB / total) * 100 : 50;

  return (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] w-16 truncate" style={{ color: "var(--partner-a)" }}>
          {nomeA}
        </span>
        <div
          className="flex-1 rounded-full overflow-hidden"
          style={{ height: 5, background: "var(--bg-tertiary)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pctA}%`, background: "var(--partner-a)" }}
          />
        </div>
        <span className="text-[10px] font-medium w-16 text-right" style={{ color: "var(--text-tertiary)" }}>
          {fmt(totalA)}
        </span>
      </div>
      {nomeB && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-16 truncate" style={{ color: "var(--partner-b)" }}>
            {nomeB}
          </span>
          <div
            className="flex-1 rounded-full overflow-hidden"
            style={{ height: 5, background: "var(--bg-tertiary)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pctB}%`, background: "var(--partner-b)" }}
            />
          </div>
          <span className="text-[10px] font-medium w-16 text-right" style={{ color: "var(--text-tertiary)" }}>
            {fmt(totalB)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Simulador de cenários (expansível) ──────────────────────────────────────

function SimuladorCenarios({ meta }: { meta: GoalItem }) {
  const baseContrib = (meta.contribuicaoA ?? 0) + (meta.contribuicaoB ?? 0);
  const [sliderVal, setSliderVal] = useState(baseContrib || 100);

  const projecaoBase = calcProjecaoSimulada(meta.valorAtual, meta.valorAlvo, baseContrib);
  const projecaoSim = calcProjecaoSimulada(meta.valorAtual, meta.valorAlvo, sliderVal);

  const diff =
    projecaoBase && projecaoSim
      ? projecaoBase.meses - projecaoSim.meses
      : null;

  const maxSlider = Math.max(sliderVal * 3, (meta.valorAlvo - meta.valorAtual) / 3, 500);

  return (
    <div
      className="mt-3 p-3 rounded-xl"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
    >
      <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
        Simulador de cenários
      </p>

      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Contribuição mensal total
        </span>
        <span
          className="text-sm font-bold italic"
          style={{ fontFamily: "var(--font-display)", color: "var(--brand-primary)" }}
        >
          {fmt(sliderVal)}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={Math.ceil(maxSlider)}
        step={50}
        value={sliderVal}
        onChange={(e) => setSliderVal(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--brand-primary) ${(sliderVal / maxSlider) * 100}%, var(--bg-tertiary) ${(sliderVal / maxSlider) * 100}%)`,
          accentColor: "var(--brand-primary)",
        }}
      />

      <div className="mt-2 space-y-1">
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {projecaoSim
            ? `No ritmo simulado, vocês atingem em ${projecaoSim.meses} ${projecaoSim.meses === 1 ? "mês" : "meses"} (${formatMesAno(projecaoSim.data)})`
            : "Aumente a contribuição para ver a projeção"}
        </p>
        {diff !== null && Math.abs(diff) >= 1 && (
          <p
            className="text-xs font-medium"
            style={{ color: diff > 0 ? "var(--success)" : "var(--warning)" }}
          >
            {diff > 0
              ? `✓ ${diff} ${diff === 1 ? "mês" : "meses"} antes do ritmo atual`
              : `⚠ ${Math.abs(diff)} ${Math.abs(diff) === 1 ? "mês" : "meses"} a mais que o ritmo atual`}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Card de meta ─────────────────────────────────────────────────────────────

function MetaCard({
  meta,
  couple,
  userId,
  onContribuir,
}: {
  meta: GoalItem;
  couple: CoupleCtx | null;
  userId: string;
  onContribuir: (meta: GoalItem) => void;
}) {
  const [expandido, setExpandido] = useState(false);

  const nomeA = couple?.userANome ?? "Você";
  const nomeB = couple?.userBNome ?? null;

  const ehAtingida = meta.status === "ATINGIDA";
  const ehPausada = meta.status === "PAUSADA";
  const ehVencida = meta.prazoVencido;

  const isUserA = couple ? userId === couple.userAId : true;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: ehAtingida
          ? "linear-gradient(135deg, color-mix(in srgb, var(--success) 8%, var(--bg-card)), var(--bg-card))"
          : "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 5%, var(--bg-card)), color-mix(in srgb, var(--brand-secondary) 5%, var(--bg-card)))",
        border: ehVencida
          ? "1.5px solid var(--danger)"
          : ehAtingida
          ? "1.5px solid var(--success)"
          : "1px solid var(--border)",
        borderRadius: 16,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
            style={{ background: "var(--brand-primary-light)" }}
          >
            {GOAL_EMOJI[meta.tipo]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {meta.nome}
              </h3>
              {ehAtingida && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "var(--success-light)", color: "var(--success)" }}
                >
                  ✓ Conquistada
                </span>
              )}
              {ehPausada && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
                >
                  Pausada
                </span>
              )}
              {ehVencida && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                  style={{ background: "var(--warning-light)", color: "var(--warning)" }}
                >
                  <AlertTriangle size={9} /> Prazo vencido
                </span>
              )}
            </div>
            {meta.prazo && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                Prazo: {fmtDate(meta.prazo)}
              </p>
            )}
          </div>
        </div>

        {/* Alerta prazo vencido */}
        {ehVencida && (
          <div
            className="rounded-xl px-3 py-2 mb-3 flex items-start gap-2"
            style={{ background: "var(--danger-light)", border: "1px solid var(--danger)" }}
          >
            <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: "var(--danger)" }} />
            <p className="text-xs" style={{ color: "var(--danger)" }}>
              O prazo desta meta venceu sem ser atingida. Que tal revisar o valor ou o prazo?
            </p>
          </div>
        )}

        {/* Valores */}
        <div className="flex items-end justify-between mb-2">
          <div>
            <span
              className="text-xl font-bold italic"
              style={{ fontFamily: "var(--font-display)", color: "var(--brand-primary)" }}
            >
              {fmt(meta.valorAtual)}
            </span>
            <span className="text-xs ml-1" style={{ color: "var(--text-tertiary)" }}>
              / {fmt(meta.valorAlvo)}
            </span>
          </div>
          <span className="text-sm font-bold" style={{ color: meta.progresso >= 100 ? "var(--success)" : "var(--text-secondary)" }}>
            {Math.round(meta.progresso)}%
          </span>
        </div>

        {/* Barra de progresso */}
        <GoalProgressBar progresso={meta.progresso} />

        {/* Contribuições por parceiro */}
        {(meta.totalContribuicaoA > 0 || meta.totalContribuicaoB > 0) && (
          <PartnerBars
            totalA={isUserA ? meta.totalContribuicaoA : meta.totalContribuicaoB}
            totalB={isUserA ? meta.totalContribuicaoB : meta.totalContribuicaoA}
            nomeA={isUserA ? nomeA : (nomeB ?? nomeA)}
            nomeB={isUserA ? nomeB : nomeA}
          />
        )}

        {/* Projeção */}
        {!ehAtingida && (
          <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
            <TrendingUp size={11} className="inline mr-1" />
            {meta.projecaoConclusao
              ? `No ritmo atual, vocês atingem em ${fmtDate(meta.projecaoConclusao)}`
              : meta.valorMensalNecessario
              ? `Precisam de ${fmt(meta.valorMensalNecessario)}/mês para bater o prazo`
              : "Defina uma contribuição mensal"}
          </p>
        )}

        {/* Rodapé */}
        <div className="flex items-center justify-between mt-3 gap-2">
          {!ehAtingida ? (
            <button
              onClick={() => onContribuir(meta)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: "var(--brand-primary)", color: "white" }}
            >
              Contribuir
            </button>
          ) : (
            <div
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-center"
              style={{ background: "var(--success-light)", color: "var(--success)" }}
            >
              🎉 Meta conquistada!
            </div>
          )}
          <button
            onClick={() => setExpandido((p) => !p)}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-opacity hover:opacity-70"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
          >
            {expandido ? (
              <ChevronUp size={14} style={{ color: "var(--text-secondary)" }} />
            ) : (
              <ChevronDown size={14} style={{ color: "var(--text-secondary)" }} />
            )}
          </button>
        </div>
      </div>

      {/* Simulador expansível */}
      {expandido && (
        <div
          className="px-4 pb-4"
          style={{ borderTop: "1px solid var(--divider)" }}
        >
          <SimuladorCenarios meta={meta} />
        </div>
      )}
    </div>
  );
}

// ─── Modal: Contribuir ────────────────────────────────────────────────────────

function ContribuirModal({
  meta,
  onClose,
  onSuccess,
}: {
  meta: GoalItem;
  onClose: () => void;
  onSuccess: (celebrar: boolean, metaAtualizada: GoalItem) => void;
}) {
  const [valor, setValor] = useState(0);
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();

  const handleSubmit = async () => {
    if (valor <= 0) {
      pushToast({ title: "Informe um valor válido", type: "error" });
      return;
    }
    setSaving(true);
    const res = await contributeToGoal(meta.id, { valor });
    setSaving(false);
    if (res.ok) {
      const novoValorAtual = res.data.goal.valorAtual;
      const metaAtualizada: GoalItem = {
        ...meta,
        valorAtual: novoValorAtual,
        status: res.data.goal.status,
        progresso: res.data.goal.progresso,
        valorFaltante: Math.max(meta.valorAlvo - novoValorAtual, 0),
      };
      onSuccess(res.data.celebrar, metaAtualizada);
    } else {
      pushToast({ title: res.error, type: "error" });
    }
  };

  const faltante = meta.valorFaltante;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full md:max-w-sm rounded-t-3xl md:rounded-2xl p-5"
        style={{ background: "var(--bg-card)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{GOAL_EMOJI[meta.tipo]}</span>
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                Contribuir
              </h2>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{meta.nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--text-tertiary)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="mb-3 p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Faltam para atingir</p>
          <p
            className="text-lg font-bold italic mt-0.5"
            style={{ fontFamily: "var(--font-display)", color: "var(--brand-primary)" }}
          >
            {fmt(faltante)}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Valor da contribuição
          </label>
          <CurrencyInput value={valor} onChange={setValor} />
          {/* Sugestão rápida */}
          {(meta.contribuicaoA ?? 0) + (meta.contribuicaoB ?? 0) > 0 && (
            <button
              onClick={() => setValor((meta.contribuicaoA ?? 0) + (meta.contribuicaoB ?? 0))}
              className="mt-2 text-xs px-2 py-1 rounded-lg"
              style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}
            >
              Usar contribuição planejada ({fmt((meta.contribuicaoA ?? 0) + (meta.contribuicaoB ?? 0))})
            </button>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 active:scale-95"
          style={{ background: "var(--brand-primary)", color: "white" }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Registrar contribuição
        </button>
      </div>
    </div>
  );
}

// ─── Modal: Nova Meta ─────────────────────────────────────────────────────────

const TIPOS: GoalTipo[] = [
  "EMERGENCIA", "VIAGEM", "IMOVEL", "CARRO", "CASAMENTO",
  "FILHOS", "APOSENTADORIA", "EDUCACAO", "OUTRO",
];

function NovaMetaModal({
  couple,
  onClose,
  onSuccess,
}: {
  couple: CoupleCtx | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<GoalTipo>("OUTRO");
  const [valorAlvo, setValorAlvo] = useState(0);
  const [prazo, setPrazo] = useState("");
  const [contribuicaoA, setContribuicaoA] = useState(0);
  const [contribuicaoB, setContribuicaoB] = useState(0);
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();

  const contrib = contribuicaoA + contribuicaoB;
  const alvo = valorAlvo;
  const projecaoTexto = alvo > 0 ? calcProjecaoTexto(0, alvo, contrib) : null;

  const nomeA = couple?.userANome ?? "Você";
  const nomeB = couple?.userBNome;

  const handleSubmit = async () => {
    if (!nome.trim()) {
      pushToast({ title: "Informe o nome da meta", type: "error" });
      return;
    }
    if (!alvo || alvo <= 0) {
      pushToast({ title: "Informe um valor alvo válido", type: "error" });
      return;
    }
    setSaving(true);
    const res = await createGoal({
      nome: nome.trim(),
      valor_alvo: alvo,
      prazo: prazo || null,
      tipo,
      contribuicao_a: contribuicaoA || null,
      contribuicao_b: contribuicaoB || null,
    });
    setSaving(false);
    if (res.ok) {
      pushToast({ title: "Meta criada com sucesso!", type: "success" });
      onSuccess();
    } else {
      pushToast({ title: res.error, type: "error" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full md:max-w-lg rounded-t-3xl md:rounded-2xl flex flex-col max-h-[92vh]"
        style={{ background: "var(--bg-card)" }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Nova Meta
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Defina um objetivo financeiro do casal
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--text-tertiary)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 pb-2 space-y-4">

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Nome da meta
            </label>
            <input
              type="text"
              placeholder="ex: Viagem para Portugal"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--border-focus)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Tipo
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {TIPOS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className="flex items-center gap-1.5 px-2 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: tipo === t ? "var(--brand-primary-light)" : "var(--bg-secondary)",
                    border: tipo === t ? "1.5px solid var(--brand-primary-muted)" : "1px solid var(--border)",
                    color: tipo === t ? "var(--brand-primary)" : "var(--text-secondary)",
                  }}
                >
                  <span>{GOAL_EMOJI[t]}</span>
                  <span className="truncate">{GOAL_TIPO_LABEL[t]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Valor alvo + prazo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Valor alvo
              </label>
              <CurrencyInput value={valorAlvo} onChange={setValorAlvo} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Prazo (opcional)
              </label>
              <input
                type="date"
                value={prazo}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setPrazo(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* Contribuições mensais */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Contribuição mensal planejada
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] mb-1 font-medium" style={{ color: "var(--partner-a)" }}>
                  {nomeA}
                </p>
                <CurrencyInput value={contribuicaoA} onChange={setContribuicaoA} />
              </div>
              {nomeB && (
                <div>
                  <p className="text-[10px] mb-1 font-medium" style={{ color: "var(--partner-b)" }}>
                    {nomeB}
                  </p>
                  <CurrencyInput value={contribuicaoB} onChange={setContribuicaoB} />
                </div>
              )}
            </div>
          </div>

          {/* Simulador ao vivo */}
          {alvo > 0 && (
            <div
              className="rounded-xl p-3"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 8%, transparent), color-mix(in srgb, var(--brand-accent) 8%, transparent))",
                border: "1px solid color-mix(in srgb, var(--brand-primary-muted) 60%, transparent)",
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--brand-primary)" }}>
                Simulador ao vivo
              </p>
              <p
                className="text-sm font-medium italic"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                {projecaoTexto}
              </p>
              {contrib > 0 && alvo > 0 && (
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  Total mensal: {fmt(contrib)} · Falta: {fmt(alvo)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-5 py-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 active:scale-95"
            style={{ background: "var(--brand-primary)", color: "white" }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Criar meta
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Celebração ────────────────────────────────────────────────────────

function CelebracaoModal({
  meta,
  onClose,
}: {
  meta: GoalItem;
  onClose: () => void;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const fire = (angle: number, origin: { x: number; y: number }) => {
      confetti({
        particleCount: 60,
        angle,
        spread: 65,
        origin,
        colors: ["#1b6b5a", "#d4a853", "#c4956a", "#ffffff", "#e6f4f0"],
      });
    };

    setTimeout(() => {
      fire(60, { x: 0, y: 0.6 });
      fire(120, { x: 1, y: 0.6 });
    }, 100);
    setTimeout(() => {
      fire(70, { x: 0.1, y: 0.5 });
      fire(110, { x: 0.9, y: 0.5 });
    }, 450);
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { x: 0.5, y: 0.4 },
        colors: ["#1b6b5a", "#d4a853", "#c4956a", "#ffffff"],
      });
    }, 800);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-3xl p-6 text-center"
        style={{
          background: `linear-gradient(135deg,
            color-mix(in srgb, var(--brand-accent) 15%, var(--bg-card)),
            color-mix(in srgb, var(--brand-primary) 15%, var(--bg-card)))`,
          border: "1.5px solid color-mix(in srgb, var(--brand-accent) 30%, transparent)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div className="text-6xl mb-3">🎉</div>
        <h2
          className="text-2xl font-bold italic mb-2"
          style={{ fontFamily: "var(--font-display)", color: "var(--brand-accent)" }}
        >
          Vocês conseguiram!
        </h2>
        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
          Vocês conquistaram{" "}
          <span style={{ color: "var(--brand-primary)" }}>{meta.nome}</span>!
        </p>
        <p className="text-xs mb-5" style={{ color: "var(--text-secondary)" }}>
          O trabalho em equipe valeu a pena. Esse é o poder de conquistar junto! 💪
        </p>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5 text-xs font-semibold"
          style={{ background: "var(--success-light)", color: "var(--success)" }}
        >
          <Check size={12} /> {fmt(meta.valorAlvo)} alcançados
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: "var(--brand-primary)", color: "white" }}
        >
          Continuar conquistando
        </button>
      </div>
    </div>
  );
}

// ─── Estado vazio ─────────────────────────────────────────────────────────────

function EmptyState({ onNovaMeta }: { onNovaMeta: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
        style={{ background: "var(--brand-primary-light)" }}
      >
        🎯
      </div>
      <div>
        <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Nenhuma meta ainda
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Definam juntos o que querem conquistar!
        </p>
      </div>
      <button
        onClick={onNovaMeta}
        className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{ background: "var(--brand-primary)", color: "white" }}
      >
        <Plus size={16} /> Criar primeira meta
      </button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function MetasClient() {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [couple, setCouple] = useState<CoupleCtx | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [showNovaMeta, setShowNovaMeta] = useState(false);
  const [contribuirMeta, setContribuirMeta] = useState<GoalItem | null>(null);
  const [celebracaoMeta, setCelebracaoMeta] = useState<GoalItem | null>(null);

  const { pushToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listGoals();
    if (res.ok) {
      setGoals(res.data.goals);
      setCouple(res.data.couple);
      setUserId(res.data.userId);
    } else {
      pushToast({ title: res.error, type: "error" });
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const handleContribuirSuccess = (celebrar: boolean, metaAtualizada: GoalItem) => {
    setContribuirMeta(null);
    setGoals((prev) =>
      prev.map((g) => (g.id === metaAtualizada.id ? metaAtualizada : g)),
    );
    if (celebrar) {
      setCelebracaoMeta(metaAtualizada);
    } else {
      pushToast({ title: "Contribuição registrada!", type: "success" });
    }
  };

  // Separar por status
  const ativas = goals.filter((g) => g.status === "ATIVA");
  const atingidas = goals.filter((g) => g.status === "ATINGIDA");
  const pausadas = goals.filter((g) => g.status === "PAUSADA");

  const totalMetas = goals.length;
  const totalInvestido = goals.reduce((acc, g) => acc + g.valorAtual, 0);
  const totalAlvo = goals.reduce((acc, g) => acc + g.valorAlvo, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-10">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1
            className="text-2xl font-bold italic"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Metas
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {couple ? "Sonhos do casal" : "Seus objetivos financeiros"}
          </p>
        </div>
        <button
          onClick={() => setShowNovaMeta(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: "var(--brand-primary)", color: "white" }}
        >
          <Plus size={16} />
          Nova meta
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Carregando metas…
          </p>
        </div>
      ) : goals.length === 0 ? (
        <EmptyState onNovaMeta={() => setShowNovaMeta(true)} />
      ) : (
        <>
          {/* ── Resumo ─────────────────────────────────────────────── */}
          {totalMetas > 0 && (
            <div
              className="rounded-2xl p-4 mb-5 grid grid-cols-3 gap-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="text-center">
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Metas</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                  {totalMetas}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Investido</p>
                <p
                  className="text-sm font-bold italic mt-0.5"
                  style={{ fontFamily: "var(--font-display)", color: "var(--brand-primary)" }}
                >
                  {fmt(totalInvestido)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Total alvo</p>
                <p
                  className="text-sm font-bold italic mt-0.5"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-secondary)" }}
                >
                  {fmt(totalAlvo)}
                </p>
              </div>
            </div>
          )}

          {/* ── Metas ativas ─────────────────────────────────────────── */}
          {ativas.length > 0 && (
            <section className="mb-6">
              {(atingidas.length > 0 || pausadas.length > 0) && (
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
                  Em andamento
                </h2>
              )}
              <div className="space-y-3">
                {ativas.map((meta) => (
                  <MetaCard
                    key={meta.id}
                    meta={meta}
                    couple={couple}
                    userId={userId}
                    onContribuir={setContribuirMeta}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Metas conquistadas ───────────────────────────────────── */}
          {atingidas.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "var(--success)" }}>
                <Target size={12} /> Conquistadas
              </h2>
              <div className="space-y-3">
                {atingidas.map((meta) => (
                  <MetaCard
                    key={meta.id}
                    meta={meta}
                    couple={couple}
                    userId={userId}
                    onContribuir={setContribuirMeta}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Metas pausadas ───────────────────────────────────────── */}
          {pausadas.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
                Pausadas
              </h2>
              <div className="space-y-3">
                {pausadas.map((meta) => (
                  <MetaCard
                    key={meta.id}
                    meta={meta}
                    couple={couple}
                    userId={userId}
                    onContribuir={setContribuirMeta}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Modais ─────────────────────────────────────────────────── */}
      {showNovaMeta && (
        <NovaMetaModal
          couple={couple}
          onClose={() => setShowNovaMeta(false)}
          onSuccess={() => {
            setShowNovaMeta(false);
            load();
          }}
        />
      )}

      {contribuirMeta && (
        <ContribuirModal
          meta={contribuirMeta}
          onClose={() => setContribuirMeta(null)}
          onSuccess={handleContribuirSuccess}
        />
      )}

      {celebracaoMeta && (
        <CelebracaoModal
          meta={celebracaoMeta}
          onClose={() => setCelebracaoMeta(null)}
        />
      )}
    </div>
  );
}
