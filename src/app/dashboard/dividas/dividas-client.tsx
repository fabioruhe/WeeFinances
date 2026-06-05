"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, X, Loader2, Check, AlertTriangle, TrendingDown,
  ChevronDown, ChevronUp, Trash2, Bell, History,
} from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useToast } from "@/components/ui/toast";
import {
  listDebts,
  createDebt,
  deleteDebt,
  payDebt,
  getStrategy,
  taxaJurosCor,
  taxaJurosCardGradient,
  type DebtItem,
  type DebtResumo,
  type StrategyResult,
  type CreateDebtInput,
} from "@/lib/clients/debts-client";

// ─── Formatação ───────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtPct(v: number) {
  return v.toFixed(1) + "%";
}

// ─── Resumo geral ─────────────────────────────────────────────────────────────

function ResumoCard({ resumo }: { resumo: DebtResumo }) {
  const { totalDividas, totalParcelas, rendaMensal, comprometimento, alertaComprometimento } = resumo;

  return (
    <div
      className="rounded-2xl p-4 mb-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Total devedor</p>
          <p
            className="text-lg font-bold italic mt-0.5"
            style={{ fontFamily: "var(--font-display)", color: "var(--danger)" }}
          >
            {fmt(totalDividas)}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Parcelas/mês</p>
          <p
            className="text-base font-bold italic mt-0.5"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {fmt(totalParcelas)}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Comprometimento</p>
          <p
            className="text-base font-bold mt-0.5"
            style={{ color: alertaComprometimento ? "var(--danger)" : "var(--success)" }}
          >
            {fmtPct(comprometimento)}
          </p>
        </div>
      </div>

      {/* Barra de comprometimento de renda */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            Comprometimento da renda mensal {rendaMensal > 0 ? `(${fmt(rendaMensal)})` : ""}
          </span>
          <span
            className="text-[10px] font-semibold"
            style={{ color: alertaComprometimento ? "var(--danger)" : "var(--success)" }}
          >
            limite saudável: 30%
          </span>
        </div>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 8, background: "var(--bg-tertiary)" }}
        >
          {/* Zona saudável (0-30%) */}
          <div className="relative h-full">
            <div
              className="absolute left-0 h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(comprometimento, 100)}%`,
                background: alertaComprometimento
                  ? "var(--danger)"
                  : "linear-gradient(90deg, var(--success), var(--warning))",
              }}
            />
            {/* Marcador 30% */}
            <div
              className="absolute top-0 h-full w-0.5"
              style={{ left: "30%", background: "var(--text-tertiary)", opacity: 0.5 }}
            />
          </div>
        </div>
      </div>

      {alertaComprometimento && (
        <div
          className="flex items-start gap-2 px-3 py-2 rounded-xl mt-2"
          style={{ background: "var(--danger-light)", border: "1px solid var(--danger)" }}
        >
          <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: "var(--danger)" }} />
          <p className="text-xs" style={{ color: "var(--danger)" }}>
            Mais de 30% da renda comprometida com dívidas. Considere renegociar ou priorizar a quitação.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Alertas de vencimento ────────────────────────────────────────────────────

function AlertasVencimento({ debts }: { debts: DebtItem[] }) {
  const comAlerta = debts.filter((d) => d.alertaVencimento !== null);
  if (comAlerta.length === 0) return null;

  const cores: Record<string, { bg: string; text: string; border: string }> = {
    HOJE: { bg: "var(--danger-light)", text: "var(--danger)", border: "var(--danger)" },
    AMANHA: { bg: "var(--warning-light)", text: "var(--warning)", border: "var(--warning)" },
    EM_BREVE: { bg: "var(--info-light)", text: "var(--info)", border: "var(--info)" },
  };

  const labels: Record<string, string> = {
    HOJE: "Vence hoje",
    AMANHA: "Vence amanhã",
    EM_BREVE: "Vence em breve",
  };

  return (
    <div className="mb-5 space-y-2">
      {comAlerta.map((d) => {
        const alerta = d.alertaVencimento!;
        const c = cores[alerta];
        return (
          <div
            key={d.id}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: c.bg, border: `1px solid ${c.border}` }}
          >
            <Bell size={15} className="shrink-0" style={{ color: c.text }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: c.text }}>
                {labels[alerta]}: {d.nome}
              </p>
              <p className="text-xs mt-0.5" style={{ color: c.text, opacity: 0.8 }}>
                Parcela: {fmt(d.parcelaMensal)}
              </p>
            </div>
            <span
              className="text-xs font-bold shrink-0"
              style={{ color: c.text }}
            >
              Dia {d.vencimentoDia}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Card de dívida ───────────────────────────────────────────────────────────

function DebtCard({
  debt,
  onPagar,
  onDeletar,
}: {
  debt: DebtItem;
  onPagar: (debt: DebtItem) => void;
  onDeletar: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const corJuros = taxaJurosCor(debt.taxaJuros);
  const gradientBg = taxaJurosCardGradient(debt.taxaJuros);

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background: gradientBg,
        border: `1px solid ${debt.taxaJuros > 3 ? "color-mix(in srgb, var(--danger) 25%, var(--border))" : "var(--border)"}`,
        borderRadius: 16,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in srgb, ${corJuros} 15%, var(--bg-card))` }}
        >
          <TrendingDown size={16} style={{ color: corJuros }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {debt.nome}
            </h3>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: debt.escopo === "COMPARTILHADA"
                  ? "color-mix(in srgb, var(--partner-shared) 15%, transparent)"
                  : "var(--bg-tertiary)",
                color: debt.escopo === "COMPARTILHADA" ? "var(--partner-shared)" : "var(--text-tertiary)",
              }}
            >
              {debt.escopo === "COMPARTILHADA" ? "Compartilhada" : "Individual"}
            </span>
            {debt.taxaJuros > 0 && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: `color-mix(in srgb, ${corJuros} 15%, transparent)`, color: corJuros }}
              >
                {debt.taxaJuros.toFixed(1)}% a.m.
              </span>
            )}
          </div>
          {debt.vencimentoDia && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Vencimento: dia {debt.vencimentoDia}
            </p>
          )}
        </div>
      </div>

      {/* Valores */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>Saldo devedor</p>
          <span
            className="text-xl font-bold italic"
            style={{ fontFamily: "var(--font-display)", color: corJuros }}
          >
            {fmt(debt.valorRestante)}
          </span>
          <span className="text-xs ml-1" style={{ color: "var(--text-tertiary)" }}>
            / {fmt(debt.valorTotal)}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Parcela/mês</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
            {fmt(debt.parcelaMensal)}
          </p>
        </div>
      </div>

      {/* Barra de progresso (pago / total) */}
      <div className="mb-2">
        {debt.parcelasTotal ? (
          <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--text-tertiary)" }}>
            <span>{debt.parcelasPagas} de {debt.parcelasTotal} parcelas</span>
            <span>{Math.round(debt.progresso)}% pago</span>
          </div>
        ) : (
          <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--text-tertiary)" }}>
            <span>Progresso</span>
            <span>{Math.round(debt.progresso)}% pago</span>
          </div>
        )}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 6, background: "var(--bg-tertiary)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(debt.progresso, 100)}%`,
              background: `linear-gradient(90deg, ${corJuros}, color-mix(in srgb, ${corJuros} 60%, var(--brand-accent)))`,
            }}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onPagar(debt)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{ background: "var(--brand-primary)", color: "white" }}
        >
          Registrar pagamento
        </button>
        {confirmDelete ? (
          <div className="flex gap-1">
            <button
              onClick={() => onDeletar(debt.id)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: "var(--danger)", color: "white" }}
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--bg-secondary)" }}
            >
              <X size={14} style={{ color: "var(--text-tertiary)" }} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-opacity hover:opacity-70"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
          >
            <Trash2 size={14} style={{ color: "var(--text-tertiary)" }} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Modal: Registrar pagamento ───────────────────────────────────────────────

function PagarModal({
  debt,
  onClose,
  onSuccess,
}: {
  debt: DebtItem;
  onClose: () => void;
  onSuccess: (quitada: boolean, updated: DebtItem) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [valor, setValor] = useState(debt.parcelaMensal);
  const [data, setData] = useState(today);
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();

  const handleSubmit = async () => {
    if (valor <= 0) {
      pushToast({ title: "Informe um valor válido", type: "error" });
      return;
    }
    setSaving(true);
    const res = await payDebt(debt.id, valor, data);
    setSaving(false);
    if (res.ok) {
      const { debt: d, quitada } = res.data;
      const updated: DebtItem = {
        ...debt,
        valorRestante: d.valorRestante,
        parcelasPagas: d.parcelasPagas,
        status: d.status,
        progresso: d.progresso,
      };
      onSuccess(quitada, updated);
    } else {
      pushToast({ title: res.error, type: "error" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full md:max-w-sm rounded-t-3xl md:rounded-2xl p-5"
        style={{ background: "var(--bg-card)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Registrar pagamento
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              {debt.nome} · Restam {fmt(debt.valorRestante)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--text-tertiary)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Valor pago
            </label>
            <CurrencyInput value={valor} onChange={setValor} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Data do pagamento
            </label>
            <input
              type="date"
              value={data}
              max={today}
              onChange={(e) => setData(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-all"
          style={{ background: "var(--brand-primary)", color: "white" }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Confirmar pagamento
        </button>
      </div>
    </div>
  );
}

// ─── Modal: Nova Dívida ───────────────────────────────────────────────────────

function NovaDividaModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<CreateDebtInput>({
    nome: "",
    valor_total: 0,
    valor_restante: 0,
    parcelas_total: null,
    parcelas_pagas: 0,
    taxa_juros_mensal: null,
    dia_vencimento: null,
    escopo: "INDIVIDUAL",
  });
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();

  const set = <K extends keyof CreateDebtInput>(key: K, value: CreateDebtInput[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async () => {
    if (!form.nome.trim()) {
      pushToast({ title: "Informe o nome da dívida", type: "error" });
      return;
    }
    if (!form.valor_total || form.valor_total <= 0) {
      pushToast({ title: "Informe o valor total", type: "error" });
      return;
    }
    const valorRestante = form.valor_restante || form.valor_total;
    setSaving(true);
    const res = await createDebt({ ...form, valor_restante: valorRestante });
    setSaving(false);
    if (res.ok) {
      pushToast({ title: "Dívida adicionada!", type: "success" });
      onSuccess();
    } else {
      pushToast({ title: res.error, type: "error" });
    }
  };

  const parcelaMensalEst =
    form.valor_restante && form.parcelas_total && form.parcelas_pagas !== undefined
      ? (form.valor_restante - 0) / Math.max(form.parcelas_total - (form.parcelas_pagas ?? 0), 1)
      : form.valor_total && form.parcelas_total
      ? form.valor_total / form.parcelas_total
      : null;

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
              Nova Dívida
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Cadastre uma dívida para acompanhar
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
              Nome da dívida
            </label>
            <input
              type="text"
              placeholder="ex: Cartão de crédito, Financiamento…"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
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

          {/* Valor total + Valor restante */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Valor total
              </label>
              <CurrencyInput
                value={form.valor_total}
                onChange={(v) => {
                  set("valor_total", v);
                  if (!form.valor_restante) set("valor_restante", v);
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Saldo devedor atual
              </label>
              <CurrencyInput value={form.valor_restante} onChange={(v) => set("valor_restante", v)} />
            </div>
          </div>

          {/* Parcelas total + Parcelas pagas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Total de parcelas
              </label>
              <input
                type="number"
                min="1"
                placeholder="ex: 48"
                value={form.parcelas_total ?? ""}
                onChange={(e) => set("parcelas_total", parseInt(e.target.value) || null)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Parcelas já pagas
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.parcelas_pagas ?? 0}
                onChange={(e) => set("parcelas_pagas", parseInt(e.target.value) || 0)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          {/* Taxa de juros + Dia vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Taxa de juros (% a.m.)
              </label>
              <div
                className="flex items-center rounded-xl px-3 py-2.5 gap-1.5"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
              >
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={form.taxa_juros_mensal ?? ""}
                  onChange={(e) => set("taxa_juros_mensal", parseFloat(e.target.value) || null)}
                  className="flex-1 bg-transparent outline-none text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                />
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Dia do vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="ex: 10"
                value={form.dia_vencimento ?? ""}
                onChange={(e) => set("dia_vencimento", parseInt(e.target.value) || null)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          {/* Escopo */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Escopo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["INDIVIDUAL", "COMPARTILHADA"] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => set("escopo", e)}
                  className="py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: form.escopo === e ? "var(--brand-primary-light)" : "var(--bg-secondary)",
                    border: form.escopo === e ? "1.5px solid var(--brand-primary-muted)" : "1px solid var(--border)",
                    color: form.escopo === e ? "var(--brand-primary)" : "var(--text-secondary)",
                  }}
                >
                  {e === "INDIVIDUAL" ? "👤 Individual" : "👫 Compartilhada"}
                </button>
              ))}
            </div>
          </div>

          {/* Estimativa de parcela */}
          {parcelaMensalEst && parcelaMensalEst > 0 && (
            <div
              className="rounded-xl p-3"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Parcela mensal estimada</p>
              <p
                className="text-base font-bold italic mt-0.5"
                style={{ fontFamily: "var(--font-display)", color: "var(--brand-primary)" }}
              >
                {fmt(parcelaMensalEst)}
              </p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-5 py-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-all"
            style={{ background: "var(--brand-primary)", color: "white" }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Adicionar dívida
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Simulador de estratégias ─────────────────────────────────────────────────

function SimuladorEstrategias({ debtCount }: { debtCount: number }) {
  const [valorExtra, setValorExtra] = useState(200);
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [estrategiaAdotada, setEstrategiaAdotada] = useState<"AVALANCHE" | "BOLA_DE_NEVE" | null>(null);
  const { pushToast } = useToast();

  const runSimulation = useCallback(async () => {
    if (debtCount === 0) return;
    setLoading(true);
    const res = await getStrategy(valorExtra);
    setLoading(false);
    if (res.ok) {
      setResult(res.data);
    } else {
      pushToast({ title: res.error, type: "error" });
    }
  }, [valorExtra, debtCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  if (debtCount === 0) return null;

  const maxSlider = Math.max(valorExtra * 3, 3000);

  return (
    <div
      className="rounded-2xl p-4 mb-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--brand-primary-light)" }}
        >
          <TrendingDown size={15} style={{ color: "var(--brand-primary)" }} />
        </div>
        <div>
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Simulador de Antecipação
          </h2>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Quanto a mais vocês podem pagar por mês?
          </p>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Valor extra mensal</span>
          <span
            className="text-base font-bold italic"
            style={{ fontFamily: "var(--font-display)", color: "var(--brand-primary)" }}
          >
            {fmt(valorExtra)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.ceil(maxSlider)}
          step={50}
          value={valorExtra}
          onChange={(e) => setValorExtra(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--brand-primary) ${(valorExtra / maxSlider) * 100}%, var(--bg-tertiary) ${(valorExtra / maxSlider) * 100}%)`,
            accentColor: "var(--brand-primary)",
          }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2">
          <Loader2 size={18} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
          <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>Calculando…</span>
        </div>
      ) : result && (result.avalanche || result.bolaNeve) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[result.avalanche, result.bolaNeve].map((sim) => {
            if (!sim) return null;
            const isAvalanche = sim.estrategia === "AVALANCHE";
            const adotada = estrategiaAdotada === sim.estrategia;

            return (
              <div
                key={sim.estrategia}
                className="rounded-xl p-3 flex flex-col gap-2"
                style={{
                  background: adotada
                    ? "var(--brand-primary-light)"
                    : "var(--bg-secondary)",
                  border: adotada
                    ? "1.5px solid var(--brand-primary-muted)"
                    : "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{isAvalanche ? "🌊" : "⛄"}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                      {isAvalanche ? "Avalanche" : "Bola de Neve"}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      {isAvalanche ? "Maior juros primeiro" : "Menor saldo primeiro"}
                    </p>
                  </div>
                </div>

                {/* Métricas */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Meses para quitar</span>
                    <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                      {sim.mesesParaQuitar} meses
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Total de juros</span>
                    <span className="text-xs font-semibold" style={{ color: "var(--danger)" }}>
                      {fmt(sim.totalJuros)}
                    </span>
                  </div>
                  {sim.economiaJuros > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Economia de juros</span>
                      <span className="text-xs font-bold" style={{ color: "var(--success)" }}>
                        +{fmt(sim.economiaJuros)}
                      </span>
                    </div>
                  )}
                  {result.semExtra && sim.mesesParaQuitar < result.semExtra.mesesParaQuitar && (
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Meses economizados</span>
                      <span className="text-xs font-bold" style={{ color: "var(--success)" }}>
                        {result.semExtra.mesesParaQuitar - sim.mesesParaQuitar} meses
                      </span>
                    </div>
                  )}
                </div>

                {/* Ordem de quitação */}
                <div>
                  <p className="text-[10px] font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>
                    Ordem de quitação:
                  </p>
                  <div className="space-y-0.5">
                    {sim.ordemQuitacao.map((q, i) => (
                      <div key={q.id} className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                          style={{ background: "var(--brand-primary)", color: "white" }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-[10px] flex-1 truncate" style={{ color: "var(--text-secondary)" }}>
                          {q.nome}
                        </span>
                        <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                          mês {q.mes}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setEstrategiaAdotada(adotada ? null : sim.estrategia)}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: adotada ? "var(--brand-primary)" : "var(--bg-card)",
                    border: `1px solid ${adotada ? "var(--brand-primary)" : "var(--border)"}`,
                    color: adotada ? "white" : "var(--text-secondary)",
                  }}
                >
                  {adotada ? "✓ Estratégia adotada" : "Adotar esta estratégia"}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-center py-4" style={{ color: "var(--text-tertiary)" }}>
          Sem dados para simular.
        </p>
      )}
    </div>
  );
}

// ─── Histórico de dívidas quitadas ────────────────────────────────────────────

function Historico({ debts }: { debts: DebtItem[] }) {
  const [expandido, setExpandido] = useState(false);
  if (debts.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setExpandido((p) => !p)}
        className="flex items-center gap-2 mb-3 w-full"
      >
        <History size={13} style={{ color: "var(--text-tertiary)" }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          Histórico de quitadas ({debts.length})
        </span>
        {expandido ? (
          <ChevronUp size={13} style={{ color: "var(--text-tertiary)" }} />
        ) : (
          <ChevronDown size={13} style={{ color: "var(--text-tertiary)" }} />
        )}
      </button>
      {expandido && (
        <div className="space-y-2">
          {debts.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl p-3 flex items-center gap-3"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                opacity: 0.7,
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "var(--success-light)" }}
              >
                <Check size={12} style={{ color: "var(--success)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {d.nome}
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {fmt(d.valorTotal)} · Quitada
                </p>
              </div>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "var(--success-light)", color: "var(--success)" }}
              >
                ✓ Quitada
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function DividasClient() {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [historico, setHistorico] = useState<DebtItem[]>([]);
  const [resumo, setResumo] = useState<DebtResumo>({
    totalDividas: 0,
    totalParcelas: 0,
    rendaMensal: 0,
    comprometimento: 0,
    alertaComprometimento: false,
  });
  const [loading, setLoading] = useState(true);
  const [showNovaDivida, setShowNovaDivida] = useState(false);
  const [pagarDebt, setPagarDebt] = useState<DebtItem | null>(null);
  const { pushToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listDebts(true);
    if (res.ok) {
      setDebts(res.data.debts);
      setHistorico(res.data.historico);
      setResumo(res.data.resumo);
    } else {
      pushToast({ title: res.error, type: "error" });
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const handlePagarSuccess = (quitada: boolean, updated: DebtItem) => {
    setPagarDebt(null);
    if (quitada) {
      setDebts((prev) => prev.filter((d) => d.id !== updated.id));
      setHistorico((prev) => [{ ...updated, status: "QUITADA" }, ...prev]);
      pushToast({ title: `🎉 ${updated.nome} foi quitada!`, type: "success" });
    } else {
      setDebts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      pushToast({ title: "Pagamento registrado!", type: "success" });
    }
  };

  const handleDeletar = async (id: string) => {
    const res = await deleteDebt(id);
    if (res.ok) {
      setDebts((prev) => prev.filter((d) => d.id !== id));
      pushToast({ title: "Dívida removida", type: "success" });
    } else {
      pushToast({ title: res.error, type: "error" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-10">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1
            className="text-2xl font-bold italic"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Dívidas
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Controle e estratégias de quitação
          </p>
        </div>
        <button
          onClick={() => setShowNovaDivida(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: "var(--brand-primary)", color: "white" }}
        >
          <Plus size={16} />
          Nova dívida
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Carregando dívidas…
          </p>
        </div>
      ) : (
        <>
          {/* ── Resumo ─────────────────────────────────────────────── */}
          {(debts.length > 0 || historico.length > 0) && (
            <ResumoCard resumo={resumo} />
          )}

          {/* ── Alertas de vencimento ───────────────────────────────── */}
          <AlertasVencimento debts={debts} />

          {/* ── Simulador de estratégias ────────────────────────────── */}
          {debts.length > 0 && <SimuladorEstrategias debtCount={debts.length} />}

          {/* ── Lista de dívidas ────────────────────────────────────── */}
          {debts.length > 0 ? (
            <section className="mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
                Dívidas ativas ({debts.length})
              </h2>
              <div className="space-y-3">
                {debts.map((debt) => (
                  <DebtCard
                    key={debt.id}
                    debt={debt}
                    onPagar={setPagarDebt}
                    onDeletar={handleDeletar}
                  />
                ))}
              </div>
            </section>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ background: "var(--success-light)" }}
              >
                🎉
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  Sem dívidas ativas!
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
                  {historico.length > 0 ? "Todas as dívidas foram quitadas." : "Ótimo ponto de partida!"}
                </p>
              </div>
              <button
                onClick={() => setShowNovaDivida(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                <Plus size={16} /> Adicionar dívida
              </button>
            </div>
          )}

          {/* ── Histórico ───────────────────────────────────────────── */}
          <Historico debts={historico} />
        </>
      )}

      {/* ── Modais ─────────────────────────────────────────────────── */}
      {showNovaDivida && (
        <NovaDividaModal
          onClose={() => setShowNovaDivida(false)}
          onSuccess={() => {
            setShowNovaDivida(false);
            load();
          }}
        />
      )}

      {pagarDebt && (
        <PagarModal
          debt={pagarDebt}
          onClose={() => setPagarDebt(null)}
          onSuccess={handlePagarSuccess}
        />
      )}
    </div>
  );
}
