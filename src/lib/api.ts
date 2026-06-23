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
  
  getOrderById: async (id: string): Promise<Order & { customer: Customer }> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:customers(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Order & { customer: Customer };
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

  getOrderItemsByOrderId: async (orderId: string): Promise<OrderItem[]> => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as OrderItem[];
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) throw error;

    // Sync down to items
    let itemStatus: ProductionStatus | null = null;
    if (status === 'Pending') itemStatus = 'Pending';
    else if (status === 'In Production') itemStatus = 'Cutting'; 
    else if (status === 'Ready to Ship') itemStatus = 'Ready To Ship';
    else if (status === 'Shipped') itemStatus = 'Shipped';

    if (itemStatus) {
      if (itemStatus === 'Ready To Ship' || itemStatus === 'Shipped') {
        const { data: items } = await supabase.from('order_items').select('id, quantity_ordered').eq('order_id', orderId);
        if (items) {
          for (const item of items) {
             await supabase.from('order_items').update({
               production_status: itemStatus,
               quantity_completed: item.quantity_ordered
             }).eq('id', item.id);
          }
        }
      } else if (itemStatus === 'Pending') {
        await supabase.from('order_items').update({
          production_status: itemStatus,
          quantity_completed: 0
        }).eq('order_id', orderId);
      } else {
        // In Production: if items are Pending, Ready to Ship, or Shipped, move them to Cutting
        const { data: items } = await supabase.from('order_items').select('id, production_status').eq('order_id', orderId);
        if (items) {
          for (const item of items) {
            if (item.production_status === 'Pending' || item.production_status === 'Ready To Ship' || item.production_status === 'Shipped') {
              await supabase.from('order_items').update({
                production_status: 'Cutting'
              }).eq('id', item.id);
            }
          }
        }
      }
    }
  },

  syncOrderStatusFromItems: async (orderId: string): Promise<void> => {
    // Fetch all items for this order
    const { data: items, error: fetchError } = await supabase
      .from('order_items')
      .select('production_status')
      .eq('order_id', orderId);

    if (fetchError || !items) throw fetchError || new Error("Items not found");

    if (items.length === 0) return; // Should not happen, but safe check

    const allShipped = items.every(item => item.production_status === 'Shipped');
    const allReadyOrShipped = items.every(item => item.production_status === 'Ready To Ship' || item.production_status === 'Shipped');
    const allPending = items.every(item => item.production_status === 'Pending');

    let macroStatus = 'In Production';
    if (allShipped) macroStatus = 'Shipped';
    else if (allReadyOrShipped) macroStatus = 'Ready to Ship';
    else if (allPending) macroStatus = 'Pending';

    // Update order status
    await supabase.from('orders').update({ status: macroStatus }).eq('id', orderId);
  },

  updateItemStatus: async (itemId: string, status: ProductionStatus): Promise<void> => {
    // First fetch the item to get quantity_ordered and order_id
    const { data: item } = await supabase.from('order_items').select('quantity_ordered, order_id').eq('id', itemId).single();
    if (!item) throw new Error("Item not found");

    // Also auto-update quantity completed if status is Ready To Ship or Shipped
    let updatePayload: any = { production_status: status };
    
    if (status === 'Ready To Ship' || status === 'Shipped') {
      updatePayload.quantity_completed = item.quantity_ordered;
    } else if (status === 'Pending') {
      updatePayload.quantity_completed = 0;
    }

    const { error } = await supabase
      .from('order_items')
      .update(updatePayload)
      .eq('id', itemId);

    if (error) throw error;

    // Sync order status
    await api.syncOrderStatusFromItems(item.order_id);
  },

  updateItemCompletedQuantity: async (itemId: string, quantity: number): Promise<void> => {
    // First get the item to check total ordered
    const { data: item, error: fetchError } = await supabase
      .from('order_items')
      .select('quantity_ordered, production_status, order_id')
      .eq('id', itemId)
      .single();
    
    if (fetchError || !item) throw fetchError || new Error("Item not found");

    const newCompleted = Math.min(quantity, item.quantity_ordered);
    let newStatus = item.production_status;

    if (newCompleted === item.quantity_ordered) {
      newStatus = 'Ready To Ship';
    } else if (newCompleted === 0 && item.production_status === 'Ready To Ship') {
      // Revert if someone mistakenly set to 0 but it was ready to ship
      newStatus = 'Pending';
    }

    const { error } = await supabase
      .from('order_items')
      .update({
        quantity_completed: newCompleted,
        production_status: newStatus
      })
      .eq('id', itemId);

    if (error) throw error;

    // Sync order status
    await api.syncOrderStatusFromItems(item.order_id);
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
