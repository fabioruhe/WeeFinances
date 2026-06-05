"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ClipboardCheck } from "lucide-react";
import { ListaTransacoes } from "@/components/transacoes/lista-transacoes";
import { NovaTransacaoModal } from "@/components/transacoes/nova-transacao-modal";

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
  userId: string;
  isCouple: boolean;
  categorias: Categoria[];
};

export function TransacoesClient({ userId, isCouple, categorias }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleSuccess = () => {
    window.dispatchEvent(new Event("wee:refresh-transactions"));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              color: "var(--text-primary)",
            }}
          >
            Transações
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Controle seus gastos e receitas
          </p>
        </div>

        <Link
          href="/dashboard/transacoes/revisao"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
          style={{
            borderColor: "var(--brand-primary)",
            color: "var(--brand-primary)",
            background: "var(--brand-primary-light)",
          }}
        >
          <ClipboardCheck size={14} />
          Revisar
        </Link>
      </div>

      {/* Lista */}
      <ListaTransacoes
        currentUserId={userId}
        isCouple={isCouple}
        categorias={categorias}
      />

      {/* FAB */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40 transition-transform active:scale-95"
        style={{
          background: "var(--brand-primary)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <Plus size={24} color="white" />
      </button>

      {/* Modal */}
      <NovaTransacaoModal
        isOpen={modalOpen}
        isCouple={isCouple}
        categorias={categorias}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
