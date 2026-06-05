import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountContext } from "@/lib/session";
import { TransacoesClient } from "./transacoes-client";

async function loadCategorias() {
  const cats = await prisma.category.findMany({
    where: { OR: [{ coupleId: null }, { tipo: "PADRAO" }] },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      icone: true,
      subcategories: {
        orderBy: { ordem: "asc" },
        select: { id: true, nome: true, icone: true },
      },
    },
  });
  return cats.map((c) => ({ ...c, subcategorias: c.subcategories }));
}

export default async function TransacoesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const [accountContext, categorias] = await Promise.all([
    getAccountContext(session.user.id),
    loadCategorias(),
  ]);

  if (!accountContext) redirect("/auth/login");

  return (
    <TransacoesClient
      userId={session.user.id}
      isCouple={accountContext.mode === "couple"}
      categorias={categorias}
    />
  );
}
