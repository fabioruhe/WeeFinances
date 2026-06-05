"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { DashboardData } from "@/app/api/dashboard/route";

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

export function CardSaldo({ data }: { data: DashboardData["saldo"] }) {
  const positive = data.saldo >= 0;
  const Icon = data.saldo > 0 ? TrendingUp : data.saldo < 0 ? TrendingDown : Minus;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Saldo do Mês
        </h3>
        <Icon
          size={16}
          style={{ color: positive ? "var(--success)" : "var(--danger)" }}
        />
      </div>

      <p
        className="value-display text-3xl mb-4"
        style={{ color: positive ? "var(--success)" : "var(--danger)" }}
      >
        {fmt(data.saldo)}
      </p>

      <div className="flex gap-4">
        <div>
          <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>
            Receitas
          </p>
          <p className="value-display text-sm font-semibold" style={{ color: "var(--success)" }}>
            {fmt(data.receitas)}
          </p>
        </div>
        <div
          className="w-px self-stretch"
          style={{ background: "var(--divider)" }}
        />
        <div>
          <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>
            Despesas
          </p>
          <p className="value-display text-sm font-semibold" style={{ color: "var(--danger)" }}>
            {fmt(data.despesas)}
          </p>
        </div>
      </div>
    </div>
  );
}
