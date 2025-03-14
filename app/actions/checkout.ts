"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import type { CartItem } from "@/context/cart-context"
import { updateInventoryAfterOrder } from "./inventory"

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
  updatedAt: string
  inventoryUpdated: boolean
}

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

    // Create order and order items in a transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          id: orderId,
          total,
          customerName: name,
          customerEmail: email,
          customerAddress: address,
          status: "pending",
          inventoryUpdated: false,
          // Create order items
          items: {
            create: cartItems.map((item) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image,
              productId: item.id,
            })),
          },
        },
        include: {
          items: true,
        },
      })

      return order
    })

    console.log("Server: Order created:", newOrder)

    // Clear cart after successful order
    cookies().set("cart", "[]")

    // Revalidate relevant paths
    revalidatePath("/cart")
    revalidatePath("/checkout")
    revalidatePath("/admin/orders")

    // Transform database model to our application model
    const orderForClient: Order = {
      id: newOrder.id,
      items: newOrder.items.map((item) => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || undefined,
      })),
      total: newOrder.total,
      customerInfo: {
        name: newOrder.customerName,
        email: newOrder.customerEmail,
        address: newOrder.customerAddress,
      },
      status: newOrder.status as Order["status"],
      createdAt: newOrder.createdAt.toISOString(),
      updatedAt: newOrder.updatedAt.toISOString(),
      inventoryUpdated: newOrder.inventoryUpdated,
    }

    return {
      success: true,
      orderId: newOrder.id,
      order: orderForClient,
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
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform database models to our application models
    return orders.map((order) => ({
      id: order.id,
      items: order.items.map((item) => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || undefined,
      })),
      total: order.total,
      customerInfo: {
        name: order.customerName,
        email: order.customerEmail,
        address: order.customerAddress,
      },
      status: order.status as Order["status"],
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      inventoryUpdated: order.inventoryUpdated,
    }))
  } catch (error) {
    console.error("Failed to get orders:", error)
    throw error
  }
}

// Get order by ID
export async function getOrderById(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!order) return null

    // Transform database model to our application model
    return {
      id: order.id,
      items: order.items.map((item) => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || undefined,
      })),
      total: order.total,
      customerInfo: {
        name: order.customerName,
        email: order.customerEmail,
        address: order.customerAddress,
      },
      status: order.status as Order["status"],
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      inventoryUpdated: order.inventoryUpdated,
    }
  } catch (error) {
    console.error("Failed to get order by ID:", error)
    throw error
  }
}

// Update order status (for admin)
export async function updateOrderStatus(id: string, status: Order["status"], userId = "admin") {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!order) {
      return { success: false, error: "Order not found" }
    }

    // If status is changing to 'completed' and inventory hasn't been updated yet
    if (status === "completed" && !order.inventoryUpdated) {
      // Update inventory for each item in the order
      const inventoryResult = await updateInventoryAfterOrder(
        id,
        userId,
        order.items.map((item) => ({ id: item.productId, quantity: item.quantity })),
      )

      if (inventoryResult.success) {
        // Update order with inventory updated flag
        await prisma.order.update({
          where: { id },
          data: {
            inventoryUpdated: true,
          },
        })
      } else {
        console.error("Failed to update inventory:", inventoryResult.error)
        // Continue with status update even if inventory update fails
      }
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        items: true,
      },
    })

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${id}`)

    // Transform database model to our application model
    return {
      success: true,
      order: {
        id: updatedOrder.id,
        items: updatedOrder.items.map((item) => ({
          id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || undefined,
        })),
        total: updatedOrder.total,
        customerInfo: {
          name: updatedOrder.customerName,
          email: updatedOrder.customerEmail,
          address: updatedOrder.customerAddress,
        },
        status: updatedOrder.status as Order["status"],
        createdAt: updatedOrder.createdAt.toISOString(),
        updatedAt: updatedOrder.updatedAt.toISOString(),
        inventoryUpdated: updatedOrder.inventoryUpdated,
      },
    }
  } catch (error) {
    console.error("Failed to update order status:", error)
    return { success: false, error: "Failed to update order status" }
  }
}

