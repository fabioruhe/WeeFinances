"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen border-r shrink-0"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="font-display text-xl font-bold italic"
          style={{ color: "var(--brand-primary)" }}>
          Wee
        </span>
        <span className="font-display text-xl font-bold italic"
          style={{ color: "var(--text-primary)" }}>
          Finances
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: active ? "var(--brand-primary)" : "var(--text-secondary)",
                background: active ? "var(--brand-primary-light)" : "transparent",
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors hover:opacity-80"
          style={{ color: "var(--text-tertiary)" }}>
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
