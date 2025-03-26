import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { verifyAdminToken } from "@/app/actions/auth"

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const { success, admin, error } = await verifyAdminToken()

    if (!success || !admin) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")

    // Calculate pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Get Supabase client
    const supabase = getServiceSupabase()

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

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error counting orders:", countError)
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

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error in orders API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

