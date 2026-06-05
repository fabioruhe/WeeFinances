import { redirect } from "next/navigation";
import { requireAuthUser } from "@/lib/session";
import { ConfigClient } from "./config-client";

export default async function ConfigPage() {
  const auth = await requireAuthUser();
  if (!auth.ok) redirect("/auth/login");

  return <ConfigClient />;
}
