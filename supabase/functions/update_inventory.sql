-- Create a function to update inventory and create a log in a transaction
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
  -- Start transaction
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
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

