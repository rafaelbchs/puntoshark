export type ProductStatus = "in_stock" | "low_stock" | "out_of_stock" | "discontinued"

// Add these new types to your inventory.ts file

export type ProductType = "clothing" | "accessories" | "footwear" | "home" | "other"

export type ProductGender = "men" | "women" | "unisex" | "kids" | "baby" | null

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  price?: number // If null, use parent product price
  compareAtPrice?: number
  inventory: {
    quantity: number
    lowStockThreshold?: number
    status: ProductStatus
    managed: boolean
  }
  attributes: {
    [key: string]: string // e.g., { "size": "L", "color": "Black" }
  }
  barcode?: string
  images?: string[] // Optional variant-specific images
  createdAt: string
  updatedAt: string
}

// Update the Product interface to include new fields
export interface Product {
  id: string
  name: string
  description: string
  price: number
  compareAtPrice?: number
  images: string[]
  category: string
  subcategory?: string // New field for more specific categorization
  productType?: ProductType // New field for product type
  gender?: ProductGender // New field for gender targeting
  tags: string[]
  sku: string // Base SKU for the product
  barcode?: string
  inventory: {
    quantity: number
    lowStockThreshold: number
    status: ProductStatus
    managed: boolean
  }
  attributes: {
    [key: string]: any // Product-level attributes
  }
  hasVariants: boolean // Whether this product has variants
  variantAttributes?: string[] // List of attribute names used for variants (e.g., ["size", "color"])
  variants?: ProductVariant[] // Optional array of variants
  createdAt: string
  updatedAt: string
}

export type InventoryUpdateLog = {
  id: string
  productId: string
  productName?: string // Add product name for better readability in logs
  previousQuantity: number
  newQuantity: number
  reason: "order" | "manual" | "return" | "adjustment" | "product_created" | "product_updated" | "product_deleted"
  orderId?: string
  userId?: string
  adminName?: string // Add admin name for tracking who made the change
  details?: string // Additional details about the change
  timestamp: string
}

// Add a new type for log filtering
export type LogFilter = {
  productId?: string
  reason?: string
  adminId?: string
  dateFrom?: string
  dateTo?: string
  searchTerm?: string
}

