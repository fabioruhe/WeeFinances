"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Plus, TrendingUp, TrendingDown, Wallet, Landmark, BarChart3, Shield } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useToast } from "@/components/ui/toast";
import {
  fetchPatrimonio, listAssets, createAsset, deleteAsset, updateAsset,
  ASSET_TYPE_LABEL, ASSET_TYPE_COLOR,
  type PatrimonioSummary, type AssetItem, type AssetType, type CreateAssetInput,
} from "@/lib/clients/patrimonio-client";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

const ASSET_TYPES: AssetType[] = [
  "RENDA_FIXA", "RENDA_VARIAVEL", "FUNDO", "FII", "IMOVEL",
  "VEICULO", "CRIPTO", "PREVIDENCIA", "POUPANCA", "OUTRO",
];

const DONUT_COLORS = Object.values(ASSET_TYPE_COLOR);

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percentual?: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="rounded-xl px-3 py-2 text-sm shadow"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{name}</p>
      <p style={{ color: "var(--text-secondary)" }}>
        {fmt(value)}{p.percentual !== undefined ? ` · ${p.percentual.toFixed(1)}%` : ""}
      </p>
    </div>
  );
}

function LineTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-sm shadow"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
      <p style={{ color: "var(--brand-primary)" }}>{fmt(payload[0].value)}</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PatrimonioClient() {
  const { pushToast } = useToast();
  const [summary, setSummary] = useState<PatrimonioSummary | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);

  const load = useCallback(async () => {
    const [sRes, aRes] = await Promise.all([fetchPatrimonio(), listAssets()]);
    if (sRes.ok) setSummary(sRes.data);
    if (aRes.ok) setAssets(aRes.data.assets);
    if (!sRes.ok || !aRes.ok) pushToast({ type: "error", title: "Erro ao carregar dados" });
    setLoading(false);
  }, [pushToast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: CreateAssetInput = {
      nome: fd.get("nome") as string,
      tipo: fd.get("tipo") as AssetType,
      instituicao: (fd.get("instituicao") as string) || undefined,
      ticker: (fd.get("ticker") as string) || undefined,
      valor_atual: Number(fd.get("valor_atual")),
      valor_investido: Number(fd.get("valor_investido")),
    };
    const res = await createAsset(input);
    if (res.ok) {
      setShowForm(false);
      load();
      pushToast({ type: "success", title: "Ativo criado!" });
    } else {
      pushToast({ type: "error", title: res.error });
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteAsset(id);
    if (res.ok) {
      load();
      pushToast({ type: "success", title: "Ativo removido" });
    }
  };

  const handleInlineUpdate = async (id: string) => {
    if (editValue < 0) return;
    const res = await updateAsset(id, { valor_atual: editValue });
    if (res.ok) {
      setEditingId(null);
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
          style={{ borderColor: "var(--brand-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Patrimônio
        </h1>
        <div className="flex gap-2">
          <Link href="/dashboard/patrimonio/dividendos"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
            <BarChart3 size={16} /> Proventos
          </Link>
          <Link href="/dashboard/patrimonio/liberdade"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
            <Shield size={16} /> Liberdade
          </Link>
          <Link href="/dashboard/patrimonio/projecao"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
            <TrendingUp size={16} /> Projeção
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard icon={<Wallet size={20} />} label="Total Ativos" value={fmt(summary.totalAtivos)} color="var(--brand-primary)" />
          <SummaryCard icon={<Landmark size={20} />} label="Patrimônio Líquido" value={fmt(summary.patrimonioLiquido)}
            sub={`${fmtPct(summary.variacaoPct)} vs mês anterior`}
            color={summary.variacao >= 0 ? "var(--success)" : "var(--error)"} />
          <SummaryCard icon={summary.variacao >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            label="Dívidas" value={fmt(summary.totalDividas)} color="var(--error)" />
        </div>
      )}

      {/* Composition + Evolution */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Donut */}
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
              Composição por Tipo
            </h3>
            {summary.porTipo.length === 0 ? (
              <EmptyState text="Nenhum ativo cadastrado" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={summary.porTipo} dataKey="valor" nameKey="tipo"
                    cx="40%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                    {summary.porTipo.map((entry, i) => (
                      <Cell key={i} fill={ASSET_TYPE_COLOR[entry.tipo as AssetType] ?? DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend layout="vertical" align="right" verticalAlign="middle"
                    formatter={(value: string) => ASSET_TYPE_LABEL[value as AssetType] ?? value} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Evolution Line */}
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
              Evolução 12 meses
            </h3>
            {summary.evolucao12m.every((e) => e.valor === 0) ? (
              <EmptyState text="Sem dados de evolução" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={summary.evolucao12m}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<LineTooltip />} />
                  <Line type="monotone" dataKey="valor" stroke="var(--brand-primary)"
                    strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Assets List */}
      <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Ativos ({assets.length})
          </h3>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--brand-primary)", color: "#fff" }}>
            <Plus size={16} /> Novo Ativo
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3 mb-4 p-4 rounded-xl"
            style={{ background: "var(--bg-secondary)" }}>
            <input name="nome" placeholder="Nome do ativo" required className="col-span-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            <select name="tipo" required className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
              {ASSET_TYPES.map((t) => <option key={t} value={t}>{ASSET_TYPE_LABEL[t]}</option>)}
            </select>
            <input name="instituicao" placeholder="Instituição" className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            <input name="ticker" placeholder="Ticker (opcional)" className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Valor atual</label>
              <input name="valor_atual" type="hidden" id="valor_atual_hidden" />
              <CurrencyInput value={0} onChange={(v) => {
                const el = document.getElementById("valor_atual_hidden") as HTMLInputElement;
                if (el) el.value = String(v);
              }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Valor investido</label>
              <input name="valor_investido" type="hidden" id="valor_investido_hidden" />
              <CurrencyInput value={0} onChange={(v) => {
                const el = document.getElementById("valor_investido_hidden") as HTMLInputElement;
                if (el) el.value = String(v);
              }} />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm"
                style={{ color: "var(--text-secondary)" }}>Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--brand-primary)", color: "#fff" }}>Criar</button>
            </div>
          </form>
        )}

        {assets.length === 0 ? (
          <EmptyState text="Nenhum ativo cadastrado ainda" />
        ) : (
          <div className="space-y-2">
            {assets.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--bg-secondary)" }}>
                <div className="w-2 h-8 rounded-full" style={{ background: ASSET_TYPE_COLOR[a.tipo] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {a.nome}
                    {a.ticker && <span className="ml-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>({a.ticker})</span>}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {ASSET_TYPE_LABEL[a.tipo]}{a.instituicao ? ` · ${a.instituicao}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  {editingId === a.id ? (
                    <div className="flex gap-1 items-center">
                      <div className="w-36">
                        <CurrencyInput value={editValue} onChange={setEditValue} />
                      </div>
                      <button onClick={() => handleInlineUpdate(a.id)} className="text-xs px-2 py-1 rounded"
                        style={{ background: "var(--brand-primary)", color: "#fff" }}>OK</button>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold cursor-pointer" style={{ color: "var(--text-primary)" }}
                      onClick={() => { setEditingId(a.id); setEditValue(a.valorAtual); }}>
                      {fmt(a.valorAtual)}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: a.rentabilidade >= 0 ? "var(--success)" : "var(--error)" }}>
                    {a.rentabilidade >= 0 ? "+" : ""}{fmt(a.rentabilidade)} ({fmtPct(a.rentabilidadePct)})
                  </p>
                </div>
                <button onClick={() => handleDelete(a.id)} className="text-xs px-2 py-1 rounded"
                  style={{ color: "var(--error)" }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl" style={{ height: 160, background: "var(--bg-secondary)" }}>
      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{text}</p>
    </div>
  );
}
