"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Goal,
  LayoutDashboard,
  ListChecks,
  ScanSearch,
  Settings,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export const navigationItems: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ListChecks },
  { href: "/budgets", label: "Category Budgets", icon: BarChart3 },
  { href: "/goals", label: "Savings Goals", icon: Goal },
  { href: "/coach", label: "AI Money Coach", icon: Bot },
  { href: "/insights", label: "Insights", icon: ScanSearch },
  { href: "/scam-check", label: "Scam Check", icon: ShieldAlert },
  { href: "/settings", label: "Settings", icon: Settings },
];

type NavigationLinksProps = {
  onNavigate?: () => void;
};

export function NavigationLinks({ onNavigate }: NavigationLinksProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Application navigation" className="sidebar-links">
      {navigationItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`nav-link${active ? " nav-link-active" : ""}`}
          >
            <Icon size={17} strokeWidth={active ? 2.1 : 1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
