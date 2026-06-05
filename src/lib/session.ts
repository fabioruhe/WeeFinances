import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── getAccountContext ────────────────────────────────────────────────────────

export type AccountContext = {
  mode: "solo" | "couple";
  userId: string;
  coupleId: string | null;
  partnerId: string | null;
  partnerName: string | null;
};

/**
 * Retorna o contexto da conta do usuário: modo solo ou casal, e dados do parceiro se houver.
 */
export async function getAccountContext(userId: string): Promise<AccountContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      coupleId: true,
      couple: {
        select: {
          id: true,
          status: true,
          userAId: true,
          userBId: true,
          userA: { select: { id: true, nome: true } },
          userB: { select: { id: true, nome: true } },
        },
      },
    },
  });

  if (!user) return null;

  const couple = user.couple;
  const isActiveCouple = couple?.status === "ATIVO";

  let partnerId: string | null = null;
  let partnerName: string | null = null;

  if (isActiveCouple && couple) {
    if (couple.userAId === userId) {
      partnerId = couple.userBId ?? null;
      partnerName = couple.userB?.nome ?? null;
    } else {
      partnerId = couple.userAId;
      partnerName = couple.userA?.nome ?? null;
    }
  }

  return {
    mode: isActiveCouple ? "couple" : "solo",
    userId: user.id,
    coupleId: user.coupleId,
    partnerId,
    partnerName,
  };
}

// ─── isCoupleMode ────────────────────────────────────────────────────────────

/**
 * Retorna true se o usuário está vinculado a um casal ativo.
 * Funciona tanto com o objeto session quanto com coupleId diretamente.
 */
export function isCoupleMode(session: Session): boolean {
  return typeof session.user.coupleId === "string" && session.user.coupleId.length > 0;
}

/**
 * Versão simples para uso com coupleId isolado (útil em API routes).
 */
export function isCoupleById(coupleId: string | null | undefined): boolean {
  return typeof coupleId === "string" && coupleId.length > 0;
}

// ─── requireAuthUser ────────────────────────────────────────────────────────

export async function requireAuthUser() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "user_not_found" }, { status: 404 }),
    };
  }

  return {
    ok: true as const,
    user,
    coupleId: user.coupleId,
    isCouple: isCoupleById(user.coupleId),
  };
}
