export type ProductStatus = "in_stock" | "low_stock" | "out_of_stock" | "discontinued"

export type Product = {
  id: string
  name: string
  description: string
  price: number
  compareAtPrice?: number
  images: string[]
  category: string
  tags: string[]
  sku: string
  barcode?: string
  inventory: {
    quantity: number
    lowStockThreshold: number
    status: ProductStatus
    managed: boolean
  }
  variants?: ProductVariant[]
  attributes?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export type ProductVariant = {
  id: string
  name: string
  sku: string
  price: number
  inventory: {
    quantity: number
    status: ProductStatus
  }
  attributes: Record<string, string>
}

export type InventoryUpdateLog = {
  id: string
  productId: string
  previousQuantity: number
  newQuantity: number
  reason: "order" | "manual" | "return" | "adjustment"
  orderId?: string
  userId?: string
  timestamp: string
}

