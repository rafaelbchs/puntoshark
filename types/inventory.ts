export type ProductStatus = "in_stock" | "low_stock" | "out_of_stock" | "discontinued"
export type ProductType = "tshirt" | "hoodie" | "sweatshirt" | "pants" | "shorts" | "hat" | "accessory" | "other"
export type ProductGender = "men" | "women" | "unisex" | "kids"

export interface Product {
  id: string
  name: string
  description: string
  price: number
  compareAtPrice?: number
  images: string[]
  category: string
  subcategory?: string
  productType?: ProductType
  gender?: ProductGender
  tags: string[]
  sku: string
  barcode?: string
  inventory: {
    quantity: number
    lowStockThreshold: number
    status: ProductStatus
    managed: boolean
  }
  attributes: Record<string, any>
  hasVariants?: boolean
  variantAttributes?: string[]
  variants?: ProductVariant[]
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  price: number
  compareAtPrice?: number
  inventory: {
    quantity: number
    lowStockThreshold: number
    status: ProductStatus
    managed: boolean
  }
  attributes: Record<string, any>
  barcode?: string
  images: string[]
  createdAt: string
  updatedAt: string
}

export interface InventoryUpdateLog {
  id: string
  productId: string
  productName?: string
  previousQuantity: number
  newQuantity: number
  reason: string
  orderId?: string
  userId?: string
  adminName?: string
  details?: string
  timestamp: string
}

export interface LogFilter {
  productId?: string
  reason?: string
  adminId?: string
  dateFrom?: string
  dateTo?: string
  searchTerm?: string
}

export interface CategoryData {
  name: string
  subcategories: string[]
}

