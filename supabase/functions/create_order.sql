-- Create a function to create an order with items in a transaction
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
  -- Start transaction
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
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

