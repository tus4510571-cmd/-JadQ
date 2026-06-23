"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Order, OrderItem } from "@/lib/types";
import Link from "next/link";
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  CheckCircle2,
  Activity,
  Clock
} from "lucide-react";

export default function Dashboard() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [stats, setStats] = useState({
    totalOrders: 0,
    pending: 0,
    inProduction: 0,
    readyToShip: 0,
    shipped: 0,
  });
  const [ordersWithProgress, setOrdersWithProgress] = useState<(Order & { customer: any, items: OrderItem[] })[]>([]);

  useEffect(() => {
    async function loadData() {
      const orders = await api.getOrders();
      const items = await api.getOrderItems();

      setAllOrders(orders);
      
      const combined = orders.map(o => ({
        ...o,
        items: items.filter(i => i.order_id === o.id)
      })).filter(o => o.status !== 'Shipped'); // Only show active orders for progress

      // Sort by customer name
      combined.sort((a, b) => a.customer.customer_name.localeCompare(b.customer.customer_name));
      
      setOrdersWithProgress(combined);
    }
    loadData();
  }, []);

  useEffect(() => {
    const filteredOrders = allOrders.filter(o => {
      if (!startDate && !endDate) return true;
      const orderDate = new Date(o.order_date).getTime();
      const start = startDate ? new Date(startDate).getTime() : 0;
      // If end date is set, include the whole day by adding 24 hours (or setting to end of day)
      const end = endDate ? new Date(endDate).getTime() + 86400000 : Infinity;
      return orderDate >= start && orderDate <= end;
    });

    setStats({
      totalOrders: filteredOrders.length,
      pending: filteredOrders.filter(o => o.status === 'Pending').length,
      inProduction: filteredOrders.filter(o => o.status === 'In Production').length,
      readyToShip: filteredOrders.filter(o => o.status === 'Ready to Ship').length,
      shipped: filteredOrders.filter(o => o.status === 'Shipped').length,
    });
  }, [allOrders, startDate, endDate]);

  const kpis = [
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "bg-blue-500", lightColor: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "bg-slate-500", lightColor: "bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400" },
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
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 font-medium mb-1">From Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 font-medium mb-1">To Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="mt-5 text-xs text-primary-600 hover:text-primary-700 font-medium underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
        {/* Buyer Orders Progress */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Buyer Orders</h2>
          </div>
          <div className="space-y-6">
            {ordersWithProgress.length === 0 ? (
              <p className="text-slate-500 text-sm">No active orders.</p>
            ) : (
              ordersWithProgress.map(order => {
                const totalOrdered = order.items.reduce((sum, item) => sum + item.quantity_ordered, 0);
                const totalCompleted = order.items.reduce((sum, item) => sum + item.quantity_completed, 0);
                const overallProgress = totalOrdered > 0 ? Math.round((totalCompleted / totalOrdered) * 100) : 0;

                let deadlineBgColor = "bg-primary-500";
                let deadlineTextColor = "text-primary-600 dark:text-primary-400";
                let widthPercent = 0;
                let daysRemainingText = "";

                if (order.deadline_date) {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const deadline = new Date(order.deadline_date);
                  const diffTime = deadline.getTime() - today.getTime();
                  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (daysRemaining <= 10) {
                    deadlineBgColor = "bg-red-500";
                    deadlineTextColor = "text-red-600 dark:text-red-400";
                  } else if (daysRemaining <= 14) {
                    deadlineBgColor = "bg-amber-400";
                    deadlineTextColor = "text-amber-600 dark:text-amber-500";
                  } else if (daysRemaining < 0) {
                    deadlineBgColor = "bg-red-700";
                    deadlineTextColor = "text-red-700 dark:text-red-500";
                  }

                  widthPercent = Math.max(0, Math.min(100, (daysRemaining / 30) * 100));
                  daysRemainingText = daysRemaining < 0 ? `Overdue by ${Math.abs(daysRemaining)} days` : `${daysRemaining} days left`;
                }

                return (
                  <div key={order.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase">{order.customer.customer_name}</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{order.order_number}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 leading-none">{overallProgress}%</div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-1">Overall Progress</p>
                          </div>
                          <Link 
                            href={`/orders/${order.id}`}
                            className="ml-2 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                          >
                            Detail
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-4">
                      <div className="bg-primary-500 h-full transition-all" style={{ width: `${overallProgress}%` }} />
                    </div>

                    {/* Deadline Indicator */}
                    {order.deadline_date && (
                      <div>
                        <div className="flex justify-between items-end mb-1">
                          <div className={`text-xs font-medium ${deadlineTextColor}`}>
                            Deadline: {new Date(order.deadline_date).toLocaleDateString()}
                          </div>
                          <div className={`text-xs font-bold ${deadlineTextColor}`}>
                            {daysRemainingText}
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div className={`${deadlineBgColor} h-full transition-all`} style={{ width: `${widthPercent}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions & Recent */}
        <div className="glass-card rounded-2xl p-6">
           <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
           <div className="space-y-3">
             <Link href="/orders/new" className="block w-full text-center px-4 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm">
               + Create New Order
             </Link>
             <button className="w-full text-center px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
               Scan QR Code
             </button>
             <Link href="/progress" className="block w-full text-center px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
               Recent Activities
             </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
