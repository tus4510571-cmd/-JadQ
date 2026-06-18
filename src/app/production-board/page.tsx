"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { OrderItem, ProductionStatus } from "@/lib/types";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Scissors, Printer, PenTool, CheckSquare, Package as PackageIcon, Truck, CheckCircle } from "lucide-react";

const COLUMNS: ProductionStatus[] = [
  'Pending', 'Cutting', 'Printing', 'Sewing', 'QC', 'Packing', 'Ready To Ship', 'Shipped'
];

const COLUMN_ICONS: Record<ProductionStatus, any> = {
  'Pending': Clock,
  'Cutting': Scissors,
  'Printing': Printer,
  'Sewing': PenTool,
  'QC': CheckSquare,
  'Packing': PackageIcon,
  'Ready To Ship': Truck,
  'Shipped': CheckCircle,
};

function SortableItem({ item }: { item: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const progress = Math.round((item.quantity_completed / item.quantity_ordered) * 100);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} 
      className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative overflow-hidden group">
      
      {/* Progress background bar */}
      <div 
        className="absolute left-0 bottom-0 h-1 bg-primary-500 transition-all" 
        style={{ width: `${progress}%` }} 
      />

      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md">
          {item.order.order_number}
        </span>
        <span className="text-xs font-semibold text-slate-500">Size {item.size}</span>
      </div>
      
      <p className="font-bold text-slate-900 dark:text-white truncate">{item.design_number}</p>
      <p className="text-sm text-slate-500 truncate mb-3">{item.order.customer.customer_name}</p>
      
      <div className="flex justify-between items-center text-sm font-medium">
        <span className="text-slate-600 dark:text-slate-400">Progress</span>
        <span className={progress === 100 ? "text-emerald-500" : "text-primary-600"}>
          {item.quantity_completed} / {item.quantity_ordered}
        </span>
      </div>
    </div>
  );
}

export default function ProductionBoard() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.getOrderItems().then(setItems);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Find what column we dropped over. We are using the column name as the droppable ID.
      const newStatus = over.id as ProductionStatus;
      if (COLUMNS.includes(newStatus)) {
        const itemId = active.id as string;
        
        // Optimistic update
        setItems((prev) => 
          prev.map(i => i.id === itemId ? { ...i, production_status: newStatus } : i)
        );

        // API update
        await api.updateItemStatus(itemId, newStatus);
        // refresh to get accurate quantities if it auto-completed
        const updatedItems = await api.getOrderItems();
        setItems(updatedItems);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Production Board</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Drag and drop SKU batches across stages.</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 snap-x">
          {COLUMNS.map(col => {
            const colItems = items.filter(i => i.production_status === col);
            const Icon = COLUMN_ICONS[col];
            
            return (
              <div key={col} className="flex-none w-80 flex flex-col bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 snap-start">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-slate-500" />
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300">{col}</h3>
                  </div>
                  <span className="text-xs font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded-full shadow-sm">
                    {colItems.length}
                  </span>
                </div>
                
                {/* Custom Droppable Area */}
                <SortableContext id={col} items={colItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[150px]">
                    {colItems.map(item => (
                      <SortableItem key={item.id} item={item} />
                    ))}
                    {colItems.length === 0 && (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl opacity-50">
                        <span className="text-sm">Drop here</span>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
