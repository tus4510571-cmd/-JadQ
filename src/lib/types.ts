export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

export type ProductionStatus = 'Pending' | 'Cutting' | 'Printing' | 'Sewing' | 'QC' | 'Packing' | 'Ready To Ship' | 'Shipped';

export type OrderStatus = 'Pending' | 'In Production' | 'Ready to Ship' | 'Shipped';

export interface Customer {
  id: string;
  customer_name: string;
  phone: string;
  notes: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  order_date: string; // ISO string
  deadline_date?: string | null;
  payment_date?: string | null;
  status: OrderStatus;
}

export interface OrderItem {
  id: string;
  order_id: string;
  design_number: string;
  size: Size;
  quantity_ordered: number;
  quantity_completed: number;
  production_status: ProductionStatus;
}
