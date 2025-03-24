import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getServiceSupabase } from "@/lib/supabase"
import { verifyAdminToken } from "@/app/actions/auth"

export async function GET(request: NextRequest) {
  try {
    // Check if this is an admin request
    const isAdminRequest = request.nextUrl.pathname.startsWith("/api/admin")

    if (isAdminRequest) {
      // Verify admin authentication
      const { success, admin, error } = await verifyAdminToken()

      if (!success || !admin) {
        return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
      }
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("id")

    // Get Supabase client
    const supabase = getServiceSupabase()

    if (orderId) {
      // Get specific order
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
          cedula: order.customer_cedula,
          phone: order.customer_phone,
          deliveryMethod: order.delivery_method,
          paymentMethod: order.payment_method,
          mrwOffice: order.mrw_office,
        },
        status: order.status,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        inventoryUpdated: order.inventory_updated,
      }

      return NextResponse.json({ order: transformedOrder })
    } else {
      // For public API, only return basic order info
      if (!isAdminRequest) {
        // Get order ID from cookies
        const orderIdCookie = cookies().get("orderId")?.value

        if (!orderIdCookie) {
          return NextResponse.json({ orders: [] })
        }

        // Get the order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select(`
            *,
            items:order_items(*)
          `)
          .eq("id", orderIdCookie)
          .single()

        if (orderError) {
          return NextResponse.json({ orders: [] })
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
        }

        return NextResponse.json({ orders: [transformedOrder] })
      }

      // Admin can see all orders
      const page = Number.parseInt(searchParams.get("page") || "1")
      const limit = Number.parseInt(searchParams.get("limit") || "10")
      const status = searchParams.get("status")

      // Calculate pagination
      const from = (page - 1) * limit
      const to = from + limit - 1

      // Build query
      let query = supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .order("created_at", { ascending: false })
        .range(from, to)

      // Add status filter if provided
      if (status) {
        query = query.eq("status", status)
      }

      // Execute query
      const { data: orders, error: ordersError } = await query

      if (ordersError) {
        console.error("Error fetching orders:", ordersError)
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
      }

      // Transform database models to application models
      const transformedOrders = orders.map((order) => ({
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

      return NextResponse.json({ orders: transformedOrders })
    }
  } catch (error) {
    console.error("Error in orders API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { items, customerInfo } = await request.json()

    if (!items || !items.length || !customerInfo) {
      return NextResponse.json({ error: "Items and customer information are required" }, { status: 400 })
    }

    // Generate a unique order ID
    const timestamp = new Date().getTime().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 8)
    const orderId = `ORD-${timestamp}-${randomStr}`.toUpperCase()

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // Get Supabase client
    const supabase = getServiceSupabase()

    // Create order
    const { data: order, error } = await supabase.rpc("create_order", {
      p_order_id: orderId,
      p_total: total,
      p_customer_name: customerInfo.name,
      p_customer_email: customerInfo.email,
      p_customer_address: customerInfo.address,
      p_items: JSON.stringify(items),
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
            customer_name: customerInfo.name,
            customer_email: customerInfo.email,
            customer_address: customerInfo.address,
            status: "pending",
            inventory_updated: false,
          },
        ])
        .select("*")
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item) => ({
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

    // Store order ID in cookies
    cookies().set("orderId", orderId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })

    // Clear cart after successful order
    cookies().set("cart", "[]", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })

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
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      order: transformedOrder,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

