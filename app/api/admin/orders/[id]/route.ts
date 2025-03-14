import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { verifyAdminToken } from "@/app/actions/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id

    // Verify admin authentication
    const { success, admin, error } = await verifyAdminToken()

    if (!success || !admin) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    // Get Supabase client
    const supabase = getServiceSupabase()

    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*)
      `)
      .eq("id", orderId)
      .single()

    if (orderError) {
      if (orderError.code === "PGRST116") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      console.error("Error fetching order:", orderError)
      return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
    }

    // Transform database model to application model
    const transformedOrder = {
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

    return NextResponse.json({ order: transformedOrder })
  } catch (error) {
    console.error("Error in order API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id

    // Verify admin authentication
    const { success, admin, error } = await verifyAdminToken()

    if (!success || !admin) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Get Supabase client
    const supabase = getServiceSupabase()

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*)
      `)
      .eq("id", orderId)
      .single()

    if (orderError) {
      if (orderError.code === "PGRST116") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      console.error("Error fetching order:", orderError)
      return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
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

          // Determine new status
          const newStatus =
            newQuantity <= 0 ? "out_of_stock" : newQuantity <= product.low_stock_threshold ? "low_stock" : "in_stock"

          // Update product inventory
          await supabase
            .from("products")
            .update({
              inventory_quantity: newQuantity,
              inventory_status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.product_id)

          // Create inventory log
          await supabase.from("inventory_logs").insert([
            {
              product_id: item.product_id,
              previous_quantity: product.inventory_quantity,
              new_quantity: newQuantity,
              reason: "order",
              order_id: orderId,
              user_id: admin.id,
            },
          ])
        }
      }

      // Update order with inventory updated flag
      await supabase.from("orders").update({ inventory_updated: true }).eq("id", orderId)
    }

    // Update order status
    const { data, error: updateError } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select(`
        *,
        items:order_items(*)
      `)
      .single()

    if (updateError) {
      console.error("Error updating order:", updateError)
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }

    // Transform database model to application model
    const transformedOrder = {
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

    return NextResponse.json({
      success: true,
      order: transformedOrder,
    })
  } catch (error) {
    console.error("Error in order update API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

