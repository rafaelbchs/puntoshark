export type OrderStatus = "pending" | "processing" | "completed" | "cancelled"

export type OrderItem = {
  id: string
  product_id: string
  name: string
  price: number
  quantity: number
  image?: string
}

export type CustomerInfo = {
  name: string
  email: string
  address: string
}

export type Order = {
  id: string
  items: OrderItem[]
  total: number
  customerInfo: CustomerInfo
  status: OrderStatus
  createdAt: string
  updatedAt: string
  inventoryUpdated: boolean
}

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

export type CheckoutResult = {
  success: boolean
  orderId?: string
  order?: Order
  error?: string
}

export type OrderUpdateResult = {
  success: boolean
  order?: Order
  error?: string
}

