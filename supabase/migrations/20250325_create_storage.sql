-- Create a storage bucket for product images
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Set up public access policy for the products bucket
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
  'Public Access',
  '(bucket_id = ''products''::text)',
  'products'
)
ON CONFLICT (name, bucket_id) DO NOTHING;

