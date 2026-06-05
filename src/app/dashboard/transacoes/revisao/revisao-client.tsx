"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  X,
  ChevronLeft,
  Bot,
  PartyPopper,
  RefreshCw,
  Pencil,
} from "lucide-react";
import { CategoryPicker } from "@/components/transacoes/category-picker";
import { useToast } from "@/components/ui/toast";

type Subcategoria = {
  id: string;
  nome: string;
  icone?: string | null;
};

type Categoria = {
  id: string;
  nome: string;
  icone?: string | null;
  subcategorias: Subcategoria[];
};

type TransacaoRevisao = {
  id: string;
  valor: string | number;
  tipo: "RECEITA" | "DESPESA";
  descricao: string | null;
  data: string;
  categoriaFonte: string | null;
  categoria: { id: string; nome: string; icone?: string | null } | null;
  subcategoria: { id: string; nome: string } | null;
};

type Correcao = {
  id: string;
  categoriaId: string;
  subcategoriaId: string | null;
};

function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Icons.Tag;
  const key = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("") as keyof typeof Icons;
  return (Icons[key] as LucideIcon) ?? Icons.Tag;
}

function fmt(val: string | number) {
  return Number(val).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fmtData(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

type Props = {
  userId: string;
  categorias: Categoria[];
};

export function RevisaoClient({ categorias }: Props) {
  const router = useRouter();
  const { pushToast } = useToast();

  const [transactions, setTransactions] = useState<TransacaoRevisao[]>([]);
  const [current, setCurrent] = useState(0);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [correcoes, setCorrecoes] = useState<Correcao[]>([]);
  const [editing, setEditing] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/transactions/review")
      .then((r) => r.json())
      .then((data) => {
        setTransactions(data.transactions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const tx = transactions[current];
  const total = transactions.length;
  const progress = total > 0 ? Math.round((confirmed.size / total) * 100) : 0;

  const handleConfirm = () => {
    if (!tx) return;
    setConfirmed((prev) => new Set([...prev, tx.id]));
    if (current < total - 1) {
      setCurrent((c) => c + 1);
    } else {
      finalizarRevisao();
    }
  };

  const handleSkip = () => {
    if (current < total - 1) {
      setCurrent((c) => c + 1);
    }
  };

  const handleSaveEdit = () => {
    if (!tx || !editCatId) return;
    setCorrecoes((prev) => [
      ...prev.filter((c) => c.id !== tx.id),
      { id: tx.id, categoriaId: editCatId, subcategoriaId: editSubId },
    ]);
    setConfirmed((prev) => new Set([...prev, tx.id]));
    setEditing(false);
    if (current < total - 1) {
      setCurrent((c) => c + 1);
    } else {
      finalizarRevisao();
    }
  };

  const confirmarTodas = async () => {
    const remaining = transactions
      .filter((t) => !confirmed.has(t.id))
      .map((t) => t.id);
    setConfirmed((prev) => new Set([...prev, ...remaining]));
    finalizarRevisao();
  };

  const finalizarRevisao = async () => {
    if (confirmed.size === 0 && correcoes.length === 0) {
      setDone(true);
      return;
    }
    setSaving(true);
    try {
      await fetch("/api/transactions/review/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_ids: [...confirmed],
          correcoes: correcoes.length ? correcoes : undefined,
        }),
      });
      setDone(true);
    } catch {
      pushToast({ type: "error", title: "Erro ao salvar revisão" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <RefreshCw
          size={24}
          className="animate-spin"
          style={{ color: "var(--brand-primary)" }}
        />
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "var(--brand-primary-light)" }}
        >
          <PartyPopper size={32} style={{ color: "var(--brand-primary)" }} />
        </div>
        <h2
          className="text-xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            color: "var(--text-primary)",
          }}
        >
          Revisão concluída! 🎯
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Suas transações da semana estão revisadas. Seus relatórios ficam cada
          vez mais precisos.
        </p>
        {correcoes.length > 0 && (
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Você corrigiu {correcoes.length} de {total} sugestões.
          </p>
        )}
        <button
          type="button"
          onClick={() => router.push("/dashboard/transacoes")}
          className="mt-2 px-6 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: "var(--brand-primary)", color: "white" }}
        >
          Voltar para Transações
        </button>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--success-light)" }}
        >
          <Check size={28} style={{ color: "var(--success)" }} />
        </div>
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Tudo em dia!
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Não há transações auto-categorizadas pendentes de revisão esta semana.
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/transacoes")}
          className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: "var(--brand-primary)", color: "white" }}
        >
          Voltar
        </button>
      </div>
    );
  }

  const CatIcon = getIcon(tx?.categoria?.icone);

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard/transacoes")}
          className="p-1.5 rounded-lg"
          style={{ color: "var(--text-secondary)" }}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h1
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Revisão Semanal
          </h1>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {confirmed.size} de {total} revisadas
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div
        className="w-full h-2 rounded-full mb-6 overflow-hidden"
        style={{ background: "var(--bg-tertiary)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: "var(--brand-primary)",
          }}
        />
      </div>

      {/* Card da transação */}
      {tx && (
        <div
          className="rounded-2xl p-5 mb-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Cabeçalho do card */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--brand-primary-light)" }}
            >
              <CatIcon size={22} style={{ color: "var(--brand-primary)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-semibold text-base truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {tx.descricao ?? "—"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                {fmtData(tx.data)}
              </p>
            </div>
            <p
              className="value-display text-xl font-bold flex-shrink-0"
              style={{
                color:
                  tx.tipo === "RECEITA" ? "var(--success)" : "var(--text-primary)",
              }}
            >
              {tx.tipo === "RECEITA" ? "+" : "-"}
              {fmt(tx.valor)}
            </p>
          </div>

          {/* Categoria aplicada */}
          {!editing ? (
            <div
              className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{ background: "var(--bg-secondary)" }}
            >
              <div className="flex items-center gap-2">
                <Bot size={14} style={{ color: "var(--brand-primary)" }} />
                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {tx.categoria?.nome ?? "Sem categoria"}
                    {tx.subcategoria ? ` · ${tx.subcategoria.nome}` : ""}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {tx.categoriaFonte === "SISTEMA"
                      ? "Categorizado pelo sistema"
                      : "Regra personalizada"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setEditCatId(tx.categoria?.id ?? null);
                  setEditSubId(tx.subcategoria?.id ?? null);
                }}
                className="p-1.5 rounded-lg"
                style={{ color: "var(--text-tertiary)" }}
              >
                <Pencil size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--text-tertiary)" }}
              >
                ESCOLHA A CATEGORIA CORRETA
              </p>
              <CategoryPicker
                categorias={categorias}
                selectedCategoriaId={editCatId}
                selectedSubcategoriaId={editSubId}
                onSelect={(catId, subId) => {
                  setEditCatId(catId);
                  setEditSubId(subId);
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editCatId}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
                  style={{ background: "var(--brand-primary)", color: "white" }}
                >
                  Salvar correção
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ações */}
      {!editing && (
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={handleSkip}
            disabled={current >= total - 1}
            className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl font-semibold text-sm border disabled:opacity-40"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <X size={16} />
            Pular
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl font-semibold text-sm"
            style={{ background: "var(--brand-primary)", color: "white" }}
          >
            <Check size={16} />
            Confirmar
          </button>
        </div>
      )}

      {/* Confirmar todas */}
      {!editing && total - confirmed.size > 1 && (
        <button
          type="button"
          onClick={confirmarTodas}
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm font-medium border"
          style={{
            borderColor: "var(--brand-primary-muted)",
            color: "var(--brand-primary)",
            background: "var(--brand-primary-light)",
          }}
        >
          {saving
            ? "Salvando..."
            : `Confirmar todas as restantes (${total - confirmed.size})`}
        </button>
      )}

      {/* Navegação entre cards */}
      <div className="flex justify-center gap-1.5 mt-4">
        {transactions.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setCurrent(i)}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              background: confirmed.has(t.id)
                ? "var(--success)"
                : i === current
                ? "var(--brand-primary)"
                : "var(--bg-tertiary)",
              width: i === current ? "20px" : "8px",
            }}
          />
        ))}
      </div>
    </div>
  );
}
