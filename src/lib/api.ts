import { Customer, Order, OrderItem, ProductionStatus } from './types';

// Mock Data
export let mockCustomers: Customer[] = [
  { id: 'c1', customer_name: 'John Doe', phone: '0812345678', notes: 'VIP Customer' },
  { id: 'c2', customer_name: 'Jane Smith', phone: '0898765432', notes: '' },
];

export let mockOrders: Order[] = [
  { id: 'o1', order_number: 'ORD-001', customer_id: 'c1', order_date: '2026-06-01T10:00:00Z', status: 'In Production' },
  { id: 'o2', order_number: 'ORD-002', customer_id: 'c2', order_date: '2026-06-10T14:30:00Z', status: 'Pending' },
];

export let mockOrderItems: OrderItem[] = [
  { id: 'oi1', order_id: 'o1', design_number: 'Design 1', size: 'S', quantity_ordered: 50, quantity_completed: 50, production_status: 'Ready To Ship' },
  { id: 'oi2', order_id: 'o1', design_number: 'Design 1', size: 'M', quantity_ordered: 100, quantity_completed: 60, production_status: 'Sewing' },
  { id: 'oi3', order_id: 'o1', design_number: 'Design 2', size: 'L', quantity_ordered: 200, quantity_completed: 0, production_status: 'Cutting' },
  { id: 'oi4', order_id: 'o2', design_number: 'Design 3', size: 'XL', quantity_ordered: 20, quantity_completed: 0, production_status: 'Pending' },
];

// Mock API Functions
export const api = {
  // Customers
  getCustomers: async (): Promise<Customer[]> => [...mockCustomers],
  addCustomer: async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const newCustomer = { ...customer, id: `c${Date.now()}` };
    mockCustomers.push(newCustomer);
    return newCustomer;
  },

  // Orders
  getOrders: async (): Promise<(Order & { customer: Customer })[]> => {
    return mockOrders.map(o => ({
      ...o,
      customer: mockCustomers.find(c => c.id === o.customer_id)!
    }));
  },
  
  getOrderItems: async (): Promise<(OrderItem & { order: Order & { customer: Customer }})[]> => {
    return mockOrderItems.map(oi => {
      const order = mockOrders.find(o => o.id === oi.order_id)!;
      const customer = mockCustomers.find(c => c.id === order.customer_id)!;
      return { ...oi, order: { ...order, customer } };
    });
  },

  updateItemStatus: async (itemId: string, status: ProductionStatus): Promise<void> => {
    const item = mockOrderItems.find(oi => oi.id === itemId);
    if (item) {
      item.production_status = status;
      // Auto-update quantity completed if Ready To Ship or Shipped
      if (status === 'Ready To Ship' || status === 'Shipped') {
          item.quantity_completed = item.quantity_ordered;
      }
    }
  },

  updateItemCompletedQuantity: async (itemId: string, quantity: number): Promise<void> => {
    const item = mockOrderItems.find(oi => oi.id === itemId);
    if (item) {
      item.quantity_completed = Math.min(quantity, item.quantity_ordered);
      if (item.quantity_completed === item.quantity_ordered) {
          item.production_status = 'Ready To Ship';
      }
    }
  },

  addOrder: async (order: Omit<Order, 'id'>, items: Omit<OrderItem, 'id' | 'order_id'>[]): Promise<void> => {
    const newOrder = { ...order, id: `o${Date.now()}` };
    mockOrders.push(newOrder);
    
    const newItems = items.map((item, index) => ({
      ...item,
      id: `oi${Date.now()}-${index}`,
      order_id: newOrder.id
    }));
    mockOrderItems.push(...newItems);
  }
};
