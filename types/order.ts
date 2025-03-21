import { CartItem } from "./product"
import { ProductStatus } from "./inventory"

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled" | "refunded"

export interface CustomerInfo {
  name: string
  email: string
  address: string
}

export interface OrderItem {
  id?: string
  product_id: string
  name: string
  price: number
  quantity: number
  image?: string
}

export interface Order {
  id: string
  total: number
  customer_name: string
  customer_email: string
  customer_address: string
  status: OrderStatus
  inventory_updated: boolean
  created_at: string
  updated_at: string
  items: OrderItem[]
}

export interface ClientOrder {
  id: string
  items: CartItem[]
  total: number
  customerInfo: CustomerInfo
  status: OrderStatus
  createdAt: string
  updatedAt: string
  inventoryUpdated: boolean
}

export interface CheckoutResult {
  success: boolean
  orderId?: string
  order?: ClientOrder
  error?: string
}

export interface OrderStatusUpdateResult {
  success: boolean
  order?: ClientOrder
  error?: string
}
