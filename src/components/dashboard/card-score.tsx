"use client";

import type { DashboardData } from "@/app/api/dashboard/route";

type Props = {
  data: DashboardData["score"];
  mode: "solo" | "couple";
};

function getScoreColor(score: number) {
  if (score >= 70) return "var(--success)";
  if (score >= 40) return "var(--warning)";
  return "var(--danger)";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Regular";
  return "Atenção";
}

// SVG arc gauge
function ScoreGauge({ score }: { score: number }) {
  const color = getScoreColor(score);
  const r = 52;
  const cx = 64;
  const cy = 64;
  // Arc goes from 210° to 330° (240° sweep) — bottom open
  const startAngle = 210;
  const endAngle = 330;
  const sweep = 240;

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const scoreEnd = polarToCartesian(startAngle + (score / 100) * sweep);

  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;
  const fillPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${score / 100 > 0.5 ? 1 : 0} 1 ${scoreEnd.x} ${scoreEnd.y}`;

  return (
    <svg width="128" height="90" viewBox="0 0 128 90" fill="none">
      <path d={trackPath} stroke="var(--bg-tertiary)" strokeWidth="10" strokeLinecap="round" fill="none" />
      {score > 0 && (
        <path d={fillPath} stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />
      )}
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontWeight="700" fontFamily="var(--font-fraunces)" fontStyle="italic">
        {score}
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">
        de 100
      </text>
    </svg>
  );
}

type BreakdownItem = { label: string; value: number; max: number };

export function CardScore({ data, mode }: Props) {
  const color = getScoreColor(data.total);
  const label = getScoreLabel(data.total);
  const { breakdown } = data;

  const items: BreakdownItem[] = mode === "couple"
    ? [
        { label: "Reserva emergência", value: breakdown.reservaEmergencia, max: 25 },
        { label: "Taxa poupança", value: breakdown.taxaPoupanca, max: 20 },
        { label: "Endividamento", value: breakdown.endividamento, max: 20 },
        { label: "Alinhamento metas", value: breakdown.alinhamentoMetas, max: 15 },
        { label: "Check-ins", value: breakdown.checkIns, max: 10 },
        { label: "Diversificação", value: breakdown.diversificacao, max: 10 },
      ]
    : [
        { label: "Reserva emergência", value: breakdown.reservaEmergencia, max: 30 },
        { label: "Taxa poupança", value: breakdown.taxaPoupanca, max: 25 },
        { label: "Endividamento", value: breakdown.endividamento, max: 25 },
        { label: "Progresso metas", value: breakdown.progressoMetas, max: 10 },
        { label: "Diversificação", value: breakdown.diversificacao, max: 10 },
      ];

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
        Score de Saúde Financeira
      </h3>

      <div className="flex items-center gap-4 mb-4">
        <ScoreGauge score={data.total} />
        <div>
          <p className="text-lg font-bold" style={{ color }}>
            {label}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            {data.total}/100 pontos
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const pct = item.max > 0 ? (item.value / item.max) * 100 : 0;
          return (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                <span style={{ color: "var(--text-tertiary)" }}>
                  {Math.round(item.value)}/{item.max}
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "var(--bg-tertiary)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 90 ? "var(--success)" : pct >= 50 ? "var(--brand-primary)" : "var(--warning)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
