import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/session";
import { matchMerchantRule } from "@/lib/categorization";

// ─── GET /api/transactions/suggest-category ───────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { coupleId } = auth;
  const descricao = req.nextUrl.searchParams.get("descricao") ?? "";

  if (!descricao || descricao.trim().length < 2) {
    return NextResponse.json({
      categoria_id: null,
      subcategoria_id: null,
      confianca: "nenhuma",
      fonte: null,
    });
  }

  const match = await matchMerchantRule(descricao, coupleId);

  if (!match) {
    console.log("[CAT] Sem match para:", descricao);
    return NextResponse.json({
      categoria_id: null,
      subcategoria_id: null,
      confianca: "nenhuma",
      fonte: null,
    });
  }

  console.log("[CAT] Match encontrado:", {
    keyword: descricao,
    regra: match.ruleId,
    confianca: match.confianca,
  });

  return NextResponse.json({
    categoria_id: match.categoriaId,
    subcategoria_id: match.subcategoriaId,
    confianca: match.confianca,
    fonte: match.fonte,
  });
}
