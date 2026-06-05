"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Award, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "@/components/ui/toast";
import {
  fetchMonthlyReport,
  fetchEvolution,
  fetchCoupleReport,
  type MonthlyReport,
  type EvolutionReport,
  type CoupleReport,
} from "@/lib/clients/reports-client";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtCompact(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact" });
}

function mesLabel(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

const PIE_COLORS = [
  "var(--brand-primary)",
  "var(--brand-secondary)",
  "var(--brand-accent)",
  "var(--partner-shared)",
  "var(--info)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
];

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-sm"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

type Tab = "mensal" | "evolucao" | "casal";

export function RelatoriosClient() {
  const { pushToast } = useToast();
  const [tab, setTab] = useState<Tab>("mensal");
  const [loading, setLoading] = useState(true);

  // Mensal
  const now = new Date();
  const [mesAtual, setMesAtual] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);

  // Evolução
  const [evolution, setEvolution] = useState<EvolutionReport | null>(null);

  // Casal
  const [couple, setCouple] = useState<CoupleReport | null>(null);

  const isCouple = monthly?.isCouple ?? evolution?.isCouple ?? false;

  const loadMonthly = useCallback(async (mes: string) => {
    setLoading(true);
    const res = await fetchMonthlyReport(mes);
    if (res.ok) setMonthly(res.data);
    else pushToast({ type: "error", title: res.error });
    setLoading(false);
  }, [pushToast]);

  const loadEvolution = useCallback(async () => {
    setLoading(true);
    const res = await fetchEvolution();
    if (res.ok) setEvolution(res.data);
    else pushToast({ type: "error", title: res.error });
    setLoading(false);
  }, [pushToast]);

  const loadCouple = useCallback(async (mes: string) => {
    setLoading(true);
    const res = await fetchCoupleReport(mes);
    if (res.ok) setCouple(res.data);
    else pushToast({ type: "error", title: res.error });
    setLoading(false);
  }, [pushToast]);

  useEffect(() => {
    if (tab === "mensal") loadMonthly(mesAtual);
    else if (tab === "evolucao") loadEvolution();
    else if (tab === "casal") loadCouple(mesAtual);
  }, [tab, mesAtual, loadMonthly, loadEvolution, loadCouple]);

  // Month navigation
  const navigateMonth = (dir: -1 | 1) => {
    const [y, m] = mesAtual.split("-").map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMesAtual(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "mensal", label: "Mensal", show: true },
    { key: "evolucao", label: "Evolução", show: true },
    { key: "casal", label: "Casal", show: isCouple },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-10">
      <h1
        className="font-display text-2xl font-bold mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        Relatórios
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              background: tab === t.key ? "var(--bg-card)" : "transparent",
              color: tab === t.key ? "var(--brand-primary)" : "var(--text-secondary)",
              boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Month selector (mensal & casal tabs) */}
      {(tab === "mensal" || tab === "casal") && (
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg" style={{ color: "var(--text-secondary)" }}>
            <ChevronLeft size={20} />
          </button>
          <span
            className="font-display text-sm font-semibold capitalize min-w-[160px] text-center"
            style={{ color: "var(--text-primary)" }}
          >
            {mesLabel(mesAtual)}
          </span>
          <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg" style={{ color: "var(--text-secondary)" }}>
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
        </div>
      ) : (
        <>
          {tab === "mensal" && monthly && <TabMensal data={monthly} />}
          {tab === "evolucao" && evolution && <TabEvolucao data={evolution} />}
          {tab === "casal" && couple && <TabCasal data={couple} />}
        </>
      )}
    </div>
  );
}

// ─── Tab Mensal ─────────────────────────────────────────────────────────────

function TabMensal({ data }: { data: MonthlyReport }) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Receitas", value: data.receitas, color: "var(--success)" },
          { label: "Despesas", value: data.despesas, color: "var(--danger)" },
          { label: "Saldo", value: data.saldo, color: data.saldo >= 0 ? "var(--success)" : "var(--danger)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
            <p className="font-display text-sm font-bold italic" style={{ color }}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Comparativo */}
      {data.comparativo && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
          {data.comparativo.variacao > 0 ? (
            <TrendingUp size={16} style={{ color: "var(--danger)" }} />
          ) : (
            <TrendingDown size={16} style={{ color: "var(--success)" }} />
          )}
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {data.isCouple ? "Vocês gastaram" : "Você gastou"}{" "}
            <strong style={{ color: data.comparativo.variacao > 0 ? "var(--danger)" : "var(--success)" }}>
              {Math.abs(Math.round(data.comparativo.variacao))}%{" "}
              {data.comparativo.variacao > 0 ? "a mais" : "a menos"}
            </strong>{" "}
            que no mês anterior
          </p>
        </div>
      )}

      {/* Bar chart: Receitas vs Despesas por categoria */}
      {data.gastosPorCategoria.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
            Gastos por Categoria
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.gastosPorCategoria.slice(0, 8)}
                dataKey="valor"
                nameKey="nome"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.gastosPorCategoria.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-xl px-3 py-2 text-sm shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                      <p style={{ color: "var(--text-primary)" }}>{d.nome}</p>
                      <p style={{ color: "var(--text-secondary)" }}>{fmt(d.valor)} ({Math.round(d.percentual)}%)</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.gastosPorCategoria.slice(0, 8).map((cat, i) => (
              <div key={cat.nome} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  {cat.icone} {cat.nome} ({Math.round(cat.percentual)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 5 gastos */}
      {data.topGastos.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
            Top 5 Maiores Gastos
          </h3>
          <div className="space-y-2">
            {data.topGastos.map((t, i) => (
              <div key={t.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium w-5 text-center" style={{ color: "var(--text-tertiary)" }}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                      {t.descricao || "Sem descrição"}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      {t.categoria ?? "Sem categoria"}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium shrink-0 ml-2" style={{ color: "var(--danger)" }}>
                  {fmt(t.valor)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Insights
          </h3>
          {data.insights.map((insight, i) => {
            const icon = insight.tipo === "success" ? Award : insight.tipo === "warning" ? AlertTriangle : Lightbulb;
            const Icon = icon;
            const bgMap = {
              success: "rgba(34,197,94,0.08)",
              warning: "rgba(251,191,36,0.1)",
              info: "rgba(59,130,246,0.08)",
            };
            const colorMap = {
              success: "var(--success)",
              warning: "var(--warning, #f59e0b)",
              info: "var(--info, #3b82f6)",
            };
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: bgMap[insight.tipo] }}
              >
                <Icon size={16} className="shrink-0 mt-0.5" style={{ color: colorMap[insight.tipo] }} />
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {insight.texto}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {data.receitas === 0 && data.despesas === 0 && (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <BarChart3 size={40} style={{ color: "var(--text-tertiary)" }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Nenhuma transação neste mês.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Tab Evolução ───────────────────────────────────────────────────────────

function TabEvolucao({ data }: { data: EvolutionReport }) {
  if (data.evolucao.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <BarChart3 size={40} style={{ color: "var(--text-tertiary)" }} className="mx-auto mb-3" />
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Sem dados suficientes para mostrar a evolução.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Line chart */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
          Receitas vs Despesas vs Poupança
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.evolucao}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
            <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="receitas"
              name="Receitas"
              stroke="var(--success)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="despesas"
              name="Despesas"
              stroke="var(--danger)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="poupanca"
              name="Poupança"
              stroke="var(--brand-primary)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary bar chart */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
          Receitas vs Despesas por Mês
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.evolucao}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
            <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="receitas" name="Receitas" fill="var(--success)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" name="Despesas" fill="var(--danger)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab Casal ──────────────────────────────────────────────────────────────

function TabCasal({ data }: { data: CoupleReport }) {
  const totalComp = data.parceiros.reduce((s, p) => s + p.despesasCompartilhadas, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-medium mb-4" style={{ color: "var(--text-primary)" }}>
          Contribuição por Parceiro
        </h3>

        {data.parceiros.map((p) => (
          <div key={p.userId} className="mb-4 last:mb-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {p.nome}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Receitas</p>
                <p className="text-xs font-medium" style={{ color: "var(--success)" }}>{fmt(p.receitas)}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Despesas</p>
                <p className="text-xs font-medium" style={{ color: "var(--danger)" }}>{fmt(p.despesas)}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Compartilhado</p>
                <p className="text-xs font-medium" style={{ color: "var(--brand-primary)" }}>{fmt(p.despesasCompartilhadas)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Saldo entre parceiros */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
          Acerto de Contas
        </h3>
        {Math.abs(data.saldoEntre) < 1 ? (
          <p className="text-sm" style={{ color: "var(--success)" }}>
            Tudo acertado! Ambos pagaram valores equivalentes de despesas compartilhadas.
          </p>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>
              {data.saldoEntre > 0 ? data.nomeA : data.nomeB}
            </strong>{" "}
            pagou{" "}
            <strong style={{ color: "var(--brand-primary)" }}>
              {fmt(Math.abs(data.saldoEntre))}
            </strong>{" "}
            a mais em despesas compartilhadas este mês.
          </p>
        )}

        {/* Visual bar */}
        {totalComp > 0 && (
          <div className="mt-3">
            <div className="flex rounded-full overflow-hidden" style={{ height: 12 }}>
              <div
                style={{
                  width: `${(data.parceiros[0].despesasCompartilhadas / totalComp) * 100}%`,
                  background: "var(--partner-a, var(--brand-primary))",
                }}
              />
              <div
                style={{
                  width: `${(data.parceiros[1].despesasCompartilhadas / totalComp) * 100}%`,
                  background: "var(--partner-b, var(--brand-secondary))",
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                {data.nomeA}: {Math.round((data.parceiros[0].despesasCompartilhadas / totalComp) * 100)}%
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                {data.nomeB}: {Math.round((data.parceiros[1].despesasCompartilhadas / totalComp) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
