"use client";

import { useRouter } from "next/navigation";
import { OnboardingStepper } from "@/components/onboarding/stepper";

export default function ModoPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <OnboardingStepper current={2} total={4} label="Como quer começar?" />

      <div className="card-surface p-6">
        <h2 className="text-xl font-semibold text-text-primary">Como você quer começar?</h2>
        <p className="mt-1 text-sm text-text-secondary">Escolha como quer usar o Wee Finances agora.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Card Solo */}
        <button
          onClick={() => router.push("/onboarding/renda?mode=solo")}
          className="group rounded-[16px] border border-border bg-bg-card p-5 text-left shadow-md transition-all hover:border-brand-primary-muted hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Quero usar sozinho"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary text-2xl transition-colors group-hover:bg-brand-primary-light">
            🙋
          </div>
          <h3 className="font-semibold text-text-primary">Quero usar sozinho(a)</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Gerencie suas finanças pessoais. Você pode convidar alguém a qualquer momento.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-text-brand">
            Começar solo →
          </span>
        </button>

        {/* Card Casal */}
        <button
          onClick={() => router.push("/onboarding/convite?mode=couple")}
          className="group rounded-[16px] border border-brand-primary-muted bg-gradient-to-br from-brand-primary-light to-brand-secondary-light p-5 text-left shadow-md transition-all hover:border-brand-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Quero usar com meu parceiro ou parceira"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/60 text-2xl transition-colors group-hover:bg-white/80 dark:bg-black/20">
            👫
          </div>
          <h3 className="font-semibold text-text-primary">Quero usar com meu(minha) parceiro(a)</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Organizem as finanças juntos. Cada um tem seu próprio login.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-text-brand">
            Convidar parceiro(a) →
          </span>
        </button>
      </div>

      <p className="text-center text-xs text-text-tertiary">
        Não se preocupe — você pode mudar isso depois em Configurações.
      </p>
    </div>
  );
}
