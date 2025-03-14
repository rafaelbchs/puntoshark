"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getServiceSupabase } from "@/lib/supabase"
import { updateInventory } from "./inventory" // Import updateInventory

// Get Supabase admin client
const getSupabase = () => getServiceSupabase()

// Generate a unique order ID
function generateOrderId() {
  const timestamp = new Date().getTime().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `ORD-${timestamp}-${randomStr}`.toUpperCase()
}

// Process checkout and create order
export async function processCheckout(formData) {
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

    let cartItems = []
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
    const name = formData.get("name")
    const email = formData.get("email")
    const address = formData.get("address")

    console.log("Server: Customer info:", { name, email, address })

    if (!name || !email || !address) {
      console.log("Server: Missing customer info")
      return { success: false, error: "Missing required customer information" }
    }

    // Create new order
    const orderId = generateOrderId()
    console.log("Server: Generated order ID:", orderId)

    // Start a transaction
    const { data: order, error } = await supabase.rpc("create_order", {
      p_order_id: orderId,
      p_total: total,
      p_customer_name: name,
      p_customer_email: email,
      p_customer_address: address,
      p_items: JSON.stringify(cartItems),
    })

    if (error) {
      // If RPC doesn't exist, do it manually
      // Create the order
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            id: orderId,
            total,
            customer_name: name,
            customer_email: email,
            customer_address: address,
            status: "pending",
            inventory_updated: false,
          },
        ])
        .select("*")
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: orderId,
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Get the complete order with items
      const { data: completeOrder, error: fetchError } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("id", orderId)
        .single()

      if (fetchError) throw fetchError

      const order = completeOrder
    }

    console.log("Server: Order created:", order)

    // Clear cart after successful order
    cookies().set("cart", "[]")

    // Revalidate relevant paths
    revalidatePath("/cart")
    revalidatePath("/checkout")
    revalidatePath("/admin/orders")

    // Transform database model to our application model
    const orderForClient = {
      id: order.id,
      items: order.items.map((item) => ({
        id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || undefined,
      })),
      total: order.total,
      customerInfo: {
        name: order.customer_name,
        email: order.customer_email,
        address: order.customer_address,
      },
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      inventoryUpdated: order.inventory_updated,
    }

    return {
      success: true,
      orderId: order.id,
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
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Transform database models to our application models
    return data.map((order) => ({
      id: order.id,
      items: order.items.map((item) => ({
        id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || undefined,
      })),
      total: order.total,
      customerInfo: {
        name: order.customer_name,
        email: order.customer_email,
        address: order.customer_address,
      },
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      inventoryUpdated: order.inventory_updated,
    }))
  } catch (error) {
    console.error("Failed to get orders:", error)
    throw error
  }
}

// Get order by ID
export async function getOrderById(id) {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null // No rows returned
      throw error
    }

    // Transform database model to our application model
    return {
      id: data.id,
      items: data.items.map((item) => ({
        id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || undefined,
      })),
      total: data.total,
      customerInfo: {
        name: data.customer_name,
        email: data.customer_email,
        address: data.customer_address,
      },
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      inventoryUpdated: data.inventory_updated,
    }
  } catch (error) {
    console.error("Failed to get order by ID:", error)
    throw error
  }
}

// Update order status (for admin)
export async function updateOrderStatus(id, status, userId = "admin") {
  try {
    const supabase = getSupabase()

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*)
      `)
      .eq("id", id)
      .single()

    if (orderError) throw orderError

    if (!order) {
      return { success: false, error: "Order not found" }
    }

    // If status is changing to 'completed' and inventory hasn't been updated yet
    if (status === "completed" && !order.inventory_updated) {
      // Update inventory for each item in the order
      for (const item of order.items) {
        // Get the product
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", item.product_id)
          .single()

        if (productError) continue // Skip if product not found

        if (product && product.inventory_managed) {
          // Calculate new quantity
          const newQuantity = Math.max(0, product.inventory_quantity - item.quantity)

          // Update inventory
          await updateInventory(item.product_id, newQuantity, "order", id, userId)
        }
      }

      // Update order with inventory updated flag
      await supabase.from("orders").update({ inventory_updated: true }).eq("id", id)
    }

    // Update order status
    const { data, error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        items:order_items(*)
      `)
      .single()

    if (error) throw error

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${id}`)

    // Transform database model to our application model
    return {
      success: true,
      order: {
        id: data.id,
        items: data.items.map((item) => ({
          id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || undefined,
        })),
        total: data.total,
        customerInfo: {
          name: data.customer_name,
          email: data.customer_email,
          address: data.customer_address,
        },
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        inventoryUpdated: data.inventory_updated,
      },
    }
  } catch (error) {
    console.error("Failed to update order status:", error)
    return { success: false, error: "Failed to update order status" }
  }
}

