import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/session";

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "object" && "toNumber" in (v as object)
    ? (v as { toNumber(): number }).toNumber()
    : Number(v);
}

// ─── PUT /api/assets/:id ────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json();

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset || asset.userId !== auth.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.valor_atual !== undefined) updateData.valorAtual = body.valor_atual;
  if (body.nome !== undefined) updateData.nome = body.nome;

  // Create snapshot if month changed since last update
  if (body.valor_atual !== undefined) {
    const now = new Date();
    const mesRef = new Date(now.getFullYear(), now.getMonth(), 1);

    const existingSnap = await prisma.assetSnapshot.findFirst({
      where: { assetId: id, mesReferencia: mesRef },
    });

    if (!existingSnap) {
      await prisma.assetSnapshot.create({
        data: {
          assetId: id,
          valor: toNum(asset.valorAtual),
          mesReferencia: mesRef,
        },
      });
    }
  }

  const updated = await prisma.asset.update({
    where: { id },
    data: updateData,
  });

  const valorAtual = toNum(updated.valorAtual);
  const valorInvestido = toNum(updated.valorInvestido);

  return NextResponse.json({
    asset: {
      id: updated.id,
      nome: updated.nome,
      tipo: updated.tipo,
      instituicao: updated.instituicao,
      ticker: updated.ticker,
      quantidade: updated.quantidade !== null ? toNum(updated.quantidade) : null,
      precoUnitario: updated.precoUnitario !== null ? toNum(updated.precoUnitario) : null,
      valorAtual,
      valorInvestido,
      rentabilidade: valorAtual - valorInvestido,
      rentabilidadePct: valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0,
      dataAquisicao: updated.dataAquisicao?.toISOString().split("T")[0] ?? null,
      ativo: updated.ativo,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

// ─── DELETE /api/assets/:id ─────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset || asset.userId !== auth.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.asset.update({ where: { id }, data: { ativo: false } });

  return NextResponse.json({ ok: true });
}
