import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "@/lib/prisma"
import type { CartItem } from "@/types"

// Alternative approach - bypass the items relation and create order items separately
export async function POST(request: Request) {
  try {
    console.log("Processing checkout...")

    // Get cart from cookies
    const cookieStore = cookies()
    const cartCookie = cookieStore.get("cart")?.value
    console.log("Cart cookie:", cartCookie)

    if (!cartCookie) {
      return Response.json({ error: "Cart is empty" }, { status: 400 })
    }

    const cartItems: CartItem[] = JSON.parse(cartCookie)
    console.log("Cart items:", cartItems)

    if (cartItems.length === 0) {
      return Response.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Get customer info from request
    const { name, email, address } = await request.json()
    console.log("Customer info:", { name, email, address })

    if (!name || !email || !address) {
      return Response.json({ error: "Missing customer information" }, { status: 400 })
    }

    // Generate order ID
    const orderId = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    console.log("Generated order ID:", orderId)

    // Create order in database - without items initially
    const orderUuid = uuidv4()
    const order = await prisma.order.create({
      data: {
        id: orderUuid,
        orderId,
        customerName: name,
        customerEmail: email,
        customerAddress: address,
        total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      },
    })

    // Create order items separately
    for (const item of cartItems) {
      // Skip the productId field entirely if it's causing problems
      await prisma.orderItem.create({
        data: {
          id: uuidv4(),
          orderId: orderUuid,
          // Don't include productId if it's causing issues
          // productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        },
      })
    }

    // Clear cart cookie
    cookieStore.set("cart", "", { maxAge: 0 })

    return Response.json({ success: true, orderId })
  } catch (error) {
    console.log("Checkout error:", error)
    return Response.json({ error: "Failed to process checkout", details: error }, { status: 500 })
  }
}

