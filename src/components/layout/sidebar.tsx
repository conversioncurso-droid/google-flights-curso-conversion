"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Visão Geral", icon: "📊" },
  { href: "/dashboard/rotas", label: "Rotas", icon: "✈️" },
  { href: "/dashboard/comparativo", label: "Comparativo", icon: "📈" },
  { href: "/dashboard/configuracao", label: "Configuração", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col" aria-label="Menu principal">
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-bold text-primary font-[family-name:var(--font-manrope)]">
          Google Flights
        </h1>
        <p className="text-xs text-text-muted mt-0.5">Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-1" aria-label="Navegação">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-text-muted hover:bg-background hover:text-text"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm text-text-muted hover:text-danger rounded-md hover:bg-danger/10 transition-colors text-left"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
