"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DashboardData } from "@/app/api/dashboard/route";

type Entry = DashboardData["evolucaoMensal"][number];

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact" });
}

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
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        fontFamily: "var(--font-dm-sans)",
      }}
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

const LINES = [
  { key: "receitas", label: "Receitas", color: "var(--success)" },
  { key: "despesas", label: "Despesas", color: "var(--danger)" },
  { key: "poupanca", label: "Poupança", color: "var(--brand-primary)" },
] as const;

export function CardEvolucao({ data }: { data: DashboardData["evolucaoMensal"] }) {
  const hasData = data.some((d) => d.receitas > 0 || d.despesas > 0);

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
        Evolução Mensal (últimos 6 meses)
      </h3>

      {!hasData ? (
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ height: 200, background: "var(--bg-secondary)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Sem dados suficientes para exibir o gráfico
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11, fill: "var(--text-tertiary)", fontFamily: "var(--font-dm-sans)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fontSize: 11, fill: "var(--text-tertiary)", fontFamily: "var(--font-dm-sans)" }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-dm-sans)", paddingTop: 8 }}
            />
            {LINES.map(({ key, label, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
