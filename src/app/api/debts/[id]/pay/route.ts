import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const PaySchema = z.object({
  valor_pago: z.number().positive(),
  data: z.string().refine((d) => !isNaN(new Date(d).getTime()), "Data inválida"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user } = auth;
  const { id } = await params;

  const debt = await prisma.debt.findFirst({
    where: {
      id,
      status: "ATIVA",
      OR: [{ userId: user.id }, { coupleId: user.coupleId ?? undefined }],
    },
  });

  if (!debt) {
    return NextResponse.json({ error: "debt_not_found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = PaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { valor_pago, data } = parsed.data;
  const valorRestanteAtual = Number(debt.valorRestante);
  const novoValorRestante = Math.max(valorRestanteAtual - valor_pago, 0);
  const quitada = novoValorRestante <= 0.01;

  const novasPagas = debt.parcelasTotal
    ? Math.min(debt.parcelasPagas + 1, debt.parcelasTotal)
    : debt.parcelasPagas;

  const [payment, updatedDebt] = await prisma.$transaction([
    prisma.debtPayment.create({
      data: {
        debtId: id,
        userId: user.id,
        valor: valor_pago,
        data: new Date(data),
      },
    }),
    prisma.debt.update({
      where: { id },
      data: {
        valorRestante: novoValorRestante,
        parcelasPagas: novasPagas,
        status: quitada ? "QUITADA" : "ATIVA",
      },
    }),
  ]);

  const valorTotal = Number(updatedDebt.valorTotal);
  const valorRestante = Number(updatedDebt.valorRestante);
  const progresso = valorTotal > 0 ? Math.min(((valorTotal - valorRestante) / valorTotal) * 100, 100) : 100;

  return NextResponse.json({
    payment,
    debt: {
      id: updatedDebt.id,
      valorRestante,
      parcelasPagas: updatedDebt.parcelasPagas,
      status: updatedDebt.status,
      progresso,
    },
    quitada,
  });
}
