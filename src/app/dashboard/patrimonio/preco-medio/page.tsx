import { requireAuthUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { PrecoMedioClient } from "./preco-medio-client";

export default async function PrecoMedioPage() {
  const auth = await requireAuthUser();
  if (!auth.ok) redirect("/auth/login");

  return <PrecoMedioClient />;
}
