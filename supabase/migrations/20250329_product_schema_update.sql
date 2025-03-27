-- Add new columns to the products table
ALTER TABLE products 
ADD COLUMN subcategory TEXT,
ADD COLUMN product_type TEXT,
ADD COLUMN gender TEXT,
ADD COLUMN has_variants BOOLEAN DEFAULT FALSE,
ADD COLUMN variant_attributes TEXT[];

-- Create a new table for product variants
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  price DECIMAL(10, 2),
  compare_at_price DECIMAL(10, 2),
  inventory_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER,
  inventory_status TEXT NOT NULL DEFAULT 'out_of_stock',
  inventory_managed BOOLEAN NOT NULL DEFAULT TRUE,
  attributes JSONB NOT NULL DEFAULT '{}'::JSONB,
  barcode TEXT,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_products_has_variants ON products(has_variants);
CREATE INDEX idx_products_product_type ON products(product_type);
CREATE INDEX idx_products_gender ON products(gender);
CREATE INDEX idx_products_subcategory ON products(subcategory);

