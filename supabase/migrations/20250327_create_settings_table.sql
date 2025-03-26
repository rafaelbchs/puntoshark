-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create initial settings if they don't exist
INSERT INTO settings (id, value)
VALUES 
  ('store', '{"storeName": "My Store", "storeDescription": "Your one-stop shop for quality products", "storeEmail": "contact@mystore.com", "storePhone": "+1 (555) 123-4567", "storeAddress": "123 Main St, City, Country", "storeCurrency": "USD", "storeTimeZone": "America/New_York"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (id, value)
VALUES 
  ('shipping', '{"enableFreeShipping": false, "freeShippingThreshold": 100, "enableFlatRate": true, "flatRateAmount": 10, "enableLocalPickup": true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (id, value)
VALUES 
  ('notifications', '{"emailNotifications": true, "orderConfirmation": true, "orderStatusUpdate": true, "lowStockAlert": true, "lowStockThreshold": 5, "adminEmail": "admin@example.com", "emailTemplate": "<h1>Thank you for your order!</h1><p>Dear {{customerName}},</p><p>We''re pleased to confirm your order #{{orderId}}.</p><h2>Order Details:</h2><ul>{{#each items}}<li>{{quantity}}x {{name}} - ${{price}}</li>{{/each}}</ul><p><strong>Total: ${{total}}</strong></p><p>We''ll notify you when your order ships.</p><p>Thank you for shopping with us!</p>"}')
ON CONFLICT (id) DO NOTHING;

