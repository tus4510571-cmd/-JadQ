"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Order } from "@/lib/types";
import { Search, Filter, Download } from "lucide-react";

export default function HistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    // In a real app, this would fetch only shipped/completed orders
    api.getOrders().then(data => {
      setOrders(data.filter(o => o.status === 'Shipped' || o.status === 'Ready to Ship'));
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">History & Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Past orders and production analytics.</p>
        </div>
        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Download size={20} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-card rounded-2xl p-6 border-t-4 border-t-emerald-500">
          <div className="text-sm font-medium text-slate-500">Total Completed</div>
          <div className="text-3xl font-bold mt-2">{orders.length} Orders</div>
        </div>
        <div className="glass-card rounded-2xl p-6 border-t-4 border-t-blue-500">
          <div className="text-sm font-medium text-slate-500">Items Produced</div>
          <div className="text-3xl font-bold mt-2">1,240 <span className="text-sm font-normal text-slate-400">pcs</span></div>
        </div>
        <div className="glass-card rounded-2xl p-6 border-t-4 border-t-purple-500">
          <div className="text-sm font-medium text-slate-500">Avg. Production Time</div>
          <div className="text-3xl font-bold mt-2">4.2 <span className="text-sm font-normal text-slate-400">days</span></div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by customer or order #..." 
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">Order Number</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Completed Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No completed orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{order.order_number}</td>
                    <td className="px-6 py-4">{order.customer.customer_name}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(order.order_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
