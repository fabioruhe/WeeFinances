import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchDashboardData } from "@/lib/dashboard";
import type { DashboardScope } from "@/lib/dashboard";

export type { DashboardData, DashboardScope } from "@/lib/dashboard";

// ─── GET /api/dashboard ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rawScope = req.nextUrl.searchParams.get("scope") as DashboardScope | null;
  const scope: DashboardScope = rawScope ?? "meu";

  const data = await fetchDashboardData(session.user.id, scope);
  return NextResponse.json(data);
}
