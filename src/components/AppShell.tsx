"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  KanbanSquare, 
  TrendingUp, 
  QrCode, 
  History,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Order Management", href: "/orders", icon: ShoppingCart },
  { name: "Production Board", href: "/production-board", icon: KanbanSquare },
  { name: "Order Progress", href: "/progress", icon: TrendingUp },
  { name: "Summary & QR", href: "/summary", icon: QrCode },
  { name: "History & Reports", href: "/history", icon: History },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-primary-500 text-white p-1.5 rounded-lg">
            <LayoutDashboard size={20} />
          </div>
          <span className="font-bold text-lg">GarmentTracker</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 text-white p-2 rounded-xl shadow-lg shadow-primary-500/30">
              <LayoutDashboard size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight">Garment<span className="text-primary-500">Tracker</span></span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <item.icon size={20} className={cn("transition-colors", isActive ? "text-primary-500" : "group-hover:text-primary-500")} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 hidden md:flex justify-between items-center">
          <div className="text-sm text-slate-500">Theme</div>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
