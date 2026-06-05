import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAccountContext } from "@/lib/session";
import { fetchDashboardData } from "@/lib/dashboard";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const [accountContext, initialData] = await Promise.all([
    getAccountContext(session.user.id),
    fetchDashboardData(session.user.id, "meu").catch(() => null),
  ]);

  if (!accountContext) redirect("/auth/login");

  return (
    <DashboardClient
      initialData={initialData}
      mode={accountContext.mode}
      partnerName={accountContext.partnerName}
    />
  );
}
