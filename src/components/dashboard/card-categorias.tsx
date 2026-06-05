"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DashboardData } from "@/app/api/dashboard/route";

const COLORS = [
  "var(--brand-primary)",
  "var(--brand-secondary)",
  "var(--brand-accent)",
  "var(--partner-shared)",
  "var(--info)",
];

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Entry = DashboardData["gastosPorCategoria"][number];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: Entry }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
        {name}
      </p>
      <p style={{ color: "var(--text-secondary)" }}>
        {fmt(value)} · {p.percentual}%
      </p>
    </div>
  );
}

function renderLegend(props: { payload?: Array<{ value: string; color: string; payload: Entry }> }) {
  const { payload } = props;
  if (!payload) return null;
  return (
    <ul className="flex flex-col gap-1 pl-2">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: entry.color }}
          />
          <span className="truncate" style={{ color: "var(--text-secondary)" }}>
            {entry.value}
          </span>
          <span className="ml-auto font-medium shrink-0" style={{ color: "var(--text-primary)" }}>
            {fmt((entry.payload as Entry).valor)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CardCategorias({ data }: { data: DashboardData["gastosPorCategoria"] }) {
  const hasData = data.length > 0 && data.some((d) => d.valor > 0);

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
        Gastos por Categoria
      </h3>

      {!hasData ? (
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ height: 200, background: "var(--bg-secondary)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Sem gastos registrados este mês
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="valor"
              nameKey="nome"
              cx="40%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              content={renderLegend as unknown as React.ReactElement}
              wrapperStyle={{ maxWidth: "45%", right: 0 }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
