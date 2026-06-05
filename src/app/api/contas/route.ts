import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

const CreateContaSchema = z.object({
  nome: z.string().min(2).max(100),
  tipo: z.enum(["CORRENTE", "POUPANCA", "INVESTIMENTO", "CARTEIRA_DIGITAL", "OUTRO"]),
  banco: z.string().min(1).max(100),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  saldo: z.number().optional().nullable(),
  icone: z.string().max(50).optional().nullable(),
  padrao: z.boolean().optional(),
});

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  return typeof v === "object" && "toNumber" in (v as object)
    ? (v as { toNumber(): number }).toNumber()
    : Number(v);
}

function mapConta(c: {
  id: string; nome: string; tipo: string; banco: string; cor: string;
  saldo: unknown; icone: string | null; padrao: boolean; ativo: boolean;
  createdAt: Date;
}) {
  return {
    id: c.id,
    nome: c.nome,
    tipo: c.tipo,
    banco: c.banco,
    cor: c.cor,
    saldo: toNum(c.saldo),
    icone: c.icone,
    padrao: c.padrao,
    ativo: c.ativo,
    createdAt: c.createdAt.toISOString(),
  };
}

// ─── GET /api/contas ─────────────────────────────────────────────────────────

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const where = isCouple && coupleId
    ? { coupleId, ativo: true }
    : { userId: user.id, coupleId: null, ativo: true };

  const contas = await prisma.bankAccount.findMany({
    where,
    orderBy: [{ padrao: "desc" }, { nome: "asc" }],
  });

  return NextResponse.json({ contas: contas.map(mapConta) });
}

// ─── POST /api/contas ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;
  const body = await req.json();
  const parsed = CreateContaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { nome, tipo, banco, cor, saldo, icone, padrao } = parsed.data;

  const ownerWhere = isCouple && coupleId
    ? { coupleId, ativo: true }
    : { userId: user.id, coupleId: null, ativo: true };

  const conta = await prisma.$transaction(async (tx) => {
    if (padrao) {
      await tx.bankAccount.updateMany({
        where: { ...ownerWhere, padrao: true },
        data: { padrao: false },
      });
    }

    return tx.bankAccount.create({
      data: {
        userId: user.id,
        coupleId: isCouple ? coupleId : null,
        nome,
        tipo,
        banco,
        cor,
        saldo: saldo ?? null,
        icone: icone ?? null,
        padrao: padrao ?? false,
      },
    });
  });

  return NextResponse.json({ conta: mapConta(conta) }, { status: 201 });
}
