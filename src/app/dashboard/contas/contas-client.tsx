"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Wallet, Star, Pencil, Trash2, X, Check, Building2,
} from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useToast } from "@/components/ui/toast";
import {
  listContas, createConta, updateConta, deleteConta,
  CONTA_TIPO_LABEL, BANCOS_POPULARES, PALETA_CORES,
  type ContaItem, type BankAccountTipo, type CreateContaInput,
} from "@/lib/clients/contas-client";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TIPOS: BankAccountTipo[] = [
  "CORRENTE", "POUPANCA", "INVESTIMENTO", "CARTEIRA_DIGITAL", "OUTRO",
];

// ─── Main Component ──────────────────────────────────────────────────────────

export function ContasClient() {
  const { pushToast } = useToast();
  const [contas, setContas] = useState<ContaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await listContas();
    if (res.ok) setContas(res.data.contas);
    else pushToast({ type: "error", title: "Erro ao carregar contas" });
    setLoading(false);
  }, [pushToast]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const res = await deleteConta(id);
    if (res.ok) {
      setDeletingId(null);
      load();
      pushToast({ type: "success", title: "Conta removida" });
    } else {
      pushToast({ type: "error", title: res.error });
    }
  };

  const handleSetPadrao = async (id: string) => {
    const res = await updateConta(id, { padrao: true });
    if (res.ok) {
      load();
      pushToast({ type: "success", title: "Conta principal definida" });
    }
  };

  const saldoTotal = contas.reduce((sum, c) => sum + (c.saldo ?? 0), 0);
  const temSaldo = contas.some((c) => c.saldo !== null && c.saldo > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
          style={{ borderColor: "var(--brand-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-10 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold italic"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            Contas Bancarias
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Organize suas contas em um so lugar
          </p>
        </div>
        <button
          onClick={() => { setEditingConta(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all"
          style={{ background: "var(--brand-primary)", color: "#fff" }}>
          <Plus size={16} /> Nova Conta
        </button>
      </div>

      {/* Summary Card */}
      {contas.length > 0 && temSaldo && (
        <div className="rounded-2xl p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={18} style={{ color: "var(--brand-primary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              Saldo total
            </span>
          </div>
          <p className="text-2xl font-bold italic"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            {fmt(saldoTotal)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            {contas.length} {contas.length === 1 ? "conta cadastrada" : "contas cadastradas"}
          </p>
        </div>
      )}

      {/* Empty State */}
      {contas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "var(--brand-primary-light)" }}>
            <Building2 size={28} style={{ color: "var(--brand-primary)" }} />
          </div>
          <div>
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Nenhuma conta cadastrada
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              Adicione suas contas bancarias para organizar suas financas
            </p>
          </div>
          <button
            onClick={() => { setEditingConta(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold mt-2 active:scale-95 transition-all"
            style={{ background: "var(--brand-primary)", color: "#fff" }}>
            <Plus size={16} /> Adicionar primeira conta
          </button>
        </div>
      )}

      {/* Accounts List */}
      {contas.length > 0 && (
        <div className="space-y-3">
          {contas.map((c) => (
            <div key={c.id} className="rounded-2xl p-4 relative"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
              <div className="flex items-center gap-3">
                {/* Color bar */}
                <div className="w-1.5 h-12 rounded-full shrink-0" style={{ background: c.cor }} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {c.nome}
                    </p>
                    {c.padrao && (
                      <Star size={14} fill="var(--brand-accent)" style={{ color: "var(--brand-accent)" }} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {c.banco}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${c.cor}18`,
                        color: c.cor,
                      }}>
                      {CONTA_TIPO_LABEL[c.tipo]}
                    </span>
                  </div>
                </div>

                {/* Balance + Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {c.saldo !== null && (
                    <p className="text-sm font-bold italic"
                      style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                      {fmt(c.saldo)}
                    </p>
                  )}

                  {deletingId === c.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(c.id)}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
                        Sim
                      </button>
                      <button onClick={() => setDeletingId(null)}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ color: "var(--text-tertiary)" }}>
                        Nao
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5">
                      {!c.padrao && (
                        <button onClick={() => handleSetPadrao(c.id)}
                          className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                          title="Definir como principal">
                          <Star size={14} style={{ color: "var(--text-tertiary)" }} />
                        </button>
                      )}
                      <button onClick={() => { setEditingConta(c); setShowForm(true); }}
                        className="p-1.5 rounded-lg transition-opacity hover:opacity-70">
                        <Pencil size={14} style={{ color: "var(--text-tertiary)" }} />
                      </button>
                      <button onClick={() => setDeletingId(c.id)}
                        className="p-1.5 rounded-lg transition-opacity hover:opacity-70">
                        <Trash2 size={14} style={{ color: "var(--text-tertiary)" }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <ContaFormModal
          conta={editingConta}
          onClose={() => { setShowForm(false); setEditingConta(null); }}
          onSaved={() => { setShowForm(false); setEditingConta(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── Form Modal ──────────────────────────────────────────────────────────────

function ContaFormModal({ conta, onClose, onSaved }: {
  conta: ContaItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { pushToast } = useToast();
  const isEdit = !!conta;

  const [banco, setBanco] = useState(conta?.banco ?? "");
  const [cor, setCor] = useState(conta?.cor ?? "#8B5CF6");
  const [nome, setNome] = useState(conta?.nome ?? "");
  const [tipo, setTipo] = useState<BankAccountTipo>(conta?.tipo ?? "CORRENTE");
  const [saldo, setSaldo] = useState(conta?.saldo ?? 0);
  const [padrao, setPadrao] = useState(conta?.padrao ?? false);
  const [customBanco, setCustomBanco] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check if current banco is not in BANCOS_POPULARES
  useEffect(() => {
    if (conta && !BANCOS_POPULARES.find((b) => b.nome === conta.banco)) {
      setCustomBanco(true);
    }
  }, [conta]);

  const handleBancoSelect = (bancoNome: string, bancoCor: string) => {
    setBanco(bancoNome);
    setCor(bancoCor);
    setCustomBanco(false);
    if (!nome || nome === `Conta Corrente ${banco}` || nome === `${CONTA_TIPO_LABEL[tipo]} ${banco}`) {
      setNome(`${CONTA_TIPO_LABEL[tipo]} ${bancoNome}`);
    }
  };

  const handleTipoChange = (newTipo: BankAccountTipo) => {
    setTipo(newTipo);
    if (banco && (!nome || nome === `${CONTA_TIPO_LABEL[tipo]} ${banco}`)) {
      setNome(`${CONTA_TIPO_LABEL[newTipo]} ${banco}`);
    }
  };

  const handleSubmit = async () => {
    if (!banco.trim()) {
      pushToast({ type: "error", title: "Selecione ou digite o banco" });
      return;
    }
    if (!nome.trim()) {
      pushToast({ type: "error", title: "Informe o nome da conta" });
      return;
    }

    setSaving(true);
    const input: CreateContaInput = {
      nome: nome.trim(),
      tipo,
      banco: banco.trim(),
      cor,
      saldo: saldo > 0 ? saldo : null,
      padrao,
    };

    const res = isEdit
      ? await updateConta(conta.id, input)
      : await createConta(input);

    setSaving(false);

    if (res.ok) {
      pushToast({ type: "success", title: isEdit ? "Conta atualizada!" : "Conta criada!" });
      onSaved();
    } else {
      pushToast({ type: "error", title: res.error });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-lg flex flex-col max-h-[92dvh] rounded-t-3xl md:rounded-2xl"
        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-lg)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            {isEdit ? "Editar Conta" : "Nova Conta"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--text-tertiary)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

          {/* Bank Selector */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-tertiary)" }}>
              BANCO
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BANCOS_POPULARES.map((b) => (
                <button
                  key={b.nome}
                  type="button"
                  onClick={() => handleBancoSelect(b.nome, b.cor)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-center transition-all active:scale-95"
                  style={{
                    background: banco === b.nome && !customBanco
                      ? `${b.cor}15`
                      : "var(--bg-secondary)",
                    border: banco === b.nome && !customBanco
                      ? `2px solid ${b.cor}`
                      : "2px solid transparent",
                  }}>
                  <div className="w-6 h-6 rounded-full" style={{ background: b.cor }} />
                  <span className="text-[10px] font-medium leading-tight truncate w-full"
                    style={{ color: banco === b.nome && !customBanco ? b.cor : "var(--text-secondary)" }}>
                    {b.nome}
                  </span>
                </button>
              ))}
              {/* Custom option */}
              <button
                type="button"
                onClick={() => { setCustomBanco(true); setBanco(""); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-center transition-all active:scale-95"
                style={{
                  background: customBanco ? "var(--brand-primary-light)" : "var(--bg-secondary)",
                  border: customBanco ? "2px solid var(--brand-primary)" : "2px solid transparent",
                }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "var(--bg-tertiary)" }}>
                  <Plus size={12} style={{ color: "var(--text-tertiary)" }} />
                </div>
                <span className="text-[10px] font-medium leading-tight"
                  style={{ color: customBanco ? "var(--brand-primary)" : "var(--text-secondary)" }}>
                  Outro
                </span>
              </button>
            </div>

            {/* Custom banco input */}
            {customBanco && (
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  value={banco}
                  onChange={(e) => {
                    setBanco(e.target.value);
                    if (!nome) setNome(`${CONTA_TIPO_LABEL[tipo]} ${e.target.value}`);
                  }}
                  placeholder="Nome do banco"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1.5px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
                <div>
                  <span className="text-[10px] font-medium mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>
                    Cor
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PALETA_CORES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCor(c)}
                        className="w-7 h-7 rounded-full transition-all"
                        style={{
                          background: c,
                          outline: cor === c ? `2px solid ${c}` : "none",
                          outlineOffset: "2px",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Name */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>
              NOME DA CONTA
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Conta Corrente Nubank"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--bg-secondary)",
                border: "1.5px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Account Type */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>
              TIPO
            </label>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTipoChange(t)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: tipo === t ? "var(--brand-primary-light)" : "var(--bg-secondary)",
                    color: tipo === t ? "var(--brand-primary)" : "var(--text-tertiary)",
                    border: tipo === t ? "1.5px solid var(--brand-primary-muted)" : "1.5px solid transparent",
                  }}>
                  {CONTA_TIPO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Balance (optional) */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>
              SALDO ATUAL <span className="font-normal">(opcional)</span>
            </label>
            <CurrencyInput value={saldo} onChange={setSaldo} />
          </div>

          {/* Default toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className="w-10 h-6 rounded-full relative transition-all"
              style={{
                background: padrao ? "var(--brand-primary)" : "var(--bg-tertiary)",
              }}
              onClick={() => setPadrao(!padrao)}>
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm"
                style={{ left: padrao ? 20 : 4 }}
              />
            </div>
            <div>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Conta principal
              </span>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Onde sua renda principal cai
              </p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-all"
            style={{ background: "var(--brand-primary)", color: "white" }}>
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Check size={16} />
            )}
            {saving ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar conta"}
          </button>
        </div>
      </div>
    </div>
  );
}
