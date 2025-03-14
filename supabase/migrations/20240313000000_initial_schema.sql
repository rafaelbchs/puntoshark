-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  images TEXT[] DEFAULT '{}',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  inventory_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  inventory_managed BOOLEAN NOT NULL DEFAULT TRUE,
  inventory_status TEXT NOT NULL DEFAULT 'in_stock',
  attributes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  total DECIMAL(10, 2) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  inventory_updated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  image TEXT,
  UNIQUE(order_id, product_id)
);

-- Create inventory logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  order_id TEXT,
  user_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for executing SQL (used by migration script)
CREATE OR REPLACE FUNCTION execute_sql(sql text) 
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for updating inventory
CREATE OR REPLACE FUNCTION update_inventory(
  p_product_id UUID,
  p_new_quantity INTEGER,
  p_new_status TEXT,
  p_previous_quantity INTEGER,
  p_reason TEXT,
  p_order_id TEXT DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_updated_product products%ROWTYPE;
  v_log inventory_logs%ROWTYPE;
BEGIN
  -- Update product
  UPDATE products
  SET 
    inventory_quantity = p_new_quantity,
    inventory_status = p_new_status,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_product_id
  RETURNING * INTO v_updated_product;
  
  -- Create inventory log
  INSERT INTO inventory_logs (
    product_id,
    previous_quantity,
    new_quantity,
    reason,
    order_id,
    user_id
  ) VALUES (
    p_product_id,
    p_previous_quantity,
    p_new_quantity,
    p_reason,
    p_order_id,
    p_user_id
  ) RETURNING * INTO v_log;
  
  -- Return both updated product and log
  RETURN jsonb_build_object(
    'product', to_jsonb(v_updated_product),
    'log', to_jsonb(v_log)
  );
END;
$$ LANGUAGE plpgsql;

-- Create function for creating orders
CREATE OR REPLACE FUNCTION create_order(
  p_order_id TEXT,
  p_total DECIMAL,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_address TEXT,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_item JSONB;
  v_order_with_items JSONB;
BEGIN
  -- Create the order
  INSERT INTO orders (
    id,
    total,
    customer_name,
    customer_email,
    customer_address,
    status,
    inventory_updated
  ) VALUES (
    p_order_id,
    p_total,
    p_customer_name,
    p_customer_email,
    p_customer_address,
    'pending',
    FALSE
  ) RETURNING * INTO v_order;
  
  -- Create order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      name,
      price,
      quantity,
      image
    ) VALUES (
      p_order_id,
      (v_item->>'id')::UUID,
      v_item->>'name',
      (v_item->>'price')::DECIMAL,
      (v_item->>'quantity')::INTEGER,
      v_item->>'image'
    );
  END LOOP;
  
  -- Get the complete order with items
  SELECT jsonb_build_object(
    'id', o.id,
    'total', o.total,
    'customer_name', o.customer_name,
    'customer_email', o.customer_email,
    'customer_address', o.customer_address,
    'status', o.status,
    'inventory_updated', o.inventory_updated,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'items', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'name', oi.name,
          'price', oi.price,
          'quantity', oi.quantity,
          'image', oi.image
        )
      )
      FROM order_items oi
      WHERE oi.order_id = o.id
    )
  ) INTO v_order_with_items
  FROM orders o
  WHERE o.id = p_order_id;
  
  RETURN v_order_with_items;
END;
$$ LANGUAGE plpgsql;

