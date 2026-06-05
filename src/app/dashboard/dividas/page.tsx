import { requireAuthUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { DividasClient } from "./dividas-client";

export default async function DividasPage() {
  const auth = await requireAuthUser();
  if (!auth.ok) redirect("/auth/login");

  return <DividasClient />;
}
