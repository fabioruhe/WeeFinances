"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession } from "next-auth/react";
import { OnboardingStepper } from "@/components/onboarding/stepper";

type ContextData = {
  coupleMode: boolean;
  coupleStatus: "ATIVO" | "PENDENTE" | null;
};

function formatCurrency(value: string) {
  const num = value.replace(/\D/g, "");
  if (!num) return "";
  return (Number(num) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrency(formatted: string): number {
  return Number(formatted.replace(/\./g, "").replace(",", "."));
}

function RendaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParm = searchParams.get("mode");

  const [context, setContext] = useState<ContextData | null>(null);
  const [valorFormatted, setValorFormatted] = useState("");
  const [tipo, setTipo] = useState<"FIXO" | "VARIAVEL">("FIXO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/onboarding/context")
      .then((r) => r.json())
      .then((d) => setContext({ coupleMode: d.coupleMode, coupleStatus: d.coupleStatus }))
      .catch(() => setContext({ coupleMode: false, coupleStatus: null }));
  }, []);

  // Determina o modo real: URL param tem precedência (para quem "pulou" o convite)
  const effectiveCoupleMode = modeParm === "solo" ? false : (context?.coupleMode ?? false);
  const totalSteps = effectiveCoupleMode ? 5 : 4;
  const currentStep = effectiveCoupleMode ? 4 : 3;

  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    setValorFormatted(formatCurrency(raw));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valor = parseCurrency(valorFormatted);

    if (!valor || valor <= 0) {
      setError("Informe um valor válido para sua renda.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor, tipo }),
      });

      if (!res.ok) {
        setError("Não foi possível salvar. Tente novamente.");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.coupleMode && modeParm !== "solo") {
        // Modo casal ativo → vai para divisão
        router.push("/onboarding/divisao");
      } else {
        // Modo solo → completa onboarding
        const completeRes = await fetch("/api/onboarding/complete", { method: "POST" });
        if (!completeRes.ok) {
          setError("Erro ao finalizar. Tente novamente.");
          setLoading(false);
          return;
        }
        await getSession(); // força refresh do JWT cookie
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Erro de rede. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <OnboardingStepper
        current={currentStep}
        total={totalSteps}
        label="Sua renda mensal"
      />

      <div className="card-surface space-y-6 p-6">
        <header>
          <h2 className="text-xl font-semibold text-text-primary">Qual a sua renda líquida mensal?</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Usamos isso para personalizar seus orçamentos e metas. Você pode atualizar quando quiser.
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Tipo de renda */}
          <div>
            <p className="mb-2 text-sm font-medium text-text-primary">Tipo de renda</p>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo de renda">
              {(["FIXO", "VARIAVEL"] as const).map((t) => (
                <label
                  key={t}
                  className={[
                    "flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border p-3 text-sm font-medium transition",
                    tipo === t
                      ? "border-brand-primary bg-brand-primary-light text-text-brand"
                      : "border-border bg-bg-card text-text-secondary hover:border-brand-primary-muted",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="tipo-renda"
                    value={t}
                    checked={tipo === t}
                    onChange={() => setTipo(t)}
                    className="sr-only"
                  />
                  {t === "FIXO" ? "💼 Renda fixa" : "📈 Renda variável"}
                </label>
              ))}
            </div>
            {tipo === "VARIAVEL" && (
              <p className="mt-2 text-xs text-text-tertiary">
                Informe uma estimativa média dos últimos 3 meses.
              </p>
            )}
          </div>

          {/* Valor */}
          <div>
            <label htmlFor="renda" className="text-sm font-medium text-text-primary">
              {tipo === "VARIAVEL" ? "Estimativa média mensal" : "Renda mensal"}
            </label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-text-tertiary">
                R$
              </span>
              <input
                id="renda"
                type="text"
                inputMode="numeric"
                value={valorFormatted}
                onChange={handleValorChange}
                placeholder="0,00"
                aria-invalid={!!error}
                aria-describedby={error ? "renda-error" : undefined}
                className="h-12 w-full rounded-[10px] border border-border bg-bg-card py-2 pl-10 pr-3 text-lg font-medium text-text-primary outline-none transition focus:border-border-focus aria-invalid:border-danger"
              />
            </div>
            {error && (
              <p id="renda-error" className="mt-1 text-xs text-danger" role="alert">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !valorFormatted}
            className="h-11 w-full rounded-[12px] bg-brand-primary text-sm font-semibold text-text-inverse transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Salvando…" : "Continuar →"}
          </button>
        </form>

        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              const res = await fetch("/api/onboarding/complete", { method: "POST" });
              if (!res.ok) { setError("Erro ao finalizar."); setLoading(false); return; }
              await getSession();
              window.location.href = "/dashboard";
            } catch { setError("Erro de rede."); setLoading(false); }
          }}
          className="w-full text-center text-sm text-text-tertiary hover:text-text-secondary transition"
        >
          Pular esta etapa
        </button>
      </div>

      <p className="text-center text-xs text-text-tertiary">
        Seus dados financeiros são privados e nunca compartilhados com terceiros.
      </p>
    </div>
  );
}

export default function RendaPage() {
  return (
    <Suspense>
      <RendaContent />
    </Suspense>
  );
}
