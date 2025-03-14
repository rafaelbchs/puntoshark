"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { CartItem } from "@/context/cart-context"

// Type for order data
export type Order = {
  id: string
  items: CartItem[]
  total: number
  customerInfo: {
    name: string
    email: string
    address: string
  }
  status: "pending" | "processing" | "completed" | "cancelled"
  createdAt: string
}

// In-memory storage for orders (in a real app, this would be a database)
const orders: Order[] = []

// Generate a unique order ID
function generateOrderId(): string {
  const timestamp = new Date().getTime().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `ORD-${timestamp}-${randomStr}`.toUpperCase()
}

// Process checkout and create order
export async function processCheckout(formData: FormData) {
  try {
    console.log("Server: Processing checkout...")

    // Get cart items from cookies
    const cartCookie = cookies().get("cart")
    console.log("Server: Cart cookie:", cartCookie?.value)

    if (!cartCookie?.value) {
      console.log("Server: No cart cookie found")
      return { success: false, error: "Cart is empty" }
    }

    let cartItems: CartItem[] = []
    try {
      cartItems = JSON.parse(cartCookie.value)
    } catch (e) {
      console.error("Server: Failed to parse cart cookie:", e)
      return { success: false, error: "Invalid cart data" }
    }

    console.log("Server: Cart items:", cartItems)

    if (!cartItems.length) {
      console.log("Server: Cart is empty")
      return { success: false, error: "Cart is empty" }
    }

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // Get customer info from form
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const address = formData.get("address") as string

    console.log("Server: Customer info:", { name, email, address })

    if (!name || !email || !address) {
      console.log("Server: Missing customer info")
      return { success: false, error: "Missing required customer information" }
    }

    // Create new order
    const orderId = generateOrderId()
    console.log("Server: Generated order ID:", orderId)

    const newOrder: Order = {
      id: orderId,
      items: cartItems,
      total,
      customerInfo: {
        name,
        email,
        address,
      },
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    // Save order (in a real app, this would save to a database)
    orders.push(newOrder)
    console.log("Server: Order created:", newOrder)

    // Clear cart after successful order
    cookies().set("cart", "[]")

    // Revalidate relevant paths
    revalidatePath("/cart")
    revalidatePath("/checkout")
    revalidatePath("/admin/orders")

    return {
      success: true,
      orderId: newOrder.id,
      order: newOrder,
    }
  } catch (error) {
    console.error("Server: Checkout error:", error)
    return {
      success: false,
      error: "Failed to process checkout",
    }
  }
}

// Get all orders (for admin)
export async function getOrders() {
  // In a real app, this would fetch from a database
  return orders
}

// Get order by ID
export async function getOrderById(id: string) {
  console.log("Server: Getting order by ID:", id)
  console.log("Server: Available orders:", orders)

  // In a real app, this would fetch from a database
  const order = orders.find((order) => order.id === id)
  console.log("Server: Found order:", order)

  return order
}

// Update order status (for admin)
export async function updateOrderStatus(id: string, status: Order["status"]) {
  // In a real app, this would update the database
  const orderIndex = orders.findIndex((order) => order.id === id)
  if (orderIndex === -1) {
    return { success: false, error: "Order not found" }
  }

  orders[orderIndex].status = status
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${id}`)

  return { success: true }
}

