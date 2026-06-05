import { requireAuthUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { ContasClient } from "./contas-client";

export default async function ContasPage() {
  const auth = await requireAuthUser();
  if (!auth.ok) redirect("/auth/login");
  return <ContasClient />;
}
