"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api-client";

type HistoryItem = {
  id: string;
  coupleId: string;
  createdAt: string;
  payload: {
    reason?: string | null;
    unlinkedAt?: string;
    sharedData?: {
      transactions?: unknown[];
      goals?: unknown[];
      debts?: unknown[];
      creditCards?: unknown[];
    };
  };
};

export default function RelationshipHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const result = await apiRequest<{ items?: HistoryItem[] }>(
        "/api/couple/history",
        undefined,
        "Nao foi possivel carregar o historico.",
      );

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setItems(result.data.items ?? []);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-8 md:px-8">
      <section className="card-surface p-5">
        <h1 className="text-2xl font-semibold text-text-primary">Historico read-only</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Copias dos dados compartilhados preservadas apos desvinculacao.
        </p>
      </section>

      <section className="card-surface p-5">
        {loading ? (
          <div className="space-y-3">
            <div className="skeleton-shimmer h-4 w-48 rounded-lg" />
            <div className="skeleton-shimmer h-20 w-full rounded-xl" />
            <div className="skeleton-shimmer h-20 w-full rounded-xl" />
            <p className="text-xs text-text-secondary">Carregando historico...</p>
          </div>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {!loading && !error && items.length === 0 ? (
          <p className="text-sm text-text-secondary">
            Nenhum snapshot salvo ainda. O historico aparece apos uma desvinculacao.
          </p>
        ) : null}

        <div className="space-y-3">
          {items.map((item) => {
            const transactionsCount = item.payload.sharedData?.transactions?.length ?? 0;
            const goalsCount = item.payload.sharedData?.goals?.length ?? 0;
            const debtsCount = item.payload.sharedData?.debts?.length ?? 0;
            const cardsCount = item.payload.sharedData?.creditCards?.length ?? 0;

            return (
              <article key={item.id} className="rounded-xl border border-border bg-bg-secondary p-4">
                <p className="text-sm font-medium text-text-primary">Casal: {item.coupleId}</p>
                <p className="mt-1 text-xs text-text-secondary">
                  Criado em: {new Date(item.createdAt).toLocaleString("pt-BR")}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Desvinculado em:{" "}
                  {item.payload.unlinkedAt
                    ? new Date(item.payload.unlinkedAt).toLocaleString("pt-BR")
                    : "-"}
                </p>
                <p className="mt-1 text-xs text-text-secondary">Motivo: {item.payload.reason ?? "-"}</p>
                <p className="mt-2 text-sm text-text-secondary">
                  Compartilhados preservados - Transacoes: {transactionsCount}, Metas: {goalsCount},
                  Dividas: {debtsCount}, Cartoes: {cardsCount}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card-surface p-5">
        <Link href="/settings/relationship" className="text-sm font-medium text-text-brand">
          Voltar para configuracoes de relacionamento
        </Link>
      </section>
    </main>
  );
}
