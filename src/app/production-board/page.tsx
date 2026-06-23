"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { OrderItem, ProductionStatus } from "@/lib/types";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, useDroppable } from '@dnd-kit/core';
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

function SortableItem({ item, onUpdateQuantity, viewMode }: { item: any, onUpdateQuantity: (id: string, q: number) => void, viewMode: 'sku' | 'customer' }) {
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

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const val = window.prompt(`Update completed quantity for Size ${item.size} (0 - ${item.quantity_ordered}):`, item.quantity_completed.toString());
    if (val !== null) {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= 0 && num <= item.quantity_ordered) {
        onUpdateQuantity(item.id, num);
      } else {
        alert("Invalid quantity. Please enter a valid number within the ordered range.");
      }
    }
  };

  if (viewMode === 'customer') {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} 
        className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative overflow-hidden group">
        <div 
          className="absolute left-0 bottom-0 h-1 bg-primary-500 transition-all" 
          style={{ width: `${progress}%` }} 
        />
        <div className="flex justify-between items-center gap-2">
          <div className="flex-1 truncate">
            <span className="font-bold text-sm text-slate-900 dark:text-white mr-2">{item.design_number}</span>
            <span className="text-xs font-semibold text-slate-500">Size {item.size}</span>
          </div>
          <button 
            onClick={handleEditClick}
            onPointerDown={(e) => e.stopPropagation()}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${progress === 100 ? "text-emerald-500" : "text-primary-600"}`}
            title="Click to edit quantity"
          >
            {item.quantity_completed}/{item.quantity_ordered}
          </button>
        </div>
      </div>
    );
  }

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
        <button 
          onClick={handleEditClick}
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag conflict
          className={`px-2 py-0.5 rounded transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${progress === 100 ? "text-emerald-500" : "text-primary-600"}`}
          title="Click to edit quantity"
        >
          {item.quantity_completed} / {item.quantity_ordered}
        </button>
      </div>
    </div>
  );
}


function DroppableColumn({ col, items, Icon, handleUpdateQuantity, viewMode }: { col: ProductionStatus, items: any[], Icon: any, handleUpdateQuantity: any, viewMode: 'sku' | 'customer' }) {
  const { setNodeRef } = useDroppable({
    id: col,
  });

  return (
    <div className="flex-none w-80 flex flex-col bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 snap-start">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-slate-500" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">{col}</h3>
        </div>
        <span className="text-xs font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded-full shadow-sm">
          {items.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="flex-1 flex flex-col p-3 min-h-[150px]">
        <SortableContext id={col} items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex-1 overflow-y-auto space-y-3">
            {items.map(item => (
              <SortableItem key={item.id} item={item} onUpdateQuantity={handleUpdateQuantity} viewMode={viewMode} />
            ))}
            {items.length === 0 && (
              <div className="h-24 mt-2 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl opacity-50">
                <span className="text-sm">Drop here</span>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function ProductionBoard() {
  const [items, setItems] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'sku' | 'customer'>('sku');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  useEffect(() => {
    api.getOrderItems().then(data => {
      setItems(data);
      if (data.length > 0) {
        // Set initial customer
        const customers = Array.from(new Set(data.map(i => i.order.customer.id)));
        if (customers.length > 0) setSelectedCustomerId(customers[0]);
      }
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over) {
      // Find the destination column. It can be the column ID itself or an item inside the column
      let newStatus: ProductionStatus | null = null;
      
      if (COLUMNS.includes(over.id as ProductionStatus)) {
        // Dropped directly on the column
        newStatus = over.id as ProductionStatus;
      } else {
        // Dropped on another item, find its column
        const overItem = items.find(i => i.id === over.id);
        if (overItem) {
          newStatus = overItem.production_status as ProductionStatus;
        }
      }

      if (newStatus && COLUMNS.includes(newStatus)) {
        const itemId = active.id as string;
        const activeItem = items.find(i => i.id === itemId);
        
        if (activeItem && activeItem.production_status !== newStatus) {
          // Optimistic update
          setItems((prev) => 
            prev.map(i => i.id === itemId ? { ...i, production_status: newStatus! } : i)
          );

          // API update
          try {
            await api.updateItemStatus(itemId, newStatus);
            // refresh to get accurate quantities if it auto-completed
            const updatedItems = await api.getOrderItems();
            setItems(updatedItems);
          } catch (e) {
            console.error(e);
            alert("Failed to update status");
            const updatedItems = await api.getOrderItems();
            setItems(updatedItems);
          }
        }
      }
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    // Optimistic update
    setItems((prev) => 
      prev.map(i => i.id === itemId ? { ...i, quantity_completed: quantity } : i)
    );
    try {
      await api.updateItemCompletedQuantity(itemId, quantity);
      const updatedItems = await api.getOrderItems();
      setItems(updatedItems);
    } catch (error) {
      console.error(error);
      alert("Failed to update quantity");
      const updatedItems = await api.getOrderItems();
      setItems(updatedItems);
    }
  };

  // Get unique customers for the dropdown
  const uniqueCustomersMap = new Map();
  items.forEach(i => {
    if (!uniqueCustomersMap.has(i.order.customer.id)) {
      uniqueCustomersMap.set(i.order.customer.id, i.order.customer.customer_name);
    }
  });
  const uniqueCustomers = Array.from(uniqueCustomersMap.entries()).map(([id, name]) => ({ id, name }));

  // Filter items based on view mode
  const displayedItems = viewMode === 'customer' && selectedCustomerId 
    ? items.filter(i => i.order.customer.id === selectedCustomerId)
    : items;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col overflow-y-auto pr-2">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Production Board</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Drag and drop SKU batches across stages.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {viewMode === 'customer' && (
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {uniqueCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('sku')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'sku' 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              By SKU
            </button>
            <button
              onClick={() => setViewMode('customer')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'customer' 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              By Customer
            </button>
          </div>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 snap-x">
          {COLUMNS.map(col => {
            const colItems = displayedItems.filter(i => i.production_status === col);
            const Icon = COLUMN_ICONS[col];
            
            return <DroppableColumn key={col} col={col} items={colItems} Icon={Icon} handleUpdateQuantity={handleUpdateQuantity} viewMode={viewMode} />;
          })}
        </div>
      </DndContext>

      {viewMode === 'customer' && selectedCustomerId && displayedItems.length > 0 && (
        <div className="mt-8 p-6 glass-card rounded-2xl flex-shrink-0">
          <h2 className="text-xl font-bold mb-4">Summary for {uniqueCustomersMap.get(selectedCustomerId)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(
              displayedItems.reduce((acc, item) => {
                if (!acc[item.design_number]) acc[item.design_number] = [];
                acc[item.design_number].push(item);
                return acc;
              }, {} as Record<string, any[]>)
            ).map(([design, items]) => (
              <div key={design} className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">{design}</h3>
                <div className="space-y-2">
                  {(items as any[]).map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Size {item.size}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{item.quantity_completed}/{item.quantity_ordered}</span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                          {item.production_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
