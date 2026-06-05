import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcProjecaoConclusao(
  valorAtual: number,
  valorAlvo: number,
  contribuicaoMensal: number,
): Date | null {
  if (contribuicaoMensal <= 0) return null;
  const faltante = valorAlvo - valorAtual;
  if (faltante <= 0) return new Date();
  const meses = Math.ceil(faltante / contribuicaoMensal);
  const data = new Date();
  data.setMonth(data.getMonth() + meses);
  data.setDate(1);
  return data;
}

function calcMesesRestantes(prazo: Date | null): number | null {
  if (!prazo) return null;
  const now = new Date();
  const diff =
    (prazo.getFullYear() - now.getFullYear()) * 12 +
    (prazo.getMonth() - now.getMonth());
  return diff;
}

// ─── Schema Zod ──────────────────────────────────────────────────────────────

const CreateGoalSchema = z.object({
  nome: z.string().min(2).max(100),
  valor_alvo: z.number().positive(),
  prazo: z.string().optional().nullable(),
  tipo: z
    .enum([
      "EMERGENCIA",
      "VIAGEM",
      "IMOVEL",
      "CARRO",
      "CASAMENTO",
      "FILHOS",
      "APOSENTADORIA",
      "EDUCACAO",
      "OUTRO",
    ])
    .default("OUTRO"),
  contribuicao_a: z.number().min(0).optional().nullable(),
  contribuicao_b: z.number().min(0).optional().nullable(),
  prioridade: z.number().int().min(0).default(0),
});

// ─── GET /api/goals ──────────────────────────────────────────────────────────

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;

  const where = isCouple && coupleId
    ? { coupleId }
    : { userId: user.id, coupleId: null };

  const goals = await prisma.goal.findMany({
    where,
    orderBy: [{ prioridade: "desc" }, { prazo: "asc" }, { createdAt: "asc" }],
    include: {
      contributions: {
        select: { userId: true, valor: true },
      },
    },
  });

  // Resolve couple context for partner name display
  let coupleCtx: {
    userAId: string;
    userANome: string | null;
    userBId: string | null;
    userBNome: string | null;
  } | null = null;

  if (isCouple && coupleId) {
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      select: {
        userAId: true,
        userBId: true,
        userA: { select: { nome: true } },
        userB: { select: { nome: true } },
      },
    });
    if (couple) {
      coupleCtx = {
        userAId: couple.userAId,
        userANome: couple.userA.nome,
        userBId: couple.userBId,
        userBNome: couple.userB?.nome ?? null,
      };
    }
  }

  const now = new Date();

  const mapped = goals.map((g) => {
    const valorAlvo = Number(g.valorAlvo);
    const valorAtual = Number(g.valorAtual);
    const contribuicaoA = g.contribuicaoA ? Number(g.contribuicaoA) : null;
    const contribuicaoB = g.contribuicaoB ? Number(g.contribuicaoB) : null;
    const contribuicaoMensal = (contribuicaoA ?? 0) + (contribuicaoB ?? 0);

    const progresso = valorAlvo > 0 ? Math.min((valorAtual / valorAlvo) * 100, 100) : 0;
    const valorFaltante = Math.max(valorAlvo - valorAtual, 0);
    const mesesRestantes = g.prazo ? calcMesesRestantes(g.prazo) : null;
    const valorMensalNecessario =
      mesesRestantes && mesesRestantes > 0 ? valorFaltante / mesesRestantes : null;

    const projecaoConclusao = calcProjecaoConclusao(valorAtual, valorAlvo, contribuicaoMensal);
    const prazoVencido =
      g.prazo != null && g.prazo < now && g.status === "ATIVA";

    // Aggregate contributions per partner
    let totalContribuicaoA = 0;
    let totalContribuicaoB = 0;

    for (const c of g.contributions) {
      const v = Number(c.valor);
      if (coupleCtx) {
        if (c.userId === coupleCtx.userAId) totalContribuicaoA += v;
        else if (c.userId === coupleCtx.userBId) totalContribuicaoB += v;
        else totalContribuicaoA += v; // solo fallback
      } else {
        totalContribuicaoA += v;
      }
    }

    return {
      id: g.id,
      nome: g.nome,
      tipo: g.tipo,
      valorAlvo,
      valorAtual,
      prazo: g.prazo ? g.prazo.toISOString().split("T")[0] : null,
      status: g.status,
      contribuicaoA,
      contribuicaoB,
      prioridade: g.prioridade,
      progresso,
      valorFaltante,
      mesesRestantes,
      valorMensalNecessario,
      projecaoConclusao: projecaoConclusao
        ? projecaoConclusao.toISOString().split("T")[0]
        : null,
      totalContribuicaoA,
      totalContribuicaoB,
      prazoVencido,
      createdAt: g.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ goals: mapped, couple: coupleCtx, userId: user.id });
}

// ─── POST /api/goals ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { user, coupleId, isCouple } = auth;

  const body = await req.json();
  const parsed = CreateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const {
    nome,
    valor_alvo,
    prazo,
    tipo,
    contribuicao_a,
    contribuicao_b,
    prioridade,
  } = parsed.data;

  const prazoDate = prazo ? new Date(prazo) : null;

  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      coupleId: isCouple ? coupleId : null,
      nome,
      valorAlvo: valor_alvo,
      prazo: prazoDate,
      tipo,
      contribuicaoA: contribuicao_a ?? null,
      contribuicaoB: contribuicao_b ?? null,
      prioridade,
    },
  });

  const valorAlvo = Number(goal.valorAlvo);
  const contribuicaoMensal =
    (contribuicao_a ?? 0) + (contribuicao_b ?? 0);
  const mesesRestantes = prazoDate ? calcMesesRestantes(prazoDate) : null;

  return NextResponse.json(
    {
      goal: {
        ...goal,
        valorAlvo,
        valorAtual: 0,
        progresso: 0,
        mesesRestantes,
        valorMensalNecessario:
          mesesRestantes && mesesRestantes > 0 ? valorAlvo / mesesRestantes : null,
        projecaoConclusao: calcProjecaoConclusao(0, valorAlvo, contribuicaoMensal)
          ?.toISOString()
          .split("T")[0] ?? null,
      },
    },
    { status: 201 },
  );
}
