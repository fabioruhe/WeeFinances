import { requireAuthUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { HistoricoClient } from "./historico-client";

export default async function HistoricoPage() {
  const auth = await requireAuthUser();
  if (!auth.ok) redirect("/auth/login");

  return <HistoricoClient />;
}
