"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getServiceSupabase } from "@/lib/supabase"
import type { CartItem } from "@/types/product"
import type { OrderItem, ClientOrder, CheckoutResult, OrderStatus } from "@/types/order"

// Get Supabase admin client
const getSupabase = () => getServiceSupabase()

// Generate a unique order ID
function generateOrderId(): string {
  const timestamp = new Date().getTime().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `ORD-${timestamp}-${randomStr}`.toUpperCase()
}

// Process checkout and create order
export async function processCheckout(formData: FormData): Promise<CheckoutResult> {
  try {
    console.log("Server: Processing checkout...")
    const supabase = getSupabase()

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

    // Fetch actual product UUIDs from the database
    const productIds = await Promise.all(
      cartItems.map(async (item) => {
        // If the ID is already a valid UUID, use it
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)) {
          return { originalId: item.id, uuid: item.id }
        }

        // Otherwise, look up the product by name or other identifier
        const { data, error } = await supabase.from("products").select("id").eq("name", item.name).single()

        if (error || !data) {
          // If we can't find the product, generate a UUID
          // Note: This is a fallback and might cause issues with inventory management
          console.warn(`Could not find product with name: ${item.name}, generating UUID`)
          return {
            originalId: item.id,
            uuid: crypto.randomUUID(),
          }
        }

        return { originalId: item.id, uuid: data.id }
      }),
    )

    // Create a mapping of original IDs to UUIDs
    const idMapping = Object.fromEntries(productIds.map(({ originalId, uuid }) => [originalId, uuid]))

    // Update cart items with proper UUIDs
    const fixedCartItems = cartItems.map((item) => ({
      ...item,
      id: idMapping[item.id] || item.id,
    }))

    // Initialize order variable
    let orderData = null

    try {
      // Try the RPC method first
      const { data, error } = await supabase.rpc("create_order", {
        p_order_id: orderId,
        p_total: total,
        p_customer_name: name,
        p_customer_email: email,
        p_customer_address: address,
        p_items: JSON.stringify(fixedCartItems),
      })

      if (error) {
        console.error("Server: RPC error:", error)
        throw error // This will trigger the catch block below
      }

      orderData = data
    } catch (rpcError) {
      console.log("Server: Falling back to manual order creation")

      // Create the order manually
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            id: orderId,
            total,
            customer_name: name,
            customer_email: email,
            customer_address: address,
            status: "pending" as OrderStatus,
            inventory_updated: false,
          },
        ])
        .select("*")
        .single()

      if (orderError) {
        console.error("Server: Order creation error:", orderError)
        return { success: false, error: "Failed to create order" }
      }

      // Create order items
      const orderItems = fixedCartItems.map((item) => ({
        order_id: orderId,
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) {
        console.error("Server: Order items creation error:", itemsError)
        return { success: false, error: "Failed to create order items" }
      }

      // Get the complete order with items
      const { data: completeOrder, error: fetchError } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("id", orderId)
        .single()

      if (fetchError) {
        console.error("Server: Fetch complete order error:", fetchError)
        return { success: false, error: "Failed to fetch complete order" }
      }

      orderData = completeOrder
    }

    // Check if we have valid order data
    if (!orderData) {
      console.error("Server: No order data available")
      return { success: false, error: "Failed to create order" }
    }

    console.log("Server: Order created:", orderData)

    // Clear cart after successful order
    cookies().set("cart", "[]")

    // Revalidate relevant paths
    revalidatePath("/cart")
    revalidatePath("/checkout")
    revalidatePath("/admin/orders")

    // Transform database model to our application model
    const orderForClient: ClientOrder = {
      id: orderData.id,
      items: Array.isArray(orderData.items)
        ? orderData.items.map((item: OrderItem) => ({
            id: item.product_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || undefined,
          }))
        : [],
      total: orderData.total,
      customerInfo: {
        name: orderData.customer_name,
        email: orderData.customer_email,
        address: orderData.customer_address,
      },
      status: orderData.status as OrderStatus,
      createdAt: orderData.created_at,
      updatedAt: orderData.updated_at,
      inventoryUpdated: orderData.inventory_updated,
    }

    return {
      success: true,
      orderId: orderData.id,
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

// The rest of your functions remain unchanged

