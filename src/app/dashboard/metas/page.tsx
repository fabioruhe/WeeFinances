import { requireAuthUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { MetasClient } from "./metas-client";

export default async function MetasPage() {
  const auth = await requireAuthUser();
  if (!auth.ok) redirect("/auth/login");

  return <MetasClient />;
}
