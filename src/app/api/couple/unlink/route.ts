import { NextResponse } from "next/server";

import { getActiveCouple } from "@/lib/couple";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

export async function POST() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const activeCouple = await getActiveCouple(auth.user.id);
  if (!activeCouple) {
    return NextResponse.json(
      { error: "couple_not_active", message: "Sua conta já está em modo solo." },
      { status: 409 },
    );
  }

  const memberIds = [activeCouple.userAId, activeCouple.userBId].filter(Boolean) as string[];

  await prisma.$transaction(async (tx) => {
    await tx.goal.updateMany({
      where: { coupleId: activeCouple.id, status: "ATIVA" },
      data: { status: "PAUSADA" },
    });

    await tx.transaction.updateMany({ where: { coupleId: activeCouple.id }, data: { coupleId: null } });
    await tx.goal.updateMany({ where: { coupleId: activeCouple.id }, data: { coupleId: null } });
    await tx.debt.updateMany({ where: { coupleId: activeCouple.id }, data: { coupleId: null } });
    await tx.creditCard.updateMany({ where: { coupleId: activeCouple.id }, data: { coupleId: null } });
    await tx.budget.updateMany({ where: { coupleId: activeCouple.id }, data: { coupleId: null } });
    await tx.asset.updateMany({ where: { coupleId: activeCouple.id }, data: { coupleId: null } });
    await tx.fixedExpense.updateMany({ where: { coupleId: activeCouple.id }, data: { coupleId: null } });
    await tx.subscription.updateMany({ where: { coupleId: activeCouple.id }, data: { coupleId: null } });

    await tx.user.updateMany({
      where: { id: { in: memberIds } },
      data: { coupleId: null },
    });

    await tx.couple.update({
      where: { id: activeCouple.id },
      data: { status: "DESVINCULADO" },
    });

    const pendingCouples = await tx.couple.findMany({
      where: { userAId: { in: memberIds }, status: "PENDENTE" },
      select: { id: true },
    });
    if (pendingCouples.length > 0) {
      await tx.couple.updateMany({
        where: { id: { in: pendingCouples.map((c) => c.id) } },
        data: { status: "DESVINCULADO" },
      });
    }
  });

  return NextResponse.json({
    success: true,
    message:
      "Desvinculação concluída. Contas voltaram para modo solo. Dados individuais foram preservados.",
    coupleId: activeCouple.id,
    membersCount: memberIds.length,
  });
}
