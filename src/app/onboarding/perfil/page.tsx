"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStepper } from "@/components/onboarding/stepper";

type Perfil = "POUPADOR" | "GASTADOR" | "DESLIGADO" | "VISIONARIO";

type QuizOption = {
  text: string;
  perfil: Perfil;
};

type QuizQuestion = {
  question: string;
  options: [QuizOption, QuizOption, QuizOption, QuizOption];
};

const QUESTIONS: QuizQuestion[] = [
  {
    question: "Sobrou dinheiro no fim do mês. Você…",
    options: [
      { text: "Guarda tudo de uma vez", perfil: "POUPADOR" },
      { text: "Compra algo que estava querendo", perfil: "GASTADOR" },
      { text: "Nem percebeu que sobrou", perfil: "DESLIGADO" },
      { text: "Já tinha planejado onde investir", perfil: "VISIONARIO" },
    ],
  },
  {
    question: "Você recebe um presente de R$\u00a01.000. Primeira reação?",
    options: [
      { text: "Coloca direto na poupança", perfil: "POUPADOR" },
      { text: "Jantar especial pra celebrar!", perfil: "GASTADOR" },
      { text: "Tanto faz, vai ficar na conta", perfil: "DESLIGADO" },
      { text: "Pesquisa o melhor investimento", perfil: "VISIONARIO" },
    ],
  },
  {
    question: "Como você se sente ao ver o extrato bancário?",
    options: [
      { text: "Tranquilo(a), confiro sempre", perfil: "POUPADOR" },
      { text: "Prefiro não olhar muito", perfil: "GASTADOR" },
      { text: "Que extrato?", perfil: "DESLIGADO" },
      { text: "Analiso cada linha com atenção", perfil: "VISIONARIO" },
    ],
  },
  {
    question: "Alguém sugere comprar uma TV nova. Você…",
    options: [
      { text: "Propõe esperar uma promoção", perfil: "POUPADOR" },
      { text: "Boa ideia, vamos comprar!", perfil: "GASTADOR" },
      { text: "Se quiser, decide você", perfil: "DESLIGADO" },
      { text: "Faz uma planilha comparativa", perfil: "VISIONARIO" },
    ],
  },
  {
    question: "Fim de ano, hora de planejar o próximo. Você…",
    options: [
      { text: "Define quanto vai poupar por mês", perfil: "POUPADOR" },
      { text: "Pensa nas viagens que quer fazer", perfil: "GASTADOR" },
      { text: "Deixa rolar, vai surgir", perfil: "DESLIGADO" },
      { text: "Monta metas com prazos e valores", perfil: "VISIONARIO" },
    ],
  },
  {
    question: "Uma conta inesperada de R$\u00a0500 chega. Você…",
    options: [
      { text: "Paga com a reserva de emergência", perfil: "POUPADOR" },
      { text: "Parcela no cartão", perfil: "GASTADOR" },
      { text: "Deixa pra depois resolver", perfil: "DESLIGADO" },
      { text: "Negocia desconto para pagar à vista", perfil: "VISIONARIO" },
    ],
  },
  {
    question: "Investimentos. Qual sua postura?",
    options: [
      { text: "Poupança é seguro, me basta", perfil: "POUPADOR" },
      { text: "Nunca pensei muito nisso", perfil: "GASTADOR" },
      { text: "Não entendo e não me interesso", perfil: "DESLIGADO" },
      { text: "Diversifico entre renda fixa e variável", perfil: "VISIONARIO" },
    ],
  },
  {
    question: "O que mais te estressa sobre dinheiro?",
    options: [
      { text: "Gastar mais do que devia", perfil: "POUPADOR" },
      { text: "Não poder gastar o que quero", perfil: "GASTADOR" },
      { text: "Ter que pensar nisso o tempo todo", perfil: "DESLIGADO" },
      { text: "Não ter controle claro dos números", perfil: "VISIONARIO" },
    ],
  },
];

const PERFIL_INFO: Record<
  Perfil,
  { emoji: string; titulo: string; descricao: string; cor: string }
> = {
  POUPADOR: {
    emoji: "🐷",
    titulo: "Poupador(a)",
    descricao:
      "Você valoriza segurança e pensa no futuro antes de qualquer gasto. Sua força é a disciplina — e isso é ouro na gestão financeira.",
    cor: "text-brand-primary",
  },
  GASTADOR: {
    emoji: "🛍️",
    titulo: "Aproveitador(a) da vida",
    descricao:
      "Você vive o presente e acredita que dinheiro existe para ser aproveitado. Sua energia traz leveza — só precisamos equilibrar o curto e o longo prazo.",
    cor: "text-brand-secondary",
  },
  DESLIGADO: {
    emoji: "🌊",
    titulo: "Desligado(a) financeiro(a)",
    descricao:
      "Você prefere não se preocupar muito com finanças no dia a dia. Sem julgamentos — o Wee está aqui exatamente para tornar isso mais fácil e automático.",
    cor: "text-info",
  },
  VISIONARIO: {
    emoji: "📊",
    titulo: "Visionário(a)",
    descricao:
      "Você planeja, analisa e busca o melhor retorno para cada centavo. Sua mentalidade estratégica é um superpoder — vamos colocá-la para trabalhar.",
    cor: "text-brand-accent",
  },
};

function computeDominantPerfil(answers: Perfil[]): Perfil {
  const counts: Record<Perfil, number> = {
    POUPADOR: 0,
    GASTADOR: 0,
    DESLIGADO: 0,
    VISIONARIO: 0,
  };
  for (const a of answers) counts[a]++;
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as Perfil;
}

export default function PerfilPage() {
  const router = useRouter();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Perfil[]>([]);
  const [selected, setSelected] = useState<Perfil | null>(null);
  const [result, setResult] = useState<Perfil | null>(null);
  const [saving, setSaving] = useState(false);

  const total = QUESTIONS.length;
  const question = QUESTIONS[currentQ];

  function handleSelect(perfil: Perfil) {
    setSelected(perfil);
  }

  function handleNext() {
    if (!selected) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (currentQ + 1 < total) {
      setCurrentQ((q) => q + 1);
    } else {
      setResult(computeDominantPerfil(newAnswers));
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil: result }),
      });
      router.push("/onboarding/modo");
    } catch {
      setSaving(false);
    }
  }

  // ── Tela de resultado ──
  if (result) {
    const info = PERFIL_INFO[result];
    return (
      <div className="space-y-6">
        <OnboardingStepper current={1} total={4} label="Perfil financeiro" />

        <div className="card-surface space-y-6 p-6 text-center">
          <div>
            <span className="text-6xl" role="img" aria-label={info.titulo}>
              {info.emoji}
            </span>
            <h2 className="font-display mt-3 text-3xl italic text-text-primary">
              {info.titulo}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{info.descricao}</p>
          </div>

          <div className="rounded-xl bg-brand-primary-light px-4 py-3 text-sm text-text-brand">
            Isso é só um ponto de partida — você pode ajustar seu perfil a qualquer momento nas configurações.
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="h-11 w-full rounded-[12px] bg-brand-primary text-sm font-semibold text-text-inverse transition hover:bg-brand-primary-hover disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Continuar →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Tela de quiz ──
  return (
    <div className="space-y-6">
      <OnboardingStepper current={1} total={4} label="Perfil financeiro" />

      <div className="card-surface space-y-5 p-6">
        {/* Progresso do quiz */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-tertiary">
            Pergunta {currentQ + 1} de {total}
          </span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-bg-tertiary">
            <div
              className="h-full rounded-full bg-brand-primary transition-all duration-500"
              style={{ width: `${((currentQ + 1) / total) * 100}%` }}
              role="progressbar"
              aria-valuenow={currentQ + 1}
              aria-valuemin={1}
              aria-valuemax={total}
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold leading-snug text-text-primary">
          {question.question}
        </h2>

        <fieldset className="space-y-2.5">
          <legend className="sr-only">Escolha uma opção</legend>
          {question.options.map((option, i) => {
            const isSelected = selected === option.perfil;
            return (
              <label
                key={i}
                className={[
                  "flex cursor-pointer items-start gap-3 rounded-[12px] border p-3.5 transition-all duration-150",
                  isSelected
                    ? "border-brand-primary bg-brand-primary-light"
                    : "border-border bg-bg-card hover:border-brand-primary-muted hover:bg-brand-primary-light/40",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="quiz-option"
                  value={option.perfil}
                  checked={isSelected}
                  onChange={() => handleSelect(option.perfil)}
                  className="sr-only"
                />
                <span
                  className={[
                    "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected ? "border-brand-primary bg-brand-primary" : "border-border",
                  ].join(" ")}
                  aria-hidden
                >
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
                <span className="text-sm text-text-primary">{option.text}</span>
              </label>
            );
          })}
        </fieldset>

        <button
          onClick={handleNext}
          disabled={!selected}
          className="h-11 w-full rounded-[12px] bg-brand-primary text-sm font-semibold text-text-inverse transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {currentQ + 1 === total ? "Ver meu perfil" : "Próxima →"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => router.push("/onboarding/modo")}
        className="w-full text-center text-sm text-text-tertiary hover:text-text-secondary transition"
      >
        Pular esta etapa
      </button>
    </div>
  );
}
