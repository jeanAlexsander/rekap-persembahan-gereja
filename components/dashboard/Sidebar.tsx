"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HandCoins,
  Users,
  Building2,
  BarChart3,
  Printer,
  LogOut,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Persembahan",
    href: "/dashboard/persembahan",
    icon: HandCoins,
  },
  {
    name: "Jemaat",
    href: "/dashboard/jemaat",
    icon: Users,
  },
  {
    name: "Blok",
    href: "/dashboard/blok",
    icon: Building2,
  },
  {
    name: "Rekap",
    href: "/dashboard/rekap",
    icon: BarChart3,
  },
  {
    name: "Cetak",
    href: "/dashboard/cetak",
    icon: Printer,
  },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay Mobile */}
      {mobileOpen && (
        <button
          onClick={onCloseMobile}
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          border-r border-gray-200 bg-white
          transition-all duration-300 ease-in-out

          ${collapsed ? "lg:w-20" : "lg:w-64"}

          w-64
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header Sidebar */}
        <div
          className={`
            flex h-20 shrink-0 items-center border-b border-gray-200
            ${collapsed ? "justify-center px-3" : "px-6"}
          `}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white">
              <HandCoins size={22} />
            </div>

            {!collapsed && (
              <div className="whitespace-nowrap">
                <h1 className="text-sm font-bold text-gray-900">
                  Rekap Persembahan
                </h1>

                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            )}
          </div>

          {/* Tombol X khusus mobile */}
          <button
            onClick={onCloseMobile}
            aria-label="Tutup menu"
            className="ml-auto rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X size={21} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.name : undefined}
                className={`
                  flex items-center rounded-xl py-3
                  text-sm font-medium transition

                  ${collapsed ? "justify-center px-3" : "gap-3 px-4"}

                  ${
                    isActive
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <Icon size={20} className="shrink-0" />

                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-gray-200 p-3">
          <button
            onClick={onLogout}
            title={collapsed ? "Keluar" : undefined}
            className={`
              flex w-full items-center rounded-xl py-3
              text-sm font-medium text-gray-600
              transition hover:bg-red-50 hover:text-red-600

              ${collapsed ? "justify-center px-3" : "gap-3 px-4"}
            `}
          >
            <LogOut size={20} className="shrink-0" />

            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
