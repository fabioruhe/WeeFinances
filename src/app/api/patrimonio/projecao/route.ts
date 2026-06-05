import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthUser } from "@/lib/session";

const ProjecaoSchema = z.object({
  valor_inicial: z.number().min(0),
  aporte_mensal: z.number().min(0),
  taxa_anual: z.number().min(0).max(100),
  anos_projecao: z.number().int().min(1).max(50),
});

// ─── POST /api/patrimonio/projecao ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = ProjecaoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { valor_inicial, aporte_mensal, taxa_anual, anos_projecao } = parsed.data;
  const taxaMensal = Math.pow(1 + taxa_anual / 100, 1 / 12) - 1;
  const anoAtual = new Date().getFullYear();

  let saldo = valor_inicial;
  let totalAportado = valor_inicial;
  let totalJuros = 0;
  let crossoverAno: number | null = null;

  const projecao: Array<{
    ano: number;
    anoCalendario: number;
    aportesNoAno: number;
    jurosNoAno: number;
    saldoFinal: number;
    totalAportado: number;
    totalJuros: number;
    percentualJuros: number;
  }> = [];

  for (let ano = 1; ano <= anos_projecao; ano++) {
    let aportesNoAno = 0;
    let jurosNoAno = 0;

    for (let mes = 0; mes < 12; mes++) {
      const juros = saldo * taxaMensal;
      jurosNoAno += juros;
      totalJuros += juros;
      saldo += juros + aporte_mensal;
      aportesNoAno += aporte_mensal;
      totalAportado += aporte_mensal;
    }

    const percentualJuros = saldo > 0 ? (totalJuros / saldo) * 100 : 0;

    if (crossoverAno === null && totalJuros >= totalAportado) {
      crossoverAno = ano;
    }

    projecao.push({
      ano,
      anoCalendario: anoAtual + ano,
      aportesNoAno: Math.round(aportesNoAno * 100) / 100,
      jurosNoAno: Math.round(jurosNoAno * 100) / 100,
      saldoFinal: Math.round(saldo * 100) / 100,
      totalAportado: Math.round(totalAportado * 100) / 100,
      totalJuros: Math.round(totalJuros * 100) / 100,
      percentualJuros: Math.round(percentualJuros * 100) / 100,
    });
  }

  return NextResponse.json({
    projecao,
    resumo: {
      valorFinal: Math.round(saldo * 100) / 100,
      totalAportado: Math.round(totalAportado * 100) / 100,
      totalJuros: Math.round(totalJuros * 100) / 100,
      multiplicador: totalAportado > 0 ? Math.round((saldo / totalAportado) * 100) / 100 : 0,
      crossoverAno,
    },
  });
}
