"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { fetchFreedom, type FreedomData } from "@/lib/clients/patrimonio-client";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── SVG Gauge ───────────────────────────────────────────────────────────────

function GaugeChart({ percent }: { percent: number }) {
  const size = 200;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percent));
  const dashOffset = circumference - (clampedPct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {/* Progress arc */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--brand-primary)" strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }} />
        {/* Center text */}
        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
          fill="var(--text-primary)" fontSize="32" fontWeight="700">
          {clampedPct.toFixed(0)}%
        </text>
        <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle"
          fill="var(--text-tertiary)" fontSize="12">
          liberdade financeira
        </text>
      </svg>
    </div>
  );
}

// ─── Status Icon ─────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: "COBERTA" | "PARCIAL" | "PENDENTE" }) {
  if (status === "COBERTA") return <CheckCircle2 size={18} style={{ color: "var(--success)" }} />;
  if (status === "PARCIAL") return <AlertCircle size={18} style={{ color: "var(--warning, #f59e0b)" }} />;
  return <Circle size={18} style={{ color: "var(--text-tertiary)" }} />;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function LiberdadeClient() {
  const { pushToast } = useToast();
  const [data, setData] = useState<FreedomData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetchFreedom();
    if (res.ok) setData(res.data);
    else pushToast({ type: "error", title: "Erro ao carregar dados" });
    setLoading(false);
  }, [pushToast]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
          style={{ borderColor: "var(--brand-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/patrimonio" className="p-2 rounded-lg"
          style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Liberdade Financeira
        </h1>
      </div>

      {/* Gauge + Stats */}
      <div className="rounded-2xl p-6 flex flex-col items-center gap-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
        <GaugeChart percent={data.percentualGeral} />
        <div className="grid grid-cols-3 gap-4 w-full max-w-md text-center">
          <div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Proventos/mês</p>
            <p className="text-sm font-bold" style={{ color: "var(--success)" }}>{fmt(data.totalProventos)}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Despesas fixas</p>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{fmt(data.totalDespesasFixas)}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Contas cobertas</p>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{data.contasCobertas}/{data.contasTotal}</p>
          </div>
        </div>
      </div>

      {/* Next Achievement */}
      {data.proximaConquista && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "var(--brand-primary-light)", border: "1px solid var(--brand-primary)" }}>
          <span className="text-lg">🎯</span>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Próxima conquista: <strong>{data.proximaConquista.nome}</strong>
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Faltam {fmt(data.proximaConquista.falta)} em proventos mensais
            </p>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="rounded-2xl p-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
          Contas por Prioridade
        </h3>

        {data.contas.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl" style={{ height: 120, background: "var(--bg-secondary)" }}>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Cadastre despesas fixas para usar o tracker
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.contas.map((c) => (
              <div key={c.id} className="p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <StatusIcon status={c.status} />
                  <span className="text-sm font-medium flex-1" style={{ color: "var(--text-primary)" }}>
                    {c.nome}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {fmt(c.valorMedio)}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, c.percentual)}%`,
                      background: c.status === "COBERTA" ? "var(--success)"
                        : c.status === "PARCIAL" ? "var(--warning, #f59e0b)" : "var(--text-tertiary)",
                    }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {fmt(c.coberto)} coberto
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {c.percentual.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
