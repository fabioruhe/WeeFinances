"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  fetchPrecoMedio, ASSET_TYPE_LABEL, ASSET_TYPE_COLOR,
  type PrecoMedioItem, type AssetType,
} from "@/lib/clients/patrimonio-client";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

export function PrecoMedioClient() {
  const { pushToast } = useToast();
  const [items, setItems] = useState<PrecoMedioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetchPrecoMedio();
    if (res.ok) setItems(res.data.items);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/patrimonio" className="p-2 rounded-lg"
          style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Preço Médio
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl" style={{ height: 200, background: "var(--bg-secondary)" }}>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nenhum ativo com ticker cadastrado
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isPositive = item.rentabilidade >= 0;
            return (
              <div key={item.ticker} className="rounded-2xl p-5"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
                {/* Ticker header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-6 rounded-full" style={{ background: ASSET_TYPE_COLOR[item.tipo as AssetType] }} />
                    <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{item.ticker}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--bg-secondary)", color: "var(--text-tertiary)" }}>
                      {ASSET_TYPE_LABEL[item.tipo as AssetType]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1" style={{ color: isPositive ? "var(--success)" : "var(--error)" }}>
                    {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span className="text-sm font-semibold">{fmtPct(item.rentabilidadePct)}</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="Preço Médio" value={fmt(item.precoMedio)} />
                  <Stat label="Quantidade" value={item.totalQuantidade.toLocaleString("pt-BR")} />
                  <Stat label="Total Investido" value={fmt(item.totalInvestido)} />
                  <Stat label="Valor Atual" value={fmt(item.totalAtual)} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3"
                  style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {item.compras} compra{item.compras > 1 ? "s" : ""}
                    {item.instituicoes.length > 0 && ` · ${item.instituicoes.join(", ")}`}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: isPositive ? "var(--success)" : "var(--error)" }}>
                    {isPositive ? "+" : ""}{fmt(item.rentabilidade)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}
