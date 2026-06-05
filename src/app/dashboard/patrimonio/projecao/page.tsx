import { requireAuthUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { ProjecaoClient } from "./projecao-client";

export default async function ProjecaoPage() {
  const auth = await requireAuthUser();
  if (!auth.ok) redirect("/auth/login");

  return <ProjecaoClient />;
}
