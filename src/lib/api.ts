import { supabase } from './supabase';
import { Customer, Order, OrderItem, ProductionStatus } from './types';

export const api = {
  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Customer[];
  },

  addCustomer: async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();
    
    if (error) throw error;
    return data as Customer;
  },

  // Orders
  getOrders: async (): Promise<(Order & { customer: Customer })[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:customers(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as (Order & { customer: Customer })[];
  },
  
  getOrderItems: async (): Promise<(OrderItem & { order: Order & { customer: Customer }})[]> => {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        order:orders(
          *,
          customer:customers(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Map because Supabase returns relations as objects/arrays based on cardinality
    // `order` is a single object here.
    return data as any; 
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) throw error;
  },

  updateItemStatus: async (itemId: string, status: ProductionStatus): Promise<void> => {
    // Also auto-update quantity completed if status is Ready To Ship or Shipped
    let updatePayload: any = { production_status: status };
    
    if (status === 'Ready To Ship' || status === 'Shipped') {
      // First fetch the item to get quantity_ordered
      const { data: item } = await supabase.from('order_items').select('quantity_ordered').eq('id', itemId).single();
      if (item) {
        updatePayload.quantity_completed = item.quantity_ordered;
      }
    }

    const { error } = await supabase
      .from('order_items')
      .update(updatePayload)
      .eq('id', itemId);

    if (error) throw error;
  },

  updateItemCompletedQuantity: async (itemId: string, quantity: number): Promise<void> => {
    // First get the item to check total ordered
    const { data: item, error: fetchError } = await supabase
      .from('order_items')
      .select('quantity_ordered, production_status')
      .eq('id', itemId)
      .single();
    
    if (fetchError || !item) throw fetchError || new Error("Item not found");

    const newCompleted = Math.min(quantity, item.quantity_ordered);
    let newStatus = item.production_status;

    if (newCompleted === item.quantity_ordered) {
      newStatus = 'Ready To Ship';
    }

    const { error } = await supabase
      .from('order_items')
      .update({
        quantity_completed: newCompleted,
        production_status: newStatus
      })
      .eq('id', itemId);

    if (error) throw error;
  },

  addOrder: async (order: Omit<Order, 'id'>, items: Omit<OrderItem, 'id' | 'order_id'>[]): Promise<void> => {
    // 1. Check if customer exists, if not create them (For simplicity here, assuming customer_id is passed or handled. In our UI, we use customer_id directly)
    // 2. Insert Order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: order.order_number,
        customer_id: order.customer_id,
        order_date: order.order_date,
        status: order.status
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 3. Insert Order Items
    const itemsToInsert = items.map(item => ({
      order_id: newOrder.id,
      design_number: item.design_number,
      size: item.size,
      quantity_ordered: item.quantity_ordered,
      quantity_completed: item.quantity_completed || 0,
      production_status: item.production_status || 'Pending'
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;
  }
};
