"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Calendar } from "lucide-react";
import { api } from "@/lib/api";

export default function AIAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("all-time");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
  }, []);

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

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeRange }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analysis");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-primary-500" /> AI Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Get intelligent insights on your sales and production data.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
            <Calendar size={18} className="text-slate-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-0 outline-none"
            >
              <option value="all-time">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-7-days">Last 7 Days</option>
            </select>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-md shadow-primary-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? "Analyzing..." : "Analyze Data"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      {analysis && !loading && (
        <div className="glass-card p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Sparkles size={20} className="text-primary-500" /> Insights & Recommendations
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {analysis}
          </div>
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <Sparkles size={48} className="mb-4 opacity-50" />
          <p>Select a time range and click "Analyze Data" to generate AI insights.</p>
        </div>
      )}
    </div>
  );
}
