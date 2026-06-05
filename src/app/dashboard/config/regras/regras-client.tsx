"use client";

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Bot,
  User,
  Zap,
  RefreshCw,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
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

type Rule = {
  id: string;
  keyword: string;
  source: "SISTEMA" | "USUARIO";
  hitCount: number;
  coupleId: string | null;
  categoria: { id: string; nome: string; icone?: string | null };
  subcategoria: { id: string; nome: string } | null;
};

function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Icons.Tag;
  const key = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("") as keyof typeof Icons;
  return (Icons[key] as LucideIcon) ?? Icons.Tag;
}

type Props = {
  categorias: Categoria[];
};

export function RegrasClient({ categorias }: Props) {
  const router = useRouter();
  const { pushToast } = useToast();

  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategoriaId, setNewCategoriaId] = useState("");
  const [newSubcategoriaId, setNewSubcategoriaId] = useState("");
  const [saving, setSaving] = useState(false);

  const subcategorias = categorias.find((c) => c.id === newCategoriaId)?.subcategorias ?? [];

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/merchant-rules");
      const data = await res.json();
      setRules(data.rules ?? []);
    } catch {
      pushToast({ type: "error", title: "Erro ao carregar regras" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta regra?")) return;
    try {
      await fetch(`/api/merchant-rules/${id}`, { method: "DELETE" });
      pushToast({ type: "success", title: "Regra removida" });
      fetchRules();
    } catch {
      pushToast({ type: "error", title: "Erro ao remover regra" });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword || !newCategoriaId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/merchant-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: newKeyword,
          categoriaId: newCategoriaId,
          subcategoriaId: newSubcategoriaId || null,
        }),
      });
      if (!res.ok) throw new Error();
      pushToast({ type: "success", title: `Regra "${newKeyword}" criada` });
      setNewKeyword("");
      setNewCategoriaId("");
      setNewSubcategoriaId("");
      setShowForm(false);
      fetchRules();
    } catch {
      pushToast({ type: "error", title: "Erro ao criar regra" });
    } finally {
      setSaving(false);
    }
  };

  const coupleRules = rules.filter((r) => r.coupleId !== null);
  const globalRules = rules.filter((r) => r.coupleId === null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 rounded-lg"
          style={{ color: "var(--text-secondary)" }}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h1
            className="text-xl font-bold"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              color: "var(--text-primary)",
            }}
          >
            Regras de Categorização
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: "var(--brand-primary)", color: "white" }}
        >
          <Plus size={14} />
          Adicionar
        </button>
      </div>

      {/* Info */}
      <div
        className="flex gap-2.5 p-3.5 rounded-xl mb-5"
        style={{ background: "var(--info-light)", border: "1px solid var(--info)" }}
      >
        <Info size={16} style={{ color: "var(--info)", flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs" style={{ color: "var(--info)" }}>
          Essas regras categorizam automaticamente suas transações quando a
          descrição contém a palavra-chave. Quanto mais regras, menos trabalho
          manual.
        </p>
      </div>

      {/* Formulário de nova regra */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl p-4 mb-5 flex flex-col gap-3"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--brand-primary)",
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Nova Regra Manual
          </p>

          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-medium"
              style={{ color: "var(--text-tertiary)" }}
            >
              PALAVRA-CHAVE
            </label>
            <input
              type="text"
              placeholder="Ex: ifood, shell, netflix..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm border outline-none"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                CATEGORIA
              </label>
              <select
                value={newCategoriaId}
                onChange={(e) => {
                  setNewCategoriaId(e.target.value);
                  setNewSubcategoriaId("");
                }}
                className="px-3 py-2 rounded-xl text-sm border outline-none"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="">Selecionar...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {subcategorias.length > 0 && (
              <div className="flex flex-col gap-1 flex-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  SUBCATEGORIA
                </label>
                <select
                  value={newSubcategoriaId}
                  onChange={(e) => setNewSubcategoriaId(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm border outline-none"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Geral</option>
                  {subcategorias.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-xl text-sm border font-medium"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!newKeyword || !newCategoriaId || saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ background: "var(--brand-primary)", color: "white" }}
            >
              {saving ? "Salvando..." : "Criar regra"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw
            size={20}
            className="animate-spin"
            style={{ color: "var(--text-tertiary)" }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Regras do casal */}
          {coupleRules.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <User size={14} style={{ color: "var(--brand-primary)" }} />
                <h2
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--brand-primary)" }}
                >
                  Suas regras personalizadas ({coupleRules.length})
                </h2>
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                {coupleRules.map((rule, i) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    isLast={i === coupleRules.length - 1}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Regras globais */}
          {globalRules.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Bot size={14} style={{ color: "var(--text-tertiary)" }} />
                <h2
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Regras globais do sistema ({globalRules.length})
                </h2>
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                {globalRules.map((rule, i) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    isLast={i === globalRules.length - 1}
                    readOnly
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {rules.length === 0 && (
            <div className="text-center py-8">
              <p
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Nenhuma regra encontrada.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RuleRow({
  rule,
  isLast,
  readOnly,
  onDelete,
}: {
  rule: Rule;
  isLast: boolean;
  readOnly?: boolean;
  onDelete: (id: string) => void;
}) {
  const CatIcon = getIcon(rule.categoria.icone);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        background: "var(--bg-card)",
        borderBottom: !isLast ? "1px solid var(--divider)" : undefined,
      }}
    >
      {/* Ícone */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--brand-primary-light)" }}
      >
        <CatIcon size={14} style={{ color: "var(--brand-primary)" }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {rule.keyword}
          </p>
          {rule.source === "USUARIO" ? (
            <User
              size={10}
              style={{ color: "var(--brand-primary)", flexShrink: 0 }}
            />
          ) : (
            <Bot
              size={10}
              style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
            />
          )}
        </div>
        <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
          {rule.categoria.nome}
          {rule.subcategoria ? ` · ${rule.subcategoria.nome}` : ""}
        </p>
      </div>

      {/* Usos */}
      {rule.hitCount > 0 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Zap size={10} style={{ color: "var(--brand-primary-muted)" }} />
          <span
            className="text-[10px] font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            {rule.hitCount}×
          </span>
        </div>
      )}

      {/* Ação */}
      {!readOnly && (
        <button
          type="button"
          onClick={() => onDelete(rule.id)}
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
