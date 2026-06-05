"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ArrowUpCircle, ArrowDownCircle, Calendar } from "lucide-react";
import { CategoryPicker } from "@/components/transacoes/category-picker";
import { CurrencyInput } from "@/components/ui/currency-input";
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

type Props = {
  isOpen: boolean;
  isCouple: boolean;
  categorias: Categoria[];
  onClose: () => void;
  onSuccess: () => void;
};

function fmt(val: string) {
  const n = parseFloat(val.replace(",", "."));
  if (isNaN(n)) return "";
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toISODate(d: Date) {
  return d.toISOString().split("T")[0];
}

export function NovaTransacaoModal({
  isOpen,
  isCouple,
  categorias,
  onClose,
  onSuccess,
}: Props) {
  const { pushToast } = useToast();

  const [valor, setValor] = useState(0);
  const [tipo, setTipo] = useState<"DESPESA" | "RECEITA">("DESPESA");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [subcategoriaId, setSubcategoriaId] = useState<string | null>(null);
  const [escopo, setEscopo] = useState<"INDIVIDUAL" | "COMPARTILHADA">("INDIVIDUAL");
  const [data, setData] = useState(toISODate(new Date()));
  const [loading, setLoading] = useState(false);

  // Sugestão de categoria
  const [sugestao, setSugestao] = useState<{
    categoriaId: string | null;
    subcategoriaId: string | null;
    confianca: string;
  } | null>(null);
  const [sugerida, setSugerida] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sugestão de criação de regra
  const [pendingRule, setPendingRule] = useState<{
    keyword: string;
    categoriaId: string;
    categoriaName: string;
  } | null>(null);

  const valorRef = useRef<HTMLInputElement>(null);

  // Focus no valor ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => valorRef.current?.focus(), 100);
      // Reset
      setValor(0);
      setTipo("DESPESA");
      setDescricao("");
      setCategoriaId(null);
      setSubcategoriaId(null);
      setEscopo("INDIVIDUAL");
      setData(toISODate(new Date()));
      setSugestao(null);
      setSugerida(false);
      setPendingRule(null);
    }
  }, [isOpen]);

  // Debounce para sugestão de categoria
  const fetchSugestao = useCallback(
    async (text: string) => {
      if (tipo !== "DESPESA" || text.length < 2) {
        setSugestao(null);
        return;
      }
      try {
        const res = await fetch(
          `/api/transactions/suggest-category?descricao=${encodeURIComponent(text)}`
        );
        const data = await res.json();
        setSugestao(data);
        if (data.categoria_id && data.confianca !== "nenhuma") {
          setCategoriaId(data.categoria_id);
          setSubcategoriaId(data.subcategoria_id ?? null);
          setSugerida(true);
        }
      } catch {
        // silently fail
      }
    },
    [tipo]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSugestao(descricao);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [descricao, fetchSugestao]);

  const handleCategorySelect = (catId: string, subId: string | null) => {
    // Se usuário mudou a categoria sugerida, marcar como não-sugerida
    if (catId !== sugestao?.categoriaId) {
      setSugerida(false);
    }
    setCategoriaId(catId);
    setSubcategoriaId(subId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!valor || valor <= 0) {
      pushToast({ type: "error", title: "Valor inválido" });
      return;
    }

    if (!categoriaId) {
      pushToast({
        type: "error",
        title: "Categoria obrigatória",
        description:
          "Escolha a categoria que mais se aproxima, ou crie uma nova.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor,
          tipo,
          escopo: isCouple ? escopo : "INDIVIDUAL",
          categoriaId,
          subcategoriaId: subcategoriaId ?? null,
          descricao,
          data,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Erro ao salvar");
      }

      // Mostrar toast de anomalia (não bloqueante)
      if (json.anomalia) {
        pushToast({
          type: "info",
          title: "Algo diferente este mês?",
          description: `Esse gasto está acima do habitual em ${categorias.find((c) => c.id === categoriaId)?.nome ?? "categoria"}.`,
        });
      }

      // Sugestão de criar regra
      if (json.sugestao_regra && descricao) {
        const catName =
          categorias.find((c) => c.id === categoriaId)?.nome ?? "";
        const keyword = descricao.split(" ")[0].toLowerCase();
        setPendingRule({ keyword, categoriaId: categoriaId!, categoriaName: catName });
        // Não fechar ainda — mostrar toast com ação
        pushToast({
          type: "info",
          title: `Sempre categorizar "${keyword}" como ${catName}?`,
          description: "Você pode confirmar nas configurações.",
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      pushToast({
        type: "error",
        title: "Erro ao salvar transação",
        description: err instanceof Error ? err.message : "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        style={{
          background: "var(--bg-card)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Nova Transação
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-5">
          {/* 1. Valor */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold"
              style={{ color: "var(--text-tertiary)" }}
            >
              VALOR
            </label>
            <CurrencyInput
              value={valor}
              onChange={setValor}
              className="h-14 w-full rounded-[10px] border border-border bg-bg-card py-2 pl-10 pr-3 text-2xl font-bold text-text-primary outline-none transition focus:border-border-focus"
            />
          </div>

          {/* 2. Tipo */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipo("DESPESA")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background:
                  tipo === "DESPESA"
                    ? "var(--danger-light)"
                    : "var(--bg-secondary)",
                color:
                  tipo === "DESPESA"
                    ? "var(--danger)"
                    : "var(--text-tertiary)",
                border:
                  tipo === "DESPESA"
                    ? "1.5px solid var(--danger)"
                    : "1.5px solid transparent",
              }}
            >
              <ArrowDownCircle size={16} />
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setTipo("RECEITA")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background:
                  tipo === "RECEITA"
                    ? "var(--success-light)"
                    : "var(--bg-secondary)",
                color:
                  tipo === "RECEITA"
                    ? "var(--success)"
                    : "var(--text-tertiary)",
                border:
                  tipo === "RECEITA"
                    ? "1.5px solid var(--success)"
                    : "1.5px solid transparent",
              }}
            >
              <ArrowUpCircle size={16} />
              Receita
            </button>
          </div>

          {/* 3. Descrição */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold"
              style={{ color: "var(--text-tertiary)" }}
            >
              DESCRIÇÃO
            </label>
            <input
              type="text"
              placeholder="Ex: iFood açaí, Netflix, Combustível Shell..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-all"
              style={{
                background: "var(--bg-secondary)",
                border: "1.5px solid var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-focus)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            />
            {sugestao?.confianca !== "nenhuma" && sugestao?.confianca && (
              <p
                className="text-xs"
                style={{ color: "var(--brand-primary)" }}
              >
                ✨ Categoria sugerida automaticamente
              </p>
            )}
          </div>

          {/* 4. Categoria */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold"
              style={{ color: "var(--text-tertiary)" }}
            >
              CATEGORIA{" "}
              <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <CategoryPicker
              categorias={categorias}
              selectedCategoriaId={categoriaId}
              selectedSubcategoriaId={subcategoriaId}
              sugerida={sugerida}
              onSelect={handleCategorySelect}
            />
          </div>

          {/* 5+6. Escopo + Data */}
          <div className="flex gap-3">
            {isCouple && (
              <div className="flex flex-col gap-1.5 flex-1">
                <label
                  className="text-xs font-semibold"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  ESCOPO
                </label>
                <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                  <button
                    type="button"
                    onClick={() => setEscopo("INDIVIDUAL")}
                    className="flex-1 py-2 text-xs font-semibold transition-all"
                    style={{
                      background:
                        escopo === "INDIVIDUAL"
                          ? "var(--brand-primary)"
                          : "var(--bg-secondary)",
                      color:
                        escopo === "INDIVIDUAL"
                          ? "white"
                          : "var(--text-tertiary)",
                    }}
                  >
                    Meu
                  </button>
                  <button
                    type="button"
                    onClick={() => setEscopo("COMPARTILHADA")}
                    className="flex-1 py-2 text-xs font-semibold transition-all"
                    style={{
                      background:
                        escopo === "COMPARTILHADA"
                          ? "var(--partner-shared)"
                          : "var(--bg-secondary)",
                      color:
                        escopo === "COMPARTILHADA"
                          ? "white"
                          : "var(--text-tertiary)",
                    }}
                  >
                    Nosso
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5 flex-1">
              <label
                className="text-xs font-semibold"
                style={{ color: "var(--text-tertiary)" }}
              >
                DATA
              </label>
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border)",
                }}
              >
                <Calendar size={14} style={{ color: "var(--text-tertiary)" }} />
                <input
                  type="date"
                  value={data}
                  max={toISODate(new Date())}
                  onChange={(e) => setData(e.target.value)}
                  className="bg-transparent text-sm outline-none flex-1"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
            </div>
          </div>

          {/* Botão salvar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: loading
                ? "var(--bg-tertiary)"
                : "var(--brand-primary)",
              color: loading ? "var(--text-tertiary)" : "white",
            }}
          >
            {loading ? "Salvando..." : "Salvar Transação"}
          </button>
        </form>
      </div>
    </div>
  );
}
