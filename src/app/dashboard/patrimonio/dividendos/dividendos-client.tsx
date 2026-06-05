"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Plus, ArrowLeft, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  listDividends, createDividend, fetchDividendSummary, listAssets,
  DIVIDEND_TYPE_LABEL,
  type DividendItem, type DividendSummary, type DividendType, type AssetItem,
} from "@/lib/clients/patrimonio-client";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const DIVIDEND_TYPES: DividendType[] = ["DIVIDENDO", "JCP", "RENDIMENTO", "ALUGUEL", "OUTRO"];

const TYPE_COLORS: Record<DividendType, string> = {
  DIVIDENDO: "var(--brand-primary)",
  JCP: "var(--brand-secondary)",
  RENDIMENTO: "var(--success)",
  ALUGUEL: "var(--brand-accent)",
  OUTRO: "var(--text-tertiary)",
};

function BarTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-sm shadow"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{DIVIDEND_TYPE_LABEL[p.name as DividendType] ?? p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
}

export function DividendosClient() {
  const { pushToast } = useToast();
  const [summary, setSummary] = useState<DividendSummary | null>(null);
  const [dividends, setDividends] = useState<DividendItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const [sRes, dRes, aRes] = await Promise.all([
      fetchDividendSummary(), listDividends(), listAssets(),
    ]);
    if (sRes.ok) setSummary(sRes.data);
    if (dRes.ok) setDividends(dRes.data.dividends);
    if (aRes.ok) setAssets(aRes.data.assets);
    if (!sRes.ok) pushToast({ type: "error", title: "Erro ao carregar resumo" });
    setLoading(false);
  }, [pushToast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await createDividend({
      valor: Number(fd.get("valor")),
      mes_referencia: fd.get("mes_referencia") as string,
      tipo: fd.get("tipo") as DividendType,
      asset_id: (fd.get("asset_id") as string) || undefined,
      descricao: (fd.get("descricao") as string) || undefined,
    });
    if (res.ok) {
      setShowForm(false);
      load();
      pushToast({ type: "success", title: "Provento registrado!" });
    } else {
      pushToast({ type: "error", title: res.error });
    }
  };

  // Transform summary for stacked bar chart
  const chartData = summary?.evolucao12m.map((m) => ({
    mes: m.mes,
    ...m.porTipo,
  })) ?? [];

  // Collect all dividend types present in chart data
  const typesInChart = new Set<string>();
  for (const d of chartData) {
    for (const key of Object.keys(d)) {
      if (key !== "mes") typesInChart.add(key);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
          style={{ borderColor: "var(--brand-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const now = new Date();
  const defaultMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/patrimonio" className="p-2 rounded-lg"
          style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Renda Passiva
        </h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={18} style={{ color: "var(--brand-primary)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Este mês</span>
            </div>
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{fmt(summary.mesAtual)}</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} style={{ color: "var(--success)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Média mensal</span>
            </div>
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{fmt(summary.media12Meses)}</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} style={{ color: "var(--brand-accent)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Projeção anual</span>
            </div>
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{fmt(summary.projecaoAnual)}</p>
          </div>
        </div>
      )}

      {/* Stacked Bar Chart */}
      <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
          Evolução de Proventos (12 meses)
        </h3>
        {chartData.length === 0 || chartData.every((d) => Object.keys(d).length <= 1) ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<BarTooltip />} />
              <Legend formatter={(value: string) => DIVIDEND_TYPE_LABEL[value as DividendType] ?? value} />
              {[...typesInChart].map((tipo) => (
                <Bar key={tipo} dataKey={tipo} stackId="a"
                  fill={TYPE_COLORS[tipo as DividendType] ?? "var(--text-tertiary)"} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Entries List + Form */}
      <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Registros ({dividends.length})
          </h3>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--brand-primary)", color: "#fff" }}>
            <Plus size={16} /> Novo Provento
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3 mb-4 p-4 rounded-xl"
            style={{ background: "var(--bg-secondary)" }}>
            <input name="valor" type="number" step="0.01" min="0.01" placeholder="Valor" required
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            <input name="mes_referencia" type="month" defaultValue={defaultMes} required
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            <select name="tipo" required className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
              {DIVIDEND_TYPES.map((t) => <option key={t} value={t}>{DIVIDEND_TYPE_LABEL[t]}</option>)}
            </select>
            <select name="asset_id" className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
              <option value="">Sem ativo vinculado</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
            <input name="descricao" placeholder="Descrição (opcional)" className="col-span-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm"
                style={{ color: "var(--text-secondary)" }}>Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--brand-primary)", color: "#fff" }}>Registrar</button>
            </div>
          </form>
        )}

        {dividends.length === 0 ? (
          <EmptyChart text="Nenhum provento registrado" />
        ) : (
          <div className="space-y-2">
            {dividends.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--bg-secondary)" }}>
                <div className="w-2 h-8 rounded-full"
                  style={{ background: TYPE_COLORS[d.tipo] ?? "var(--text-tertiary)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {DIVIDEND_TYPE_LABEL[d.tipo]}
                    {d.assetNome && <span className="ml-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>· {d.assetNome}</span>}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {d.descricao ?? d.mesReferencia.slice(0, 7)}
                  </p>
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                  {fmt(d.valor)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart({ text = "Sem dados" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl" style={{ height: 160, background: "var(--bg-secondary)" }}>
      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{text}</p>
    </div>
  );
}
