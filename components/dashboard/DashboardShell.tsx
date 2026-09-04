"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { createClient } from "@/lib/supabase/client";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  function handleMenuClick() {
    // Desktop → collapse sidebar
    // Mobile → buka sidebar
    if (window.innerWidth >= 1024) {
      setCollapsed((prev) => !prev);
    } else {
      setMobileOpen((prev) => !prev);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Area */}
      <div
        className={`
          min-h-screen transition-all duration-300 ease-in-out

          ${collapsed ? "lg:ml-20" : "lg:ml-64"}

          print:ml-0
          print:min-h-0
        `}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white/95 px-4 backdrop-blur lg:px-6 print:hidden">
          {/* Satu tombol menu untuk Desktop + Mobile */}
          <button
            onClick={handleMenuClick}
            aria-label="Toggle menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            {mobileOpen ? <X size={23} /> : <Menu size={23} />}
          </button>

          {/* Judul */}
          <div className="ml-3">
            <p className="text-sm font-semibold text-gray-900">
              Rekap Persembahan
            </p>

            <p className="text-xs text-gray-500">Admin Dashboard</p>
          </div>
        </header>

        {/* Content */}
        <main
          className="
            min-h-[calc(100vh-4rem)]
            p-4 sm:p-6 lg:p-8
            print:min-h-0
            print:p-0
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}
