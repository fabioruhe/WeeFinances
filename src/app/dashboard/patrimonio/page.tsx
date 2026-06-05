import { requireAuthUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { PatrimonioClient } from "./patrimonio-client";

export default async function PatrimonioPage() {
  const auth = await requireAuthUser();
  if (!auth.ok) redirect("/auth/login");

  return <PatrimonioClient />;
}
