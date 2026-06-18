"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Order, OrderItem } from "@/lib/types";

export default function ProgressPage() {
  const [orders, setOrders] = useState<(Order & { customer: any, items: OrderItem[] })[]>([]);

  useEffect(() => {
    async function load() {
      const allOrders = await api.getOrders();
      const allItems = await api.getOrderItems();
      
      const ordersWithItems = allOrders.map(o => ({
        ...o,
        items: allItems.filter(i => i.order_id === o.id)
      })).filter(o => o.status !== 'Shipped'); // Only show active orders

      setOrders(ordersWithItems);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Order Progress</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Detailed view of active orders and their completion status.</p>
      </div>

      <div className="space-y-6">
        {orders.map(order => {
          const totalOrdered = order.items.reduce((sum, item) => sum + item.quantity_ordered, 0);
          const totalCompleted = order.items.reduce((sum, item) => sum + item.quantity_completed, 0);
          const overallProgress = totalOrdered > 0 ? Math.round((totalCompleted / totalOrdered) * 100) : 0;

          return (
            <div key={order.id} className="glass-card rounded-2xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold">{order.order_number}</h2>
                  <p className="text-sm text-slate-500">{order.customer.customer_name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{overallProgress}%</div>
                  <p className="text-xs text-slate-500">Overall Progress</p>
                </div>
              </div>

              {/* Overall Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-6">
                <div className="bg-primary-500 h-full transition-all" style={{ width: `${overallProgress}%` }} />
              </div>

              <div className="space-y-4">
                {/* Group items by design */}
                {Array.from(new Set(order.items.map(i => i.design_number))).map(design => {
                  const designItems = order.items.filter(i => i.design_number === design);
                  
                  return (
                    <div key={design} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                      <h3 className="font-semibold mb-3">{design}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {designItems.map(item => (
                          <div key={item.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 text-center border border-slate-100 dark:border-slate-800">
                            <div className="text-xs font-bold text-slate-500 mb-1">Size {item.size}</div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {item.quantity_completed} <span className="text-slate-400 font-normal">/ {item.quantity_ordered}</span>
                            </div>
                            {item.quantity_completed === item.quantity_ordered && (
                              <div className="mt-1 text-xs text-emerald-500 font-medium flex items-center justify-center gap-1">
                                <span>✓ Done</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {overallProgress === 100 && order.status !== 'Shipped' && (
                <div className="mt-6 flex justify-end">
                  <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20">
                    Mark as Shipped
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {orders.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-500">
            No active orders found.
          </div>
        )}
      </div>
    </div>
  );
}
