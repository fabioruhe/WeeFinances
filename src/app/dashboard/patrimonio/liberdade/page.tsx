import { requireAuthUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { LiberdadeClient } from "./liberdade-client";

export default async function LiberdadePage() {
  const auth = await requireAuthUser();
  if (!auth.ok) redirect("/auth/login");

  return <LiberdadeClient />;
}
