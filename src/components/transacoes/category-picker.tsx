"use client";

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Check, ChevronDown } from "lucide-react";

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
  categorias: Categoria[];
  selectedCategoriaId: string | null;
  selectedSubcategoriaId: string | null;
  sugerida?: boolean;
  onSelect: (categoriaId: string, subcategoriaId: string | null) => void;
};

function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Icons.Tag;
  const key = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("") as keyof typeof Icons;
  return (Icons[key] as LucideIcon) ?? Icons.Tag;
}

export function CategoryPicker({
  categorias,
  selectedCategoriaId,
  selectedSubcategoriaId,
  sugerida,
  onSelect,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Auto-expand a categoria selecionada
  useEffect(() => {
    if (selectedCategoriaId) {
      setExpanded(selectedCategoriaId);
    }
  }, [selectedCategoriaId]);

  const selectedCat = categorias.find((c) => c.id === selectedCategoriaId);

  return (
    <div className="flex flex-col gap-2">
      {/* Grid de categorias */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {categorias.map((cat) => {
          const Icon = getIcon(cat.icone);
          const isSelected = cat.id === selectedCategoriaId;
          const isExpanded = cat.id === expanded;

          return (
            <div key={cat.id} className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  const nextExpanded = isExpanded ? null : cat.id;
                  setExpanded(nextExpanded);
                  if (!isSelected) {
                    onSelect(cat.id, null);
                  }
                }}
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all"
                style={{
                  background: isSelected
                    ? "var(--brand-primary-light)"
                    : "var(--bg-secondary)",
                  borderColor: isSelected
                    ? "var(--brand-primary)"
                    : "transparent",
                  color: isSelected
                    ? "var(--brand-primary)"
                    : "var(--text-secondary)",
                }}
              >
                <Icon size={20} strokeWidth={1.8} />
                <span className="text-[10px] font-medium text-center leading-tight">
                  {cat.nome}
                </span>
                {isSelected && sugerida && (
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "var(--brand-primary)",
                      color: "white",
                    }}
                  >
                    sugerido ✨
                  </span>
                )}
                {cat.subcategorias.length > 0 && (
                  <ChevronDown
                    size={10}
                    style={{
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      opacity: 0.6,
                    }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Subcategorias em accordion */}
      {expanded && selectedCat && selectedCat.subcategorias.length > 0 && (
        <div
          className="rounded-xl p-3 flex flex-wrap gap-2"
          style={{ background: "var(--bg-secondary)" }}
        >
          <p
            className="w-full text-xs font-semibold mb-1"
            style={{ color: "var(--text-tertiary)" }}
          >
            Subcategoria (opcional)
          </p>

          {/* Chip "Nenhuma" */}
          <button
            type="button"
            onClick={() => onSelect(expanded, null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={{
              background:
                !selectedSubcategoriaId ? "var(--brand-primary)" : "var(--bg-card)",
              borderColor:
                !selectedSubcategoriaId ? "var(--brand-primary)" : "var(--border)",
              color: !selectedSubcategoriaId ? "white" : "var(--text-secondary)",
            }}
          >
            {!selectedSubcategoriaId && <Check size={10} />}
            Geral
          </button>

          {selectedCat.subcategorias.map((sub) => {
            const isSubSelected = sub.id === selectedSubcategoriaId;
            const SubIcon = getIcon(sub.icone);
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelect(expanded, sub.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={{
                  background: isSubSelected
                    ? "var(--brand-primary)"
                    : "var(--bg-card)",
                  borderColor: isSubSelected
                    ? "var(--brand-primary)"
                    : "var(--border)",
                  color: isSubSelected ? "white" : "var(--text-secondary)",
                }}
              >
                {isSubSelected && <Check size={10} />}
                <SubIcon size={11} strokeWidth={2} />
                {sub.nome}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
