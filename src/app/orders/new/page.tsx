"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Customer, Size } from "@/lib/types";
import { Save, ArrowLeft, Trash2, Plus } from "lucide-react";
import Link from "next/link";

interface MatrixRow {
  design_number: string;
  sizes: Record<Size, number>;
}

const SIZES: Size[] = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export default function NewOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [matrix, setMatrix] = useState<MatrixRow[]>([
    { design_number: "Design 1", sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 } }
  ]);

  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  useEffect(() => {
    api.getCustomers().then(setCustomers);
  }, []);

  const handleSizeChange = (rowIndex: number, size: Size, value: string) => {
    const numValue = parseInt(value) || 0;
    const newMatrix = [...matrix];
    newMatrix[rowIndex].sizes[size] = numValue;
    setMatrix(newMatrix);
  };

  const handleDesignChange = (rowIndex: number, value: string) => {
    const newMatrix = [...matrix];
    newMatrix[rowIndex].design_number = value;
    setMatrix(newMatrix);
  };

  const addRow = () => {
    setMatrix([...matrix, { design_number: `Design ${matrix.length + 1}`, sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 } }]);
  };

  const removeRow = (index: number) => {
    if (matrix.length > 1) {
      setMatrix(matrix.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!isNewCustomer && !selectedCustomerId) {
      alert("Please select a customer or create a new one");
      return;
    }
    
    if (isNewCustomer && !newCustomerName.trim()) {
      alert("Please enter the new customer's name");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCustomerId = selectedCustomerId;
      
      if (isNewCustomer) {
        const created = await api.addCustomer({
          customer_name: newCustomerName,
          phone: newCustomerPhone,
          notes: ""
        });
        finalCustomerId = created.id;
      }

      const orderItems: any[] = [];
      matrix.forEach(row => {
        SIZES.forEach(size => {
          if (row.sizes[size] > 0) {
            orderItems.push({
              design_number: row.design_number,
              size,
              quantity_ordered: row.sizes[size],
              quantity_completed: 0,
              production_status: 'Pending'
            });
          }
        });
      });

      if (orderItems.length === 0) {
        alert("Please enter at least one item quantity");
        setIsSubmitting(false);
        return;
      }

      await api.addOrder(
        { order_number: `ORD-${Math.floor(1000 + Math.random() * 9000)}`, customer_id: finalCustomerId, order_date: new Date().toISOString(), status: 'Pending' },
        orderItems
      );
      
      router.push('/orders');
    } catch (e) {
      console.error(e);
      alert("Error saving order");
      setIsSubmitting(false);
    }
  };

  const totalItems = matrix.reduce((sum, row) => sum + Object.values(row.sizes).reduce((a, b) => a + b, 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/orders" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Create New Order</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Matrix input for rapid order entry.</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">1. Customer Details</h2>
          <button 
            onClick={() => setIsNewCustomer(!isNewCustomer)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {isNewCustomer ? "Select Existing Customer" : "+ Add New Customer"}
          </button>
        </div>
        
        {isNewCustomer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name *</label>
              <input 
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input 
                type="text"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter phone"
              />
            </div>
          </div>
        ) : (
          <select 
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.customer_name} {c.phone ? `(${c.phone})` : ''}</option>
            ))}
          </select>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">2. Matrix Order Input</h2>
          <div className="text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-lg font-medium">
            Total Items: {totalItems}
          </div>
        </div>

        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 w-1/4">Design / Pattern</th>
              {SIZES.map(size => (
                <th key={size} className="pb-4 font-semibold text-center text-slate-500 dark:text-slate-400 w-[10%]">{size}</th>
              ))}
              <th className="pb-4 w-[5%]"></th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            {matrix.map((row, idx) => (
              <tr key={idx} className="group">
                <td className="pr-4 py-2">
                  <input 
                    type="text" 
                    value={row.design_number}
                    onChange={(e) => handleDesignChange(idx, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                    placeholder="e.g. Vintage Logo"
                  />
                </td>
                {SIZES.map(size => (
                  <td key={size} className="px-1 py-2">
                    <input 
                      type="number" 
                      min="0"
                      value={row.sizes[size] === 0 ? '' : row.sizes[size]}
                      onChange={(e) => handleSizeChange(idx, size, e.target.value)}
                      className="w-full text-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                      placeholder="0"
                    />
                  </td>
                ))}
                <td className="pl-4 py-2 text-right">
                  <button 
                    onClick={() => removeRow(idx)}
                    disabled={matrix.length === 1}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button 
          onClick={addRow}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          <Plus size={16} /> Add Another Design
        </button>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/30 disabled:opacity-50"
        >
          <Save size={20} />
          {isSubmitting ? "Saving..." : "Save Order"}
        </button>
      </div>
    </div>
  );
}
