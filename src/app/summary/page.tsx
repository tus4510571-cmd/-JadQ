"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { OrderItem } from "@/lib/types";
import { QRCodeSVG } from 'qrcode.react';

export default function SummaryPage() {
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    api.getOrderItems().then(setItems);
  }, []);

  // Group by Design and Size
  const summary: Record<string, Record<string, { ordered: number, completed: number }>> = {};
  
  items.forEach(item => {
    if (!summary[item.design_number]) summary[item.design_number] = {};
    if (!summary[item.design_number][item.size]) summary[item.design_number][item.size] = { ordered: 0, completed: 0 };
    
    summary[item.design_number][item.size].ordered += item.quantity_ordered;
    summary[item.design_number][item.size].completed += item.quantity_completed;
  });

  const [selectedQR, setSelectedQR] = useState<{ design: string, size: string } | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Production Summary</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Global view of all designs across all active orders.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(summary).map(([design, sizes]) => {
          const totalOrdered = Object.values(sizes).reduce((a, b) => a + b.ordered, 0);
          const totalCompleted = Object.values(sizes).reduce((a, b) => a + b.completed, 0);
          const remaining = totalOrdered - totalCompleted;

          return (
            <div key={design} className="glass-card rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold truncate pr-2">{design}</h2>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-slate-500">Remaining</div>
                  <div className="text-xl font-bold text-amber-500">{remaining}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                {Object.entries(sizes).map(([size, counts]) => (
                  <div key={size} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary-500 dark:hover:border-primary-500 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center font-bold shadow-sm border border-slate-200 dark:border-slate-700">
                        {size}
                      </div>
                      <div>
                    {(() => {
                      let statusText = "Pending";
                      let statusColor = "text-slate-500";
                      
                      if (counts.ordered > 0 && counts.completed >= counts.ordered) {
                        statusText = "Complete";
                        statusColor = "text-emerald-500 font-semibold";
                      } else if (counts.completed > 0) {
                        statusText = "In Production";
                        statusColor = "text-amber-500 font-semibold";
                      }

                      return (
                        <>
                          <div className="text-sm font-medium">
                            <span className="text-emerald-600 dark:text-emerald-400">{counts.completed}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-slate-900 dark:text-white">{counts.ordered}</span>
                          </div>
                          <div className={`text-xs ${statusColor}`}>{statusText}</div>
                        </>
                      );
                    })()}
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedQR({ design, size })}
                      className="text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Show QR Code"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedQR(null)}>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Scan to Update</h3>
            <p className="text-slate-500 mb-8">{selectedQR.design} - Size {selectedQR.size}</p>
            
            <div className="bg-white p-4 rounded-xl inline-block mb-8 shadow-inner border border-slate-100">
              <QRCodeSVG 
                value={`https://garment-tracker.app/update?design=${encodeURIComponent(selectedQR.design)}&size=${selectedQR.size}`} 
                size={200}
                level="H"
              />
            </div>
            
            <button 
              onClick={() => setSelectedQR(null)}
              className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
