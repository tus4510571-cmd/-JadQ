"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Order, OrderItem } from "@/lib/types";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<(Order & { customer: any, items: OrderItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const orderData = await api.getOrderById(id);
        const itemsData = await api.getOrderItemsByOrderId(id);
        setOrder({ ...orderData, items: itemsData });
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Order not found</h2>
        <Link href="/orders" className="text-primary-600 hover:underline">Return to Orders</Link>
      </div>
    );
  }

  const totalOrdered = order.items.reduce((sum, item) => sum + item.quantity_ordered, 0);
  const totalCompleted = order.items.reduce((sum, item) => sum + item.quantity_completed, 0);
  const overallProgress = totalOrdered > 0 ? Math.round((totalCompleted / totalOrdered) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/orders" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-slate-600 dark:text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Order Details</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">View progress for order {order.order_number}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">{order.order_number}</h2>
            <p className="text-slate-500">{order.customer.customer_name}</p>
            <p className="text-sm text-slate-400 mt-1">Ordered on: {new Date(order.order_date).toLocaleDateString()}</p>
            {order.deadline_date && (
              <p className="text-sm text-amber-500 mt-1">Deadline: {new Date(order.deadline_date).toLocaleDateString()}</p>
            )}
            {order.payment_date && (
              <p className="text-sm text-emerald-500 mt-1">Payment Date: {new Date(order.payment_date).toLocaleDateString()}</p>
            )}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Status:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                ${order.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : ''}
                ${order.status === 'In Production' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : ''}
                ${order.status === 'Ready to Ship' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : ''}
                ${order.status === 'Shipped' ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' : ''}
              `}>
                {order.status}
              </span>
            </div>
          </div>
          <div className="text-right sm:text-right w-full sm:w-auto">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{overallProgress}%</div>
            <p className="text-sm text-slate-500">Overall Progress</p>
            <p className="text-xs font-medium mt-1 text-slate-400">{totalCompleted} / {totalOrdered} items completed</p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-8">
          <div className="bg-primary-500 h-full transition-all" style={{ width: `${overallProgress}%` }} />
        </div>

        <div className="space-y-6">
          <h3 className="font-bold text-lg mb-2 border-b border-slate-200 dark:border-slate-700 pb-2">Order Items</h3>
          
          {/* Group items by design */}
          {Array.from(new Set(order.items.map(i => i.design_number))).map(design => {
            const designItems = order.items.filter(i => i.design_number === design);
            
            return (
              <div key={design} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-white/50 dark:bg-slate-800/20">
                <h4 className="font-bold text-md mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  {design}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {designItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="text-xs font-bold text-slate-500 mb-1">Size {item.size}</div>
                      <div className="font-semibold text-slate-900 dark:text-white text-lg">
                        {item.quantity_completed} <span className="text-slate-400 font-normal text-sm">/ {item.quantity_ordered}</span>
                      </div>
                      
                      {/* Item Status Badge */}
                      <div className="mt-2 flex justify-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          item.production_status === 'Pending' ? 'bg-slate-100 text-slate-600' :
                          item.production_status === 'Ready To Ship' || item.production_status === 'Shipped' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {item.production_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
