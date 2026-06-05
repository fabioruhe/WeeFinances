import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

export function createInviteCode(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

export async function getActiveCouple(userId: string) {
  return prisma.couple.findFirst({
    where: {
      status: "ATIVO",
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: { select: { id: true, nome: true, email: true } },
      userB: { select: { id: true, nome: true, email: true } },
    },
  });
}

export async function getPendingCouple(userId: string) {
  return prisma.couple.findFirst({
    where: {
      status: "PENDENTE",
      userAId: userId,
    },
  });
}
