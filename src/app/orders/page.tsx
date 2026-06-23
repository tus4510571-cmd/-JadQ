"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Order } from "@/lib/types";
import Link from "next/link";
import { Search, Plus, Pencil, Save, X } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editDates, setEditDates] = useState({ deadline: '', payment: '' });

  useEffect(() => {
    api.getOrders().then(setOrders);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Order Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage customers and incoming orders.</p>
        </div>
        <Link 
          href="/orders/new" 
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-primary-500/20"
        >
          <Plus size={20} />
          <span>New Order</span>
        </Link>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search orders or customers..." 
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">Order Number</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Deadline</th>
                <th className="px-6 py-4 font-medium">Payment Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{order.order_number}</td>
                  <td className="px-6 py-4">{order.customer.customer_name}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(order.order_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {editingOrderId === order.id ? (
                      <input 
                        type="date" 
                        value={editDates.deadline}
                        onChange={(e) => setEditDates({ ...editDates, deadline: e.target.value })}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary-500"
                      />
                    ) : (
                      <span className="text-slate-500">
                        {order.deadline_date ? new Date(order.deadline_date).toLocaleDateString() : '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingOrderId === order.id ? (
                      <input 
                        type="date" 
                        value={editDates.payment}
                        onChange={(e) => setEditDates({ ...editDates, payment: e.target.value })}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary-500"
                      />
                    ) : (
                      <span className="text-slate-500">
                        {order.payment_date ? new Date(order.payment_date).toLocaleDateString() : '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border inline-block
                        ${order.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : ''}
                        ${order.status === 'In Production' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : ''}
                        ${order.status === 'Ready to Ship' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : ''}
                        ${order.status === 'Shipped' ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' : ''}
                      `}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                    {editingOrderId === order.id ? (
                      <>
                        <button 
                          onClick={async () => {
                            const dl = editDates.deadline || null;
                            const pd = editDates.payment || null;
                            const originalOrders = [...orders];
                            
                            setOrders(orders.map(o => o.id === order.id ? { ...o, deadline_date: dl, payment_date: pd } : o));
                            setEditingOrderId(null);
                            
                            try {
                              await api.updateOrderDates(order.id, dl, pd);
                            } catch (err) {
                              console.error("Failed to update dates", err);
                              setOrders(originalOrders);
                              alert("Failed to save changes");
                            }
                          }}
                          className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                          title="Save"
                        >
                          <Save size={16} />
                        </button>
                        <button 
                          onClick={() => setEditingOrderId(null)}
                          className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => {
                          setEditingOrderId(order.id);
                          setEditDates({
                            deadline: order.deadline_date ? new Date(order.deadline_date).toISOString().split('T')[0] : '',
                            payment: order.payment_date ? new Date(order.payment_date).toISOString().split('T')[0] : ''
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit Dates"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    <Link href={`/orders/${order.id}`} className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
