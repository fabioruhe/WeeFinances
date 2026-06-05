"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Plus, TrendingUp, TrendingDown, Wallet, Landmark, BarChart3, Shield, X, Calculator, Calendar } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useToast } from "@/components/ui/toast";
import {
  fetchPatrimonio, listAssets, createAsset, deleteAsset, updateAsset,
  ASSET_TYPE_LABEL, ASSET_TYPE_COLOR, ACTIVE_ASSET_TYPES, isTickerType,
  type PatrimonioSummary, type AssetItem, type AssetType, type CreateAssetInput,
} from "@/lib/clients/patrimonio-client";
import { listContas, type ContaItem } from "@/lib/clients/contas-client";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function fmtDate(d: string | null) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

const DONUT_COLORS = Object.values(ASSET_TYPE_COLOR);

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percentual?: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="rounded-xl px-3 py-2 text-sm shadow"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{name}</p>
      <p style={{ color: "var(--text-secondary)" }}>
        {fmt(value)}{p.percentual !== undefined ? ` · ${p.percentual.toFixed(1)}%` : ""}
      </p>
    </div>
  );
}

function LineTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-sm shadow"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
      <p style={{ color: "var(--brand-primary)" }}>{fmt(payload[0].value)}</p>
    </div>
  );
}

// ─── Novo Ativo Modal ────────────────────────────────────────────────────────

function NovoAtivoModal({ isOpen, onClose, onSuccess, assets }: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assets: AssetItem[];
}) {
  const { pushToast } = useToast();
  const [tipo, setTipo] = useState<AssetType>("ACAO");
  const [ticker, setTicker] = useState("");
  const [nome, setNome] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState(0);
  const [valorAtual, setValorAtual] = useState(0);
  const [valorInvestido, setValorInvestido] = useState(0);
  const [dataAquisicao, setDataAquisicao] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [investContas, setInvestContas] = useState<ContaItem[]>([]);

  // Tickers existentes do usuário
  const existingTickers = [...new Set(
    assets.filter((a) => a.ticker && isTickerType(a.tipo)).map((a) => a.ticker!)
  )].sort();

  useEffect(() => {
    if (isOpen) {
      setTipo("ACAO");
      setTicker("");
      setNome("");
      setInstituicao("");
      setQuantidade("");
      setPrecoUnitario(0);
      setValorAtual(0);
      setValorInvestido(0);
      setDataAquisicao(new Date().toISOString().split("T")[0]);
      listContas().then((res) => {
        if (res.ok) setInvestContas(res.data.contas.filter((c) => c.tipo === "INVESTIMENTO"));
      });
    }
  }, [isOpen]);

  const isTicker = isTickerType(tipo);
  const calcInvestido = isTicker ? (Number(quantidade) || 0) * precoUnitario : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const input: CreateAssetInput = { tipo, data_aquisicao: dataAquisicao };

    if (isTicker) {
      if (!ticker.trim()) { pushToast({ type: "error", title: "Ticker obrigatório" }); setLoading(false); return; }
      if (!instituicao.trim()) { pushToast({ type: "error", title: "Instituição obrigatória" }); setLoading(false); return; }
      if (!Number(quantidade) || Number(quantidade) <= 0) { pushToast({ type: "error", title: "Quantidade inválida" }); setLoading(false); return; }
      if (precoUnitario <= 0) { pushToast({ type: "error", title: "Preço unitário inválido" }); setLoading(false); return; }
      input.ticker = ticker.toUpperCase().trim();
      input.instituicao = instituicao.trim();
      input.quantidade = Number(quantidade);
      input.preco_unitario = precoUnitario;
    } else {
      if (!nome.trim()) { pushToast({ type: "error", title: "Nome obrigatório" }); setLoading(false); return; }
      input.nome = nome.trim();
      input.instituicao = instituicao.trim() || undefined;
      input.valor_atual = valorAtual;
      input.valor_investido = valorInvestido;
    }

    const res = await createAsset(input);
    setLoading(false);
    if (res.ok) {
      onSuccess();
      onClose();
      pushToast({ type: "success", title: "Ativo criado!" });
    } else {
      pushToast({ type: "error", title: res.error });
    }
  };

  if (!isOpen) return null;

  const inputStyle = { background: "var(--bg-secondary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-lg)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Novo Ativo</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--text-tertiary)" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>TIPO DE ATIVO</label>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVE_ASSET_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setTipo(t)}
                  className="py-2 px-2 rounded-xl text-xs font-semibold transition-all text-center"
                  style={{
                    background: tipo === t ? ASSET_TYPE_COLOR[t] : "var(--bg-secondary)",
                    color: tipo === t ? "#fff" : "var(--text-tertiary)",
                    border: tipo === t ? "none" : "1px solid var(--border)",
                  }}>
                  {ASSET_TYPE_LABEL[t].replace(" (CDB, CDI, LCA, LCI)", "")}
                </button>
              ))}
            </div>
          </div>

          {/* Ticker-based fields */}
          {isTicker && (
            <>
              {/* Tickers existentes */}
              {existingTickers.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>SEUS TICKERS</label>
                  <div className="flex flex-wrap gap-1.5">
                    {existingTickers.map((t) => (
                      <button key={t} type="button"
                        onClick={() => setTicker(t)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: ticker === t ? "var(--brand-primary)" : "var(--bg-secondary)",
                          color: ticker === t ? "#fff" : "var(--text-secondary)",
                          border: "1px solid var(--border)",
                        }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
                  TICKER <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input type="text" value={ticker} placeholder="Ex: PETR4, IVVB11"
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none uppercase"
                  style={inputStyle} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
                  INSTITUIÇÃO <span style={{ color: "var(--error)" }}>*</span>
                </label>
                {investContas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {investContas.map((c) => (
                      <button key={c.id} type="button"
                        onClick={() => setInstituicao(c.nome)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: instituicao === c.nome ? c.cor : "var(--bg-secondary)",
                          color: instituicao === c.nome ? "#fff" : "var(--text-secondary)",
                          border: "1px solid var(--border)",
                        }}>
                        {c.nome}
                      </button>
                    ))}
                  </div>
                )}
                <input type="text" value={instituicao} placeholder="Ex: XP, Nubank, Inter"
                  onChange={(e) => setInstituicao(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
                    QUANTIDADE <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input type="number" step="any" min="0" value={quantidade} placeholder="100"
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
                    PREÇO UNITÁRIO <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <CurrencyInput value={precoUnitario} onChange={setPrecoUnitario} />
                </div>
              </div>

              {/* Preview valor investido */}
              {calcInvestido > 0 && (
                <div className="rounded-xl p-3" style={{ background: "var(--bg-secondary)" }}>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Valor investido</p>
                  <p className="text-lg font-bold" style={{ color: "var(--brand-primary)" }}>{fmt(calcInvestido)}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {quantidade} × {fmt(precoUnitario)}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Non-ticker fields */}
          {!isTicker && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
                  NOME <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input type="text" value={nome} placeholder="Ex: CDB Nubank 120% CDI"
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>INSTITUIÇÃO</label>
                {investContas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {investContas.map((c) => (
                      <button key={c.id} type="button"
                        onClick={() => setInstituicao(c.nome)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: instituicao === c.nome ? c.cor : "var(--bg-secondary)",
                          color: instituicao === c.nome ? "#fff" : "var(--text-secondary)",
                          border: "1px solid var(--border)",
                        }}>
                        {c.nome}
                      </button>
                    ))}
                  </div>
                )}
                <input type="text" value={instituicao} placeholder="Ex: Nubank, XP, Inter"
                  onChange={(e) => setInstituicao(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
                    VALOR INVESTIDO <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <CurrencyInput value={valorInvestido} onChange={setValorInvestido} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
                    VALOR ATUAL <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <CurrencyInput value={valorAtual} onChange={setValorAtual} />
                </div>
              </div>
            </>
          )}

          {/* Data de aquisição */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
              DATA DE AQUISIÇÃO <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
              <Calendar size={14} style={{ color: "var(--text-tertiary)" }} />
              <input type="date" value={dataAquisicao}
                onChange={(e) => setDataAquisicao(e.target.value)}
                className="bg-transparent text-sm outline-none flex-1"
                style={{ color: "var(--text-primary)" }} />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: loading ? "var(--bg-tertiary)" : "var(--brand-primary)",
              color: loading ? "var(--text-tertiary)" : "white",
            }}>
            {loading ? "Salvando..." : "Criar Ativo"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PatrimonioClient() {
  const { pushToast } = useToast();
  const [summary, setSummary] = useState<PatrimonioSummary | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);

  const load = useCallback(async () => {
    const [sRes, aRes] = await Promise.all([fetchPatrimonio(), listAssets()]);
    if (sRes.ok) setSummary(sRes.data);
    if (aRes.ok) setAssets(aRes.data.assets);
    if (!sRes.ok || !aRes.ok) pushToast({ type: "error", title: "Erro ao carregar dados" });
    setLoading(false);
  }, [pushToast]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const res = await deleteAsset(id);
    if (res.ok) {
      load();
      pushToast({ type: "success", title: "Ativo removido" });
    }
  };

  const handleInlineUpdate = async (id: string) => {
    if (editValue < 0) return;
    const res = await updateAsset(id, { valor_atual: editValue });
    if (res.ok) {
      setEditingId(null);
      load();
    }
  };

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Patrimônio
        </h1>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link href="/dashboard/patrimonio/preco-medio"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
            <Calculator size={16} /> Preço Médio
          </Link>
          <Link href="/dashboard/patrimonio/dividendos"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
            <BarChart3 size={16} /> Proventos
          </Link>
          <Link href="/dashboard/patrimonio/liberdade"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
            <Shield size={16} /> Liberdade
          </Link>
          <Link href="/dashboard/patrimonio/projecao"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
            <TrendingUp size={16} /> Projeção
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard icon={<Wallet size={20} />} label="Total Ativos" value={fmt(summary.totalAtivos)} color="var(--brand-primary)" />
          <SummaryCard icon={<Landmark size={20} />} label="Patrimônio Líquido" value={fmt(summary.patrimonioLiquido)}
            sub={`${fmtPct(summary.variacaoPct)} vs mês anterior`}
            color={summary.variacao >= 0 ? "var(--success)" : "var(--error)"} />
          <SummaryCard icon={summary.variacao >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            label="Dívidas" value={fmt(summary.totalDividas)} color="var(--error)" />
        </div>
      )}

      {/* Composition + Evolution */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Donut */}
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
              Composição por Tipo
            </h3>
            {summary.porTipo.length === 0 ? (
              <EmptyState text="Nenhum ativo cadastrado" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={summary.porTipo} dataKey="valor" nameKey="tipo"
                    cx="40%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                    {summary.porTipo.map((entry, i) => (
                      <Cell key={i} fill={ASSET_TYPE_COLOR[entry.tipo as AssetType] ?? DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend layout="vertical" align="right" verticalAlign="middle"
                    formatter={(value: string) => ASSET_TYPE_LABEL[value as AssetType] ?? value} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Evolution Line */}
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
              Evolução 12 meses
            </h3>
            {summary.evolucao12m.every((e) => e.valor === 0) ? (
              <EmptyState text="Sem dados de evolução" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={summary.evolucao12m}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<LineTooltip />} />
                  <Line type="monotone" dataKey="valor" stroke="var(--brand-primary)"
                    strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Assets List */}
      <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Ativos ({assets.length})
          </h3>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--brand-primary)", color: "#fff" }}>
            <Plus size={16} /> Novo Ativo
          </button>
        </div>

        {assets.length === 0 ? (
          <EmptyState text="Nenhum ativo cadastrado ainda" />
        ) : (
          <div className="space-y-2">
            {assets.map((a) => {
              const isTk = isTickerType(a.tipo);
              const displayName = isTk ? a.ticker : (a.nome || a.ticker || "Sem nome");
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--bg-secondary)" }}>
                  <div className="w-2 h-8 rounded-full" style={{ background: ASSET_TYPE_COLOR[a.tipo] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {displayName}
                      {isTk && a.nome && a.nome !== a.ticker && (
                        <span className="ml-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>({a.nome})</span>
                      )}
                      {!isTk && a.ticker && (
                        <span className="ml-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>({a.ticker})</span>
                      )}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {ASSET_TYPE_LABEL[a.tipo]}{a.instituicao ? ` · ${a.instituicao}` : ""}
                      {a.quantidade ? ` · ${a.quantidade} un` : ""}
                      {a.dataAquisicao ? ` · ${fmtDate(a.dataAquisicao)}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    {editingId === a.id ? (
                      <div className="flex gap-1 items-center">
                        <div className="w-36">
                          <CurrencyInput value={editValue} onChange={setEditValue} />
                        </div>
                        <button onClick={() => handleInlineUpdate(a.id)} className="text-xs px-2 py-1 rounded"
                          style={{ background: "var(--brand-primary)", color: "#fff" }}>OK</button>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold cursor-pointer" style={{ color: "var(--text-primary)" }}
                        onClick={() => { setEditingId(a.id); setEditValue(a.valorAtual); }}>
                        {fmt(a.valorAtual)}
                      </p>
                    )}
                    <p className="text-xs" style={{ color: a.rentabilidade >= 0 ? "var(--success)" : "var(--error)" }}>
                      {a.rentabilidade >= 0 ? "+" : ""}{fmt(a.rentabilidade)} ({fmtPct(a.rentabilidadePct)})
                    </p>
                  </div>
                  <button onClick={() => handleDelete(a.id)} className="text-xs px-2 py-1 rounded"
                    style={{ color: "var(--error)" }}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <NovoAtivoModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={load} assets={assets} />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl" style={{ height: 160, background: "var(--bg-secondary)" }}>
      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{text}</p>
    </div>
  );
}
