-- Migration to add missing columns to inventory_logs table

-- Add admin_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'inventory_logs' AND column_name = 'admin_name'
    ) THEN
        ALTER TABLE inventory_logs ADD COLUMN admin_name text;
    END IF;
END $$;

-- Add details column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'inventory_logs' AND column_name = 'details'
    ) THEN
        ALTER TABLE inventory_logs ADD COLUMN details text;
    END IF;
END $$;

-- Comment on columns
COMMENT ON COLUMN inventory_logs.admin_name IS 'Username of the admin who made the change';
COMMENT ON COLUMN inventory_logs.details IS 'Additional information about the inventory change';

