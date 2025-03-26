"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getServiceSupabase } from "@/lib/supabase"
import { updateInventory } from "./inventory"
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, sendAdminOrderNotification } from "@/lib/email"
import type {
  Order as OrderType,
  OrderStatus as OrderStatusType,
  CheckoutResult,
  OrderUpdateResult,
  CartItem as CartItemType,
} from "@/types/checkout"

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
      return { success: false, error: "El carrito está vacío" }
    }

    let cartItems: CartItemType[] = []
    try {
      cartItems = JSON.parse(cartCookie.value)
    } catch (e) {
      console.error("Server: Failed to parse cart cookie:", e)
      return { success: false, error: "Datos de carrito inválidos" }
    }

    console.log("Server: Cart items:", cartItems)

    if (!cartItems.length) {
      console.log("Server: Cart is empty")
      return { success: false, error: "El carrito está vacío" }
    }

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // Get customer info from form
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const cedula = formData.get("cedula") as string
    const phone = formData.get("phone") as string
    const deliveryMethod = formData.get("deliveryMethod") as string
    const paymentMethod = formData.get("paymentMethod") as string

    // Get conditional fields based on delivery method
    let address = ""
    let mrwOffice = ""

    if (deliveryMethod === "delivery") {
      address = formData.get("address") as string
    } else if (deliveryMethod === "mrw") {
      mrwOffice = formData.get("mrwOffice") as string
    }

    console.log("Server: Customer info:", {
      name,
      email,
      cedula,
      phone,
      deliveryMethod,
      paymentMethod,
      address,
      mrwOffice,
    })

    if (!name || !email || !cedula || !phone || !deliveryMethod || !paymentMethod) {
      console.log("Server: Missing customer info")
      return { success: false, error: "Falta información requerida del cliente" }
    }

    // Validate delivery method specific fields
    if (deliveryMethod === "delivery" && !address) {
      return { success: false, error: "La dirección de entrega es requerida para delivery" }
    }

    if (deliveryMethod === "mrw" && !mrwOffice) {
      return { success: false, error: "La oficina de MRW es requerida para envío nacional" }
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

    // Create the order manually
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          id: orderId,
          total,
          customer_name: name,
          customer_email: email,
          customer_cedula: cedula,
          customer_phone: phone,
          customer_address: address,
          delivery_method: deliveryMethod,
          payment_method: paymentMethod,
          mrw_office: mrwOffice,
          status: "pending",
          inventory_updated: false,
        },
      ])
      .select("*")
      .single()

    if (orderError) {
      console.error("Server: Order creation error details:", {
        code: orderError.code,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
        error: orderError,
      })
      return { success: false, error: `Error al crear el pedido: ${orderError.message}` }
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
      return { success: false, error: "Error al crear los items del pedido" }
    }

    // Get the complete order with items
    const { data: orderData, error: fetchError } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*)
      `)
      .eq("id", orderId)
      .single()

    // Check if we have valid order data
    if (!orderData) {
      console.error("Server: No order data available")
      return { success: false, error: "Error al crear el pedido" }
    }

    console.log("Server: Order created:", orderData)

    // Transform database model to our application model
    const orderForClient = {
      id: orderData.id,
      items: Array.isArray(orderData.items)
        ? orderData.items.map((item) => ({
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
        cedula: orderData.customer_cedula,
        phone: orderData.customer_phone,
        address: orderData.customer_address,
        deliveryMethod: orderData.delivery_method,
        paymentMethod: orderData.payment_method,
        mrwOffice: orderData.mrw_office,
      },
      status: orderData.status,
      createdAt: orderData.created_at,
      updatedAt: orderData.updated_at,
      inventoryUpdated: orderData.inventory_updated,
    }

    // Send order confirmation email
    await sendOrderConfirmationEmail(orderForClient)

    // Send notification to admin
    await sendAdminOrderNotification(orderForClient)

    // Revalidate relevant paths
    revalidatePath("/cart")
    revalidatePath("/checkout")
    revalidatePath("/admin/orders")

    // At the end of the function, before returning the result
    console.log("Server: Checkout completed successfully. Order ID:", orderData.id)
    console.log("Server: Order data for client:", orderForClient)

    return {
      success: true,
      orderId: orderData.id,
      order: orderForClient,
    }
  } catch (error) {
    console.error("Server: Checkout error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error,
    })
    return {
      success: false,
      error: "Error al procesar el checkout",
    }
  }
}

// Get all orders (for admin)
export async function getOrders(): Promise<OrderType[]> {
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
        cedula: order.customer_cedula,
        phone: order.customer_phone,
        address: order.customer_address,
        deliveryMethod: order.delivery_method,
        paymentMethod: order.payment_method,
        mrwOffice: order.mrw_office,
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
export async function getOrderById(id: string): Promise<Order | null> {
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
      console.error("Error fetching order:", error)
      if (error.code === "PGRST116") return null // No rows returned
      throw error
    }

    if (!data) return null

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
        cedula: data.customer_cedula,
        phone: data.customer_phone,
        address: data.customer_address,
        deliveryMethod: data.delivery_method,
        paymentMethod: data.payment_method,
        mrwOffice: data.mrw_office,
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
export async function updateOrderStatus(
  id: string,
  status: OrderStatusType,
  userId = "admin",
): Promise<OrderUpdateResult> {
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
      return { success: false, error: "Pedido no encontrado" }
    }

    // Check if order is already in a final state (completed or cancelled)
    if (order.status === "completed" || order.status === "cancelled") {
      return {
        success: false,
        error: `No se puede cambiar el estado del pedido porque ya está ${order.status === "completed" ? "completado" : "cancelado"}`,
      }
    }

    // Handle inventory updates based on status changes

    // Case 1: Moving to "completed" and inventory hasn't been updated yet
    if (status === "completed" && !order.inventory_updated) {
      // Update inventory for each item in the order (decrease inventory)
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

    // Case 2: Cancelling an order that was previously processed or completed
    // This means we need to return items to inventory
    else if (
      status === "cancelled" &&
      (order.status === "processing" || order.status === "completed") &&
      order.inventory_updated
    ) {
      // Return items to inventory (increase inventory)
      for (const item of order.items) {
        // Get the product
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", item.product_id)
          .single()

        if (productError) continue // Skip if product not found

        if (product && product.inventory_managed) {
          // Calculate new quantity (add items back to inventory)
          const newQuantity = product.inventory_quantity + item.quantity

          // Update inventory with "return" reason
          await updateInventory(item.product_id, newQuantity, "return", id, userId)
        }
      }
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
    const updatedOrder = {
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
        cedula: data.customer_cedula,
        phone: data.customer_phone,
        address: data.customer_address,
        deliveryMethod: data.delivery_method,
        paymentMethod: data.payment_method,
        mrwOffice: data.mrw_office,
      },
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      inventoryUpdated: data.inventory_updated,
    }

    // Send order status update email if enabled
    if (status !== order.status) {
      await sendOrderStatusUpdateEmail(updatedOrder)
    }

    return {
      success: true,
      order: updatedOrder,
    }
  } catch (error) {
    console.error("Failed to update order status:", error)
    return { success: false, error: "Error al actualizar el estado del pedido" }
  }
}

export type Order = OrderType

