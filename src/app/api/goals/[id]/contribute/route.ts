import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const ContributeSchema = z.object({
  valor: z.number().positive(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user } = auth;
  const { id } = await params;

  const body = await req.json();
  const parsed = ContributeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { valor } = parsed.data;

  // Verify goal exists and belongs to user/couple
  const goal = await prisma.goal.findFirst({
    where: {
      id,
      OR: [{ userId: user.id }, { coupleId: user.coupleId ?? undefined }],
    },
  });

  if (!goal) {
    return NextResponse.json({ error: "goal_not_found" }, { status: 404 });
  }

  if (goal.status === "ATINGIDA") {
    return NextResponse.json({ error: "goal_already_reached" }, { status: 400 });
  }

  const novoValor = Number(goal.valorAtual) + valor;
  const atingida = novoValor >= Number(goal.valorAlvo);

  const [contribution, updatedGoal] = await prisma.$transaction([
    prisma.goalContribution.create({
      data: {
        goalId: id,
        userId: user.id,
        valor,
        data: new Date(),
      },
    }),
    prisma.goal.update({
      where: { id },
      data: {
        valorAtual: novoValor,
        status: atingida ? "ATINGIDA" : goal.status,
      },
    }),
  ]);

  return NextResponse.json({
    contribution,
    goal: {
      id: updatedGoal.id,
      valorAtual: Number(updatedGoal.valorAtual),
      status: updatedGoal.status,
      progresso: Math.min(
        (Number(updatedGoal.valorAtual) / Number(updatedGoal.valorAlvo)) * 100,
        100,
      ),
    },
    celebrar: atingida,
  });
}
