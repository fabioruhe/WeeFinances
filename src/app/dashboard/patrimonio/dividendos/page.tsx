import { requireAuthUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { DividendosClient } from "./dividendos-client";

export default async function DividendosPage() {
  const auth = await requireAuthUser();
  if (!auth.ok) redirect("/auth/login");

  return <DividendosClient />;
}
