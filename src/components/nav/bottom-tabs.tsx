"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  CreditCard,
  ClipboardCheck,
  Landmark,
  Wallet,
  BarChart3,
  Settings,
} from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/dashboard/orcamento", label: "Orçamento", icon: PieChart },
  { href: "/dashboard/metas", label: "Metas", icon: Target },
  { href: "/dashboard/dividas", label: "Dívidas", icon: CreditCard },
  { href: "/dashboard/checkin", label: "Check-in", icon: ClipboardCheck },
  { href: "/dashboard/patrimonio", label: "Patrimônio", icon: Landmark },
  { href: "/dashboard/contas", label: "Contas", icon: Wallet },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/config", label: "Config", icon: Settings },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-1 pb-safe"
      style={{
        background: "var(--bg-card)",
        boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
        borderTop: "1px solid var(--border)",
        height: "64px",
      }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 min-w-0"
          >
            <Icon
              size={20}
              strokeWidth={active ? 2.5 : 1.8}
              style={{ color: active ? "var(--brand-primary)" : "var(--text-tertiary)" }}
            />
            <span
              className="text-[10px] truncate"
              style={{
                color: active ? "var(--brand-primary)" : "var(--text-tertiary)",
                fontWeight: active ? 600 : 400,
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
