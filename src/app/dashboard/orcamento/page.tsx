import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAccountContext } from "@/lib/session";
import { OrcamentoClient } from "./orcamento-client";

export default async function OrcamentoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const accountContext = await getAccountContext(session.user.id);
  if (!accountContext) redirect("/auth/login");

  return (
    <OrcamentoClient
      userId={session.user.id}
      isCouple={accountContext.mode === "couple"}
    />
  );
}
