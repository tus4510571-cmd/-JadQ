"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Order, OrderItem } from "@/lib/types";
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  CheckCircle2,
  Activity
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    inProduction: 0,
    readyToShip: 0,
    shipped: 0,
  });
  const [recentItems, setRecentItems] = useState<(OrderItem & { order: Order })[]>([]);

  useEffect(() => {
    async function loadData() {
      const orders = await api.getOrders();
      const items = await api.getOrderItems();

      setStats({
        totalOrders: orders.length,
        inProduction: orders.filter(o => o.status === 'In Production').length,
        readyToShip: orders.filter(o => o.status === 'Ready to Ship').length,
        shipped: orders.filter(o => o.status === 'Shipped').length,
      });

      setRecentItems(items.slice(-5).reverse());
    }
    loadData();
  }, []);

  const kpis = [
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "bg-blue-500", lightColor: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
    { label: "In Production", value: stats.inProduction, icon: Activity, color: "bg-amber-500", lightColor: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" },
    { label: "Ready to Ship", value: stats.readyToShip, icon: Package, color: "bg-primary-500", lightColor: "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400" },
    { label: "Shipped", value: stats.shipped, icon: Truck, color: "bg-emerald-500", lightColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of your garment production today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="glass-card rounded-2xl p-6 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
            <div className={`p-3 rounded-xl ${kpi.lightColor}`}>
              <kpi.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Activities</h2>
          </div>
          <div className="space-y-4">
            {recentItems.length === 0 ? (
              <p className="text-slate-500 text-sm">No recent activities.</p>
            ) : (
              recentItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 p-2 rounded-lg">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {item.design_number} - Size {item.size}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Order {item.order.order_number} &bull; {item.quantity_completed}/{item.quantity_ordered} completed
                    </p>
                  </div>
                  <div className="text-sm font-semibold px-3 py-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700">
                    {item.production_status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions or secondary widget */}
        <div className="glass-card rounded-2xl p-6">
           <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
           <div className="space-y-3">
             <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors border border-slate-200 dark:border-slate-700">
               + Create New Order
             </button>
             <button className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors border border-slate-200 dark:border-slate-700">
               Scan QR Code
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
