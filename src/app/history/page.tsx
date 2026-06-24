"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Download, BarChart2, PieChart as PieChartIcon, TrendingUp, Users } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ['#94a3b8', '#818cf8', '#a7f3d0', '#fbcfe8', '#fde047', '#cbd5e1'];
const BAR_COLOR = '#60a5fa'; // primary-500
const BAR_ALT_COLOR = '#a7f3d0';

export default function HistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  // Global Chart Controls
  const [xAxis, setXAxis] = useState<"date" | "design" | "size">("date");
  const [yAxis, setYAxis] = useState<"quantity" | "orders">("quantity");

  // Marketing Analytics Controls
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");

  const [role, setRole] = useState<'admin' | 'production' | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
       const { createBrowserClient } = await import('@supabase/ssr');
       const supabase = createBrowserClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
       );
       const { data: { user } } = await supabase.auth.getUser();
       if (user && user.email) {
          const userRole = await api.getUserRole(user.email);
          setRole(userRole);
          if (userRole !== 'admin') {
             window.location.href = '/'; // redirect if not admin
          }
       }
    };
    fetchUser();

    Promise.all([
      api.getOrders(),
      api.getOrderItems(),
      api.getCustomers()
    ]).then(([ordersData, itemsData, customersData]) => {
      setOrders(ordersData);
      setOrderItems(itemsData);
      setCustomers(customersData);
    });
  }, []);



  // --- KPIs Calculations ---
  const kpis = useMemo(() => {
    const totalOrders = orders.length;
    let totalItems = 0;
    orderItems.forEach(item => totalItems += item.quantity_ordered || 0);

    // Repeat customers
    const orderCountByCustomer: Record<string, number> = {};
    orders.forEach(o => {
      const cid = o.customer_id;
      orderCountByCustomer[cid] = (orderCountByCustomer[cid] || 0) + 1;
    });
    
    let repeatCount = 0;
    Object.values(orderCountByCustomer).forEach(count => {
      if (count > 1) repeatCount++;
    });
    
    const repeatPercent = customers.length > 0 ? Math.round((repeatCount / customers.length) * 100) : 0;

    return { totalOrders, totalItems, repeatPercent };
  }, [orders, orderItems, customers]);

  // --- Global Chart Data ---
  const globalChartData = useMemo(() => {
    const dataMap: Record<string, number> = {};

    if (xAxis === "date") {
      orders.forEach(order => {
        const dateStr = new Date(order.order_date).toLocaleDateString();
        if (!dataMap[dateStr]) dataMap[dateStr] = 0;
        if (yAxis === "orders") dataMap[dateStr] += 1;
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


  // --- Marketing Analytics Data ---
  const marketingData = useMemo(() => {
    if (selectedCustomerId === "all") {
      const customerVolume: Record<string, number> = {};
      const orderCountByCustomer: Record<string, {name: string, count: number}> = {};

      orderItems.forEach(item => {
        if (item.order && item.order.customer) {
          const name = item.order.customer.customer_name;
          customerVolume[name] = (customerVolume[name] || 0) + item.quantity_ordered;
        }
      });
      
      orders.forEach(o => {
         if (o.customer) {
            const name = o.customer.customer_name;
            if (!orderCountByCustomer[name]) {
               orderCountByCustomer[name] = { name, count: 0 };
            }
            orderCountByCustomer[name].count += 1;
         }
      });

      const topCustomers = Object.entries(customerVolume)
        .map(([name, volume]) => ({ name, volume }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10); // Top 10

      const loyaltyCustomers = Object.values(orderCountByCustomer)
        .filter(c => c.count > 1)
        .sort((a, b) => b.count - a.count);

      return { type: "all", data: topCustomers, loyaltyData: loyaltyCustomers };
    } else {
      // Specific Customer Deep Dive
      const designVolume: Record<string, number> = {};
      const sizeVolume: Record<string, number> = {};
      let totalSpent = 0; // if we had price, but we use quantity as proxy

      orderItems.forEach(item => {
        if (item.order && item.order.customer_id === selectedCustomerId) {
          const design = item.design_number || "Unknown";
          const size = item.size || "Unknown";
          
          designVolume[design] = (designVolume[design] || 0) + item.quantity_ordered;
          sizeVolume[size] = (sizeVolume[size] || 0) + item.quantity_ordered;
          totalSpent += item.quantity_ordered;
        }
      });

      const designData = Object.entries(designVolume).map(([name, volume]) => ({ name, volume })).sort((a, b) => b.volume - a.volume);
      const sizeData = Object.entries(sizeVolume).map(([name, volume]) => ({ name, volume })).sort((a, b) => b.volume - a.volume);

      return { type: "specific", designData, sizeData, totalSpent };
    }
  }, [selectedCustomerId, orderItems]);

  if (role === null) {
     return (
       <div className="flex items-center justify-center min-h-[60vh]">
         <div className="animate-pulse flex flex-col items-center">
           <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-slate-500">Checking permissions...</p>
         </div>
       </div>
     );
  }

  if (role !== 'admin') {
     return (
       <div className="flex items-center justify-center min-h-[60vh]">
         <div className="text-center">
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
           <p className="text-slate-500 mt-2">You do not have permission to view this page.</p>
         </div>
       </div>
     );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">History & Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Analytics, production data, and customer insights.</p>
        </div>
        <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-5 py-2.5 rounded-full font-medium transition-colors shadow-glass">
          <Download size={20} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-6 border-t-4 border-t-sky-400">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
             <BarChart2 size={16}/> Total Orders
          </div>
          <div className="text-4xl font-bold">{kpis.totalOrders}</div>
        </div>
        <div className="glass-card rounded-3xl p-6 border-t-4 border-t-emerald-400">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
             <TrendingUp size={16}/> Items Produced
          </div>
          <div className="text-4xl font-bold">{kpis.totalItems} <span className="text-base font-normal text-slate-400">pcs</span></div>
        </div>
        <div className="glass-card rounded-3xl p-6 border-t-4 border-t-indigo-400">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
             <Users size={16}/> Repeat Customers
          </div>
          <div className="text-4xl font-bold">{kpis.repeatPercent}% <span className="text-base font-normal text-slate-400">loyalty</span></div>
        </div>
      </div>

      {/* MARKETING ANALYTICS (NEW) */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Users className="text-indigo-500" /> Customer Marketing Analytics
          </h2>
          
          {/* Customer Filter */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-500 pl-2">Select Customer:</span>
            <select 
              value={selectedCustomerId} 
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="all">All Customers (Top Ranking)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.customer_name}</option>
              ))}
            </select>
          </div>
        </div>

        {marketingData.type === "all" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
            <div className="h-96 w-full">
              <h3 className="text-sm font-medium text-slate-500 mb-6 text-center">Top Customers by Volume (Pcs)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketingData.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="volume" fill={BAR_COLOR} radius={[6, 6, 0, 0]} animationDuration={1500}>
                    {
                      (marketingData.data as any[]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#818cf8' : BAR_COLOR} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-96 w-full">
              <h3 className="text-sm font-medium text-slate-500 mb-6 text-center">Loyalty Customers (2+ Orders)</h3>
              {marketingData.loyaltyData && marketingData.loyaltyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marketingData.loyaltyData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`${value} Orders`, 'Frequency']}
                    />
                    <Bar dataKey="count" fill="#fde047" radius={[6, 6, 0, 0]} animationDuration={1500}>
                      {
                        (marketingData.loyaltyData as any[]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#facc15' : '#fde047'} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                   No repeat customers yet.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
            {/* Design Preferences */}
            <div className="h-80 w-full">
              <h3 className="text-sm font-medium text-slate-500 mb-6 text-center">Most Bought Designs / Patterns</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketingData.designData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="volume" fill="#a7f3d0" radius={[0, 6, 6, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Size Preferences */}
            <div className="h-80 w-full">
              <h3 className="text-sm font-medium text-slate-500 mb-6 text-center">Size Preferences (Quantity)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketingData.sizeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="volume" fill="#fbcfe8" radius={[6, 6, 0, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Global Visualizations Section (Existing) */}
      <div className="glass-card p-6 md:p-8 rounded-3xl mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PieChartIcon className="text-slate-400" /> Overall Distribution & Trends
          </h2>
          
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 px-2">
              <span className="text-sm font-medium text-slate-500">View By:</span>
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
              <span className="text-sm font-medium text-slate-500">Metric:</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={globalChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
                  stroke="#60a5fa" 
                  strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={globalChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {globalChartData.map((entry, index) => (
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
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
           <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recent Orders Archive</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-5 font-medium">Order Number</th>
                <th className="px-6 py-5 font-medium">Customer</th>
                <th className="px-6 py-5 font-medium">Order Date</th>
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
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30">
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
