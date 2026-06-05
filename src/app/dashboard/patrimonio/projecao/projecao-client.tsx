"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ArrowLeft, Calculator } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  calculateProjecao, fetchProjecaoAuto,
  type ProjecaoResult, type ProjecaoAutoData,
} from "@/lib/clients/patrimonio-client";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtCompact(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v.toFixed(0);
}

function AreaTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-sm shadow"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Ano {label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
}

export function ProjecaoClient() {
  const { pushToast } = useToast();
  const [autoData, setAutoData] = useState<ProjecaoAutoData | null>(null);
  const [result, setResult] = useState<ProjecaoResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // Form state
  const [valorInicial, setValorInicial] = useState(0);
  const [aporteMensal, setAporteMensal] = useState(1000);
  const [taxaAnual, setTaxaAnual] = useState(10);
  const [anosProjecao, setAnosProjecao] = useState(20);

  const loadAuto = useCallback(async () => {
    const res = await fetchProjecaoAuto();
    if (res.ok) {
      setAutoData(res.data);
      if (res.data.temDados) {
        setValorInicial(Math.round(res.data.valorAtual));
        if (res.data.aporteMedio > 0) setAporteMensal(Math.round(res.data.aporteMedio));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAuto(); }, [loadAuto]);

  const calcular = useCallback(async () => {
    setCalculating(true);
    const res = await calculateProjecao({
      valor_inicial: valorInicial,
      aporte_mensal: aporteMensal,
      taxa_anual: taxaAnual,
      anos_projecao: anosProjecao,
    });
    if (res.ok) setResult(res.data);
    else pushToast({ type: "error", title: res.error });
    setCalculating(false);
  }, [valorInicial, aporteMensal, taxaAnual, anosProjecao, pushToast]);

  // Auto-calculate on param change
  useEffect(() => {
    if (!loading) calcular();
  }, [loading, calcular]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
          style={{ borderColor: "var(--brand-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  // Chart data
  const chartData = result?.projecao.map((p) => ({
    ano: p.anoCalendario,
    aportes: p.totalAportado,
    juros: p.totalJuros,
  })) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/patrimonio" className="p-2 rounded-lg"
          style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Projeção Patrimonial
        </h1>
      </div>

      {autoData?.temDados && (
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Valores iniciais preenchidos automaticamente com seus dados reais
        </p>
      )}

      {/* Sliders */}
      <div className="rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
        <SliderField label="Valor inicial" value={valorInicial} onChange={setValorInicial}
          min={0} max={5_000_000} step={1000} format={fmt} />
        <SliderField label="Aporte mensal" value={aporteMensal} onChange={setAporteMensal}
          min={0} max={50_000} step={100} format={fmt} />
        <SliderField label="Taxa anual (%)" value={taxaAnual} onChange={setTaxaAnual}
          min={0} max={30} step={0.5} format={(v) => `${v.toFixed(1)}%`} />
        <SliderField label="Horizonte (anos)" value={anosProjecao} onChange={setAnosProjecao}
          min={1} max={50} step={1} format={(v) => `${v} anos`} />
      </div>

      {/* Resumo */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MiniCard label="Valor Final" value={fmt(result.resumo.valorFinal)} color="var(--brand-primary)" />
          <MiniCard label="Total Aportado" value={fmt(result.resumo.totalAportado)} color="var(--text-secondary)" />
          <MiniCard label="Total Juros" value={fmt(result.resumo.totalJuros)} color="var(--success)" />
          <MiniCard label="Multiplicador" value={`${result.resumo.multiplicador}x`} color="var(--brand-accent)"
            sub={result.resumo.crossoverAno ? `Crossover no ano ${result.resumo.crossoverAno}` : undefined} />
        </div>
      )}

      {/* Area Chart */}
      {result && (
        <div className="rounded-2xl p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
            <Calculator size={16} className="inline mr-1.5" />
            Aportes vs Juros Acumulados
          </h3>
          {calculating ? (
            <div className="flex items-center justify-center" style={{ height: 300 }}>
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent"
                style={{ borderColor: "var(--brand-primary)", borderTopColor: "transparent" }} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="ano" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                  tickFormatter={fmtCompact} />
                <Tooltip content={<AreaTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="aportes" name="Aportes" stackId="1"
                  stroke="var(--text-secondary)" fill="var(--bg-secondary)" />
                <Area type="monotone" dataKey="juros" name="Juros" stackId="1"
                  stroke="var(--success)" fill="var(--success)" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Table */}
      {result && (
        <div className="rounded-2xl p-5 overflow-x-auto"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
            Tabela Detalhada
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--text-tertiary)" }}>
                <th className="text-left py-2 px-2 font-medium">Ano</th>
                <th className="text-right py-2 px-2 font-medium">Aportes</th>
                <th className="text-right py-2 px-2 font-medium">Juros</th>
                <th className="text-right py-2 px-2 font-medium">Saldo</th>
                <th className="text-right py-2 px-2 font-medium">% Juros</th>
              </tr>
            </thead>
            <tbody>
              {result.projecao.map((p) => (
                <tr key={p.ano} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2 px-2 font-medium" style={{ color: "var(--text-primary)" }}>{p.anoCalendario}</td>
                  <td className="py-2 px-2 text-right" style={{ color: "var(--text-secondary)" }}>{fmt(p.aportesNoAno)}</td>
                  <td className="py-2 px-2 text-right" style={{ color: "var(--success)" }}>{fmt(p.jurosNoAno)}</td>
                  <td className="py-2 px-2 text-right font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(p.saldoFinal)}</td>
                  <td className="py-2 px-2 text-right" style={{ color: "var(--brand-primary)" }}>{p.percentualJuros.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SliderField({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--brand-primary)]" />
    </div>
  );
}

function MiniCard({ label, value, color, sub }: {
  label: string; value: string; color: string; sub?: string;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{sub}</p>}
    </div>
  );
}
