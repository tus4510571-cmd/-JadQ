"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  KanbanSquare, 
  TrendingUp, 
  QrCode, 
  History,
  Menu,
  X,
  Sparkles,
  LogOut,
  User
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Order Management", href: "/orders", icon: ShoppingCart },
  { name: "Production Board", href: "/production-board", icon: KanbanSquare },
  { name: "Order Progress", href: "/progress", icon: TrendingUp },
  { name: "Summary & QR", href: "/summary", icon: QrCode },
  { name: "History & Reports", href: "/history", icon: History, adminOnly: true },
  { name: "AI Analytics", href: "/ai-analytics", icon: Sparkles, adminOnly: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState<'admin' | 'production' | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const fetchUserAndRole = async () => {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setEmail(user.email);
        const userRole = await api.getUserRole(user.email, supabase);
        setRole(userRole);
      }
    };
    fetchUserAndRole();
  }, []);

  const handleLogout = async () => {
    const { createBrowserClient } = await import('@supabase/ssr');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (pathname === '/login') {
    return <main className="bg-slate-50 dark:bg-slate-900 min-h-screen">{children}</main>;
  }

  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly && role !== 'admin') return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary-500 text-white p-1.5 rounded-lg">
            <LayoutDashboard size={20} />
          </div>
          <span className="font-bold text-lg">GarmentTracker</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
            <LogOut size={20} />
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-600 dark:text-slate-300">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex flex-col shadow-xl md:shadow-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 text-white p-2 rounded-xl shadow-lg shadow-primary-500/30">
              <LayoutDashboard size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight hidden md:block">Garment<span className="text-primary-500">Tracker</span></span>
          </div>
          <button className="md:hidden text-slate-500" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <item.icon size={20} className={cn("transition-colors", isActive ? "text-primary-500" : "group-hover:text-primary-500")} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="hidden">
           {/* Removed from sidebar bottom to move to top right */}
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
        
        {/* Desktop Topbar */}
        <div className="hidden md:flex items-center justify-end px-8 py-4 z-10 relative">
          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            {email && (
              <div className="flex flex-col text-right mr-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{email}</span>
                <span className={cn(
                  "text-[10px] uppercase tracking-wider font-bold",
                  role === 'admin' ? "text-primary-500" : "text-slate-500"
                )}>
                  {role || 'Loading...'}
                </span>
              </div>
            )}
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <ThemeToggle />
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-xl transition-colors font-semibold text-sm"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-0 md:pt-2">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
