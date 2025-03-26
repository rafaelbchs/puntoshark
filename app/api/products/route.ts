import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const featured = searchParams.get("featured") === "true"
    const productId = searchParams.get("id")

    // Get Supabase client
    const supabase = getServiceSupabase()

    if (productId) {
      // Get specific product
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single()

      if (productError) {
        if (productError.code === "PGRST116") {
          return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        console.error("Error fetching product:", productError)
        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
      }

      // Don't return discontinued products to customers
      if (product.inventory_status === "discontinued") {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      // Transform database model to application model
      const transformedProduct = {
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: product.price,
        compareAtPrice: product.compare_at_price || undefined,
        images: product.images,
        category: product.category || "",
        tags: product.tags,
        sku: product.sku,
        inventory: {
          quantity: product.inventory_quantity,
          status: product.inventory_status,
        },
      }

      return NextResponse.json({ product: transformedProduct })
    } else {
      // Calculate pagination
      const from = (page - 1) * limit
      const to = from + limit - 1

      // Build query
      let query = supabase
        .from("products")
        .select("*")
        .neq("inventory_status", "discontinued") // Exclude discontinued products
        .neq("inventory_status", "out_of_stock") // Also exclude out of stock products
        .order("name", { ascending: true })
        .range(from, to)

      // Add category filter if provided
      if (category) {
        query = query.eq("category", category)
      }

      // Add search filter if provided
      if (search) {
        query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`)
      }

      // Add featured filter if requested
      if (featured) {
        query = query.eq("featured", true)
      }

      // Execute query
      const { data: products, error: productsError } = await query

      if (productsError) {
        console.error("Error fetching products:", productsError)
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
      }

      // Get total count for pagination
      const { count: totalCount, error: countError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .neq("inventory_status", "discontinued")
        .neq("inventory_status", "out_of_stock")

      if (countError) {
        console.error("Error counting products:", countError)
      }

      // Transform database models to application models
      const transformedProducts = products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: product.price,
        compareAtPrice: product.compare_at_price || undefined,
        images: product.images,
        category: product.category || "",
        tags: product.tags,
        sku: product.sku,
        inventory: {
          quantity: product.inventory_quantity,
          status: product.inventory_status,
        },
      }))

      return NextResponse.json({
        products: transformedProducts,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
        },
      })
    }
  } catch (error) {
    console.error("Error in products API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

