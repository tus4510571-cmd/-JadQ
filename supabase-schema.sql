-- Supabase Database Schema for Garment Production Tracker

-- Customers Table
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Production', 'Ready to Ship', 'Shipped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table (Granular tracking by SKU: Design x Size)
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  design_number VARCHAR(255) NOT NULL,
  size VARCHAR(20) NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', 'XXL', 'XXXL')),
  quantity_ordered INTEGER NOT NULL DEFAULT 0,
  quantity_completed INTEGER NOT NULL DEFAULT 0,
  production_status VARCHAR(50) DEFAULT 'Pending' CHECK (production_status IN ('Pending', 'Cutting', 'Printing', 'Sewing', 'QC', 'Packing', 'Ready To Ship', 'Shipped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_status ON order_items(production_status);
CREATE INDEX idx_order_items_design_size ON order_items(design_number, size);
