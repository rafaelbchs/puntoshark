-- Create or update the orders table with all required fields
DO $$
BEGIN
    -- Check if the orders table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        -- Create the orders table with all required columns
        CREATE TABLE orders (
            id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_address TEXT,
            customer_cedula TEXT,
            customer_phone TEXT,
            delivery_method TEXT,
            payment_method TEXT,
            mrw_office TEXT,
            total DECIMAL(10, 2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            inventory_updated BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Created orders table with all required columns';
    ELSE
        -- Table exists, add any missing columns
        BEGIN
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_cedula TEXT;
            EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'column customer_cedula already exists in orders.';
        END;
        
        BEGIN
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
            EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'column customer_phone already exists in orders.';
        END;
        
        BEGIN
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT;
            EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'column delivery_method already exists in orders.';
        END;
        
        BEGIN
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
            EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'column payment_method already exists in orders.';
        END;
        
        BEGIN
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS mrw_office TEXT;
            EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'column mrw_office already exists in orders.';
        END;
        
        RAISE NOTICE 'Updated orders table with any missing columns';
    END IF;
    
    -- Check if the order_items table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items') THEN
        -- Create the order_items table
        CREATE TABLE order_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id TEXT NOT NULL,
            name TEXT NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            quantity INTEGER NOT NULL,
            image TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Created order_items table';
    END IF;
END
$$;

