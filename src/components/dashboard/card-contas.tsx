"use client";

import { AlertTriangle, CheckCircle } from "lucide-react";
import type { DashboardData } from "@/app/api/dashboard/route";

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CardContas({ data }: { data: DashboardData["proximasContas"] }) {
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
        Próximas Contas (5 dias)
      </h3>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <CheckCircle size={28} style={{ color: "var(--success)" }} />
          <p className="text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
            Nenhuma conta vencendo nos próximos 5 dias
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((conta) => (
            <li
              key={conta.id}
              className="flex items-center justify-between gap-2 py-2 border-b last:border-b-0"
              style={{ borderColor: "var(--divider)" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {conta.diasAteVencimento <= 1 && (
                  <AlertTriangle
                    size={15}
                    className="shrink-0"
                    style={{ color: "var(--danger)" }}
                  />
                )}
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {conta.nome}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {conta.diasAteVencimento === 0
                      ? "Vence hoje"
                      : conta.diasAteVencimento === 1
                      ? "Vence amanhã"
                      : `${conta.diasAteVencimento} dias`}
                  </p>
                </div>
              </div>
              <p
                className="value-display text-sm font-bold shrink-0"
                style={{ color: conta.diasAteVencimento <= 1 ? "var(--danger)" : "var(--text-primary)" }}
              >
                {fmt(conta.valor)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
