"use client";

import { useState, useEffect, useCallback } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Categoria = {
  id: string;
  nome: string;
  icone?: string | null;
};

type Transaction = {
  id: string;
  valor: string | number;
  tipo: "RECEITA" | "DESPESA";
  escopo: "INDIVIDUAL" | "COMPARTILHADA";
  descricao: string | null;
  data: string;
  reviewed: boolean;
  anomalia: boolean;
  categoriaFonte: string | null;
  userId: string;
  categoria: { id: string; nome: string; icone?: string | null } | null;
  subcategoria: { id: string; nome: string } | null;
};

type Filtros = {
  mes: string;
  escopo: "todos" | "meu" | "compartilhado";
  categoriaId: string;
  apenasNaoRevisados: boolean;
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
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function mesLabel(m: string) {
  const [y, mo] = m.split("-");
  return new Date(parseInt(y), parseInt(mo) - 1, 1).toLocaleDateString(
    "pt-BR",
    { month: "long", year: "numeric" }
  );
}

type Props = {
  currentUserId: string;
  isCouple: boolean;
  categorias: Categoria[];
  onDelete?: (id: string) => void;
};

export function ListaTransacoes({
  currentUserId,
  isCouple,
  categorias,
}: Props) {
  const { pushToast } = useToast();

  const now = new Date();
  const [filtros, setFiltros] = useState<Filtros>({
    mes: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    escopo: "todos",
    categoriaId: "",
    apenasNaoRevisados: false,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mes: filtros.mes,
        escopo: filtros.escopo,
        limit: String(LIMIT),
        offset: String(offset),
      });
      if (filtros.categoriaId) params.set("categoria", filtros.categoriaId);
      if (filtros.apenasNaoRevisados) params.set("reviewed", "false");

      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions ?? []);
      setTotal(data.total ?? 0);
    } catch {
      pushToast({ type: "error", title: "Erro ao carregar transações" });
    } finally {
      setLoading(false);
    }
  }, [filtros, offset, pushToast]);

  useEffect(() => {
    setOffset(0);
  }, [filtros]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Expor refresh para componente pai
  useEffect(() => {
    const handler = () => fetchTransactions();
    window.addEventListener("wee:refresh-transactions", handler);
    return () => window.removeEventListener("wee:refresh-transactions", handler);
  }, [fetchTransactions]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta transação?")) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      pushToast({ type: "success", title: "Transação excluída" });
      fetchTransactions();
    } catch {
      pushToast({ type: "error", title: "Erro ao excluir" });
    }
  };

  const prevMes = () => {
    const [y, m] = filtros.mes.split("-").map(Number);
    const prev = new Date(y, m - 2, 1);
    setFiltros((f) => ({
      ...f,
      mes: `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`,
    }));
  };

  const nextMes = () => {
    const [y, m] = filtros.mes.split("-").map(Number);
    const next = new Date(y, m, 1);
    if (next > now) return;
    setFiltros((f) => ({
      ...f,
      mes: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
    }));
  };

  const totalReceitas = transactions
    .filter((t) => t.tipo === "RECEITA")
    .reduce((s, t) => s + Number(t.valor), 0);

  const totalDespesas = transactions
    .filter((t) => t.tipo === "DESPESA")
    .reduce((s, t) => s + Number(t.valor), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Navegação de mês */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevMes}
            className="p-1.5 rounded-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={18} />
          </button>
          <span
            className="text-sm font-semibold capitalize"
            style={{ color: "var(--text-primary)" }}
          >
            {mesLabel(filtros.mes)}
          </span>
          <button
            type="button"
            onClick={nextMes}
            className="p-1.5 rounded-lg"
            style={{ color: "var(--text-secondary)" }}
            disabled={
              filtros.mes >=
              `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
            }
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Resumo do mês */}
        <div className="flex gap-3">
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "var(--success-light)" }}
          >
            <ArrowUpCircle size={14} style={{ color: "var(--success)" }} />
            <div>
              <p className="text-[10px]" style={{ color: "var(--success)" }}>
                Receitas
              </p>
              <p
                className="text-sm font-bold value-display"
                style={{ color: "var(--success)" }}
              >
                {fmt(totalReceitas)}
              </p>
            </div>
          </div>
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "var(--danger-light)" }}
          >
            <ArrowDownCircle size={14} style={{ color: "var(--danger)" }} />
            <div>
              <p className="text-[10px]" style={{ color: "var(--danger)" }}>
                Despesas
              </p>
              <p
                className="text-sm font-bold value-display"
                style={{ color: "var(--danger)" }}
              >
                {fmt(totalDespesas)}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros de escopo + categoria */}
        <div className="flex gap-2 flex-wrap">
          {isCouple && (
            <div className="flex rounded-full overflow-hidden border text-xs" style={{ borderColor: "var(--border)" }}>
              {(["todos", "meu", "compartilhado"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFiltros((f) => ({ ...f, escopo: s }))}
                  className="px-3 py-1.5 font-medium transition-all capitalize"
                  style={{
                    background:
                      filtros.escopo === s
                        ? "var(--brand-primary)"
                        : "transparent",
                    color:
                      filtros.escopo === s
                        ? "white"
                        : "var(--text-secondary)",
                  }}
                >
                  {s === "todos" ? "Todos" : s === "meu" ? "Meus" : "Nossos"}
                </button>
              ))}
            </div>
          )}

          <select
            value={filtros.categoriaId}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, categoriaId: e.target.value }))
            }
            className="flex-1 px-3 py-1.5 rounded-full text-xs border outline-none min-w-0"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro revisão */}
        <button
          type="button"
          onClick={() =>
            setFiltros((f) => ({
              ...f,
              apenasNaoRevisados: !f.apenasNaoRevisados,
            }))
          }
          className="flex items-center gap-2 text-xs font-medium self-start px-3 py-1.5 rounded-full border transition-all"
          style={{
            background: filtros.apenasNaoRevisados
              ? "var(--warning-light)"
              : "transparent",
            borderColor: filtros.apenasNaoRevisados
              ? "var(--warning)"
              : "var(--border)",
            color: filtros.apenasNaoRevisados
              ? "var(--warning)"
              : "var(--text-tertiary)",
          }}
        >
          <Eye size={12} />
          Pendentes de revisão
        </button>
      </div>

      {/* Lista */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw
              size={20}
              className="animate-spin"
              style={{ color: "var(--text-tertiary)" }}
            />
          </div>
        ) : transactions.length === 0 ? (
          <div
            className="text-center py-12 px-4"
            style={{ background: "var(--bg-card)" }}
          >
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Nenhuma transação encontrada
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              Use o botão + para adicionar
            </p>
          </div>
        ) : (
          <div style={{ background: "var(--bg-card)" }}>
            {transactions.map((tx, i) => {
              const CatIcon = getIcon(tx.categoria?.icone);
              const isMine = tx.userId === currentUserId;

              return (
                <div
                  key={tx.id}
                  className="group flex items-center gap-3 px-4 py-3"
                  style={{
                    borderBottom:
                      i < transactions.length - 1
                        ? "1px solid var(--divider)"
                        : undefined,
                  }}
                >
                  {/* Ícone categoria */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: tx.tipo === "RECEITA"
                        ? "var(--success-light)"
                        : "var(--brand-primary-light)",
                    }}
                  >
                    <CatIcon
                      size={16}
                      style={{
                        color: tx.tipo === "RECEITA"
                          ? "var(--success)"
                          : "var(--brand-primary)",
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {tx.descricao ?? tx.categoria?.nome ?? "—"}
                      </p>

                      {/* Badges */}
                      {tx.categoriaFonte === "SISTEMA" ||
                      tx.categoriaFonte === "USUARIO" ? (
                        <span title="Categorizado automaticamente">
                          <Bot
                            size={12}
                            style={{ color: "var(--brand-primary)" }}
                          />
                        </span>
                      ) : null}

                      {tx.anomalia && (
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                          style={{
                            background: "var(--warning-light)",
                            color: "var(--warning)",
                          }}
                        >
                          <AlertTriangle size={8} />
                          verificar
                        </span>
                      )}

                      {!tx.reviewed &&
                        (tx.categoriaFonte === "SISTEMA" ||
                          tx.categoriaFonte === "USUARIO") && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full"
                            style={{
                              background: "var(--bg-tertiary)",
                              color: "var(--text-tertiary)",
                            }}
                          >
                            não conferido
                          </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {tx.categoria?.nome ?? "Sem categoria"}
                        {tx.subcategoria ? ` · ${tx.subcategoria.nome}` : ""}
                      </p>
                      <span style={{ color: "var(--divider)" }}>·</span>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {fmtData(tx.data)}
                      </p>

                      {/* Badge escopo */}
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          background:
                            tx.escopo === "COMPARTILHADA"
                              ? "rgba(124, 109, 175, 0.12)"
                              : "var(--bg-secondary)",
                          color:
                            tx.escopo === "COMPARTILHADA"
                              ? "var(--partner-shared)"
                              : isMine
                              ? "var(--partner-a)"
                              : "var(--partner-b)",
                        }}
                      >
                        {tx.escopo === "COMPARTILHADA" ? "Nosso" : "Meu"}
                      </span>
                    </div>
                  </div>

                  {/* Valor + ações */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p
                      className="value-display text-sm font-bold"
                      style={{
                        color:
                          tx.tipo === "RECEITA"
                            ? "var(--success)"
                            : "var(--text-primary)",
                      }}
                    >
                      {tx.tipo === "RECEITA" ? "+" : "-"}
                      {fmt(tx.valor)}
                    </p>

                    {isMine && (
                      <button
                        type="button"
                        onClick={() => handleDelete(tx.id)}
                        className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--danger)" }}
                      >
                        excluir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paginação */}
      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border disabled:opacity-40"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={12} />
            Anterior
          </button>
          <p
            className="text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            {offset + 1}–{Math.min(offset + LIMIT, total)} de {total}
          </p>
          <button
            type="button"
            disabled={offset + LIMIT >= total}
            onClick={() => setOffset((o) => o + LIMIT)}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border disabled:opacity-40"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Próximo
            <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
