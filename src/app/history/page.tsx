"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Download, BarChart2, PieChart as PieChartIcon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ['#94a3b8', '#818cf8', '#a7f3d0', '#fbcfe8', '#fde047', '#cbd5e1'];

export default function HistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  
  // Chart Controls
  const [xAxis, setXAxis] = useState<"date" | "design" | "size">("date");
  const [yAxis, setYAxis] = useState<"quantity" | "orders">("quantity");

  useEffect(() => {
    Promise.all([
      api.getOrders(),
      api.getOrderItems()
    ]).then(([ordersData, itemsData]) => {
      setOrders(ordersData);
      setOrderItems(itemsData);
    });
  }, []);

  // Process data for charts
  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};

    if (xAxis === "date") {
      orders.forEach(order => {
        const dateStr = new Date(order.order_date).toLocaleDateString();
        if (!dataMap[dateStr]) dataMap[dateStr] = 0;
        
        if (yAxis === "orders") {
          dataMap[dateStr] += 1;
        }
      });

      if (yAxis === "quantity") {
        orderItems.forEach(item => {
          if (item.order && item.order.order_date) {
            const dateStr = new Date(item.order.order_date).toLocaleDateString();
            if (!dataMap[dateStr]) dataMap[dateStr] = 0;
            dataMap[dateStr] += item.quantity_ordered;
          }
        });
      }
    } else if (xAxis === "design") {
      orderItems.forEach(item => {
        const key = item.design_number || "Unknown";
        if (!dataMap[key]) dataMap[key] = 0;
        dataMap[key] += yAxis === "quantity" ? item.quantity_ordered : 1;
      });
    } else if (xAxis === "size") {
      orderItems.forEach(item => {
        const key = item.size || "Unknown";
        if (!dataMap[key]) dataMap[key] = 0;
        dataMap[key] += yAxis === "quantity" ? item.quantity_ordered : 1;
      });
    }

    return Object.entries(dataMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [orders, orderItems, xAxis, yAxis]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">History & Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Analytics and past production data.</p>
        </div>
        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-5 py-2.5 rounded-full font-medium transition-colors shadow-glass">
          <Download size={20} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Analytics Section */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart2 className="text-primary-500" /> Data Visualization
          </h2>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 px-2">
              <span className="text-sm font-medium text-slate-500">View By (X):</span>
              <select 
                value={xAxis} 
                onChange={(e) => setXAxis(e.target.value as any)}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="date">Date</option>
                <option value="design">Design</option>
                <option value="size">Size</option>
              </select>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-2 px-2">
              <span className="text-sm font-medium text-slate-500">Metric (Y):</span>
              <select 
                value={yAxis} 
                onChange={(e) => setYAxis(e.target.value as any)}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="quantity">Total Quantity</option>
                <option value="orders">Number of Orders/Items</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Line Chart */}
          <div className="h-80 w-full">
            <h3 className="text-sm font-medium text-slate-500 mb-4 text-center">Trend Overview</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--primary)" 
                  strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="h-80 w-full">
            <h3 className="text-sm font-medium text-slate-500 mb-4 text-center">Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-3xl overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-5 font-medium">Order Number</th>
                <th className="px-6 py-5 font-medium">Customer</th>
                <th className="px-6 py-5 font-medium">Completed Date</th>
                <th className="px-6 py-5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{order.order_number}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{order.customer?.customer_name}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(order.order_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30">
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
