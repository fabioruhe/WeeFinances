import { requireAuthUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { CheckinClient } from "./checkin-client";

export default async function CheckinPage() {
  const auth = await requireAuthUser();
  if (!auth.ok) redirect("/auth/login");

  return <CheckinClient />;
}
