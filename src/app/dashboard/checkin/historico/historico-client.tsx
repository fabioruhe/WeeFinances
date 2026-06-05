"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import {
  listCheckins,
  SENTIMENT_EMOJI,
  SENTIMENT_LABELS,
  type CheckinHistoryItem,
} from "@/lib/clients/checkins-client";

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatMes(dateStr: string) {
  const [y, m] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function HistoricoClient() {
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<CheckinHistoryItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listCheckins();
    if (res.ok) {
      setCheckins(res.data.checkins);
    } else {
      pushToast({ type: "error", title: res.error });
    }
    setLoading(false);
  }, [pushToast]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/checkin"
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={20} />
        </Link>
        <h1
          className="font-display text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Histórico de Check-ins
        </h1>
      </div>

      {checkins.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <Calendar size={40} style={{ color: "var(--text-tertiary)" }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Nenhum check-in realizado ainda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {checkins.map((ci) => {
            const resumo = ci.resumoJson as Record<string, number> | null;
            return (
              <div
                key={ci.id}
                className="rounded-xl p-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-display text-sm font-semibold capitalize"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatMes(ci.data)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg" title={SENTIMENT_LABELS[ci.sentimentoA]}>
                      {SENTIMENT_EMOJI[ci.sentimentoA]}
                    </span>
                    {ci.sentimentoB != null && (
                      <span className="text-lg" title={SENTIMENT_LABELS[ci.sentimentoB]}>
                        {SENTIMENT_EMOJI[ci.sentimentoB]}
                      </span>
                    )}
                  </div>
                </div>

                {resumo && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {resumo.receitas != null && (
                      <div>
                        <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          Receitas
                        </p>
                        <p className="text-xs font-medium" style={{ color: "var(--success)" }}>
                          {fmt(resumo.receitas)}
                        </p>
                      </div>
                    )}
                    {resumo.despesas != null && (
                      <div>
                        <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          Despesas
                        </p>
                        <p className="text-xs font-medium" style={{ color: "var(--danger)" }}>
                          {fmt(resumo.despesas)}
                        </p>
                      </div>
                    )}
                    {resumo.saldo != null && (
                      <div>
                        <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          Saldo
                        </p>
                        <p
                          className="text-xs font-medium"
                          style={{
                            color: resumo.saldo >= 0 ? "var(--success)" : "var(--danger)",
                          }}
                        >
                          {fmt(resumo.saldo)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
