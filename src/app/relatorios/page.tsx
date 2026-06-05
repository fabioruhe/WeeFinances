import { requireAuthUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { RelatoriosClient } from "./relatorios-client";

export default async function RelatoriosPage() {
  const auth = await requireAuthUser();
  if (!auth.ok) redirect("/auth/login");

  return <RelatoriosClient />;
}
