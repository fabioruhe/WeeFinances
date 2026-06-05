"use client";

import Link from "next/link";
import { Target, ArrowRight } from "lucide-react";
import type { DashboardData } from "@/app/api/dashboard/route";

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const GOAL_EMOJI: Record<string, string> = {
  EMERGENCIA: "🛡️",
  VIAGEM: "✈️",
  IMOVEL: "🏠",
  CARRO: "🚗",
  CASAMENTO: "💍",
  FILHOS: "👶",
  APOSENTADORIA: "🌴",
  EDUCACAO: "📚",
  OUTRO: "🎯",
};

export function CardMetas({ data }: { data: DashboardData["metas"] }) {
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
          Metas Ativas
        </h3>
        <Link
          href="/dashboard/metas"
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: "var(--brand-primary)" }}
        >
          ver todas <ArrowRight size={12} />
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <Target size={28} style={{ color: "var(--text-tertiary)" }} />
          <p className="text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
            Nenhuma meta ativa ainda
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {data.map((meta) => {
            const over = meta.percentual > 100;
            const warn = meta.percentual > 70;
            const barColor = over
              ? "var(--danger)"
              : warn
              ? "var(--warning)"
              : "var(--brand-primary)";

            return (
              <li key={meta.id}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-base">{GOAL_EMOJI[meta.tipo] ?? "🎯"}</span>
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {meta.nome}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold shrink-0"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {Math.round(meta.percentual)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "var(--bg-tertiary)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(meta.percentual, 100)}%`, background: barColor }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {fmt(meta.valorAtual)}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {fmt(meta.valorAlvo)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
