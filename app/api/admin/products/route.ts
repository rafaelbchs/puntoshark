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
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    // Calculate pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Get Supabase client
    const supabase = getServiceSupabase()

    // Build query
    let query = supabase.from("products").select("*").order("updated_at", { ascending: false }).range(from, to)

    // Add category filter if provided
    if (category) {
      query = query.eq("category", category)
    }

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%, sku.ilike.%${search}%`)
    }

    // Execute query
    const { data: products, error: productsError, count } = await query.count("exact")

    if (productsError) {
      console.error("Error fetching products:", productsError)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })

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
      barcode: product.barcode || undefined,
      inventory: {
        quantity: product.inventory_quantity,
        lowStockThreshold: product.low_stock_threshold,
        status: product.inventory_status,
        managed: product.inventory_managed,
      },
      attributes: product.attributes || {},
      createdAt: product.created_at,
      updatedAt: product.updated_at,
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
  } catch (error) {
    console.error("Error in products API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const { success, admin, error } = await verifyAdminToken()

    if (!success || !admin) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const productData = await request.json()

    // Validate required fields
    if (!productData.name || !productData.price || !productData.sku) {
      return NextResponse.json({ error: "Name, price, and SKU are required" }, { status: 400 })
    }

    // Get Supabase client
    const supabase = getServiceSupabase()

    // Check if SKU already exists
    const { data: existingSku, error: skuError } = await supabase
      .from("products")
      .select("id")
      .eq("sku", productData.sku)
      .single()

    if (existingSku) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }

    // Create product
    const { data, error: createError } = await supabase
      .from("products")
      .insert([
        {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          compare_at_price: productData.compareAtPrice,
          images: productData.images || [],
          category: productData.category,
          tags: productData.tags || [],
          sku: productData.sku,
          barcode: productData.barcode,
          inventory_quantity: productData.inventory?.quantity || 0,
          low_stock_threshold: productData.inventory?.lowStockThreshold || 5,
          inventory_managed: productData.inventory?.managed !== false,
          inventory_status: productData.inventory?.status || "in_stock",
          attributes: productData.attributes || {},
        },
      ])
      .select("*")
      .single()

    if (createError) {
      console.error("Error creating product:", createError)
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
    }

    // Transform database model to application model
    const transformedProduct = {
      id: data.id,
      name: data.name,
      description: data.description || "",
      price: data.price,
      compareAtPrice: data.compare_at_price || undefined,
      images: data.images,
      category: data.category || "",
      tags: data.tags,
      sku: data.sku,
      barcode: data.barcode || undefined,
      inventory: {
        quantity: data.inventory_quantity,
        lowStockThreshold: data.low_stock_threshold,
        status: data.inventory_status,
        managed: data.inventory_managed,
      },
      attributes: data.attributes || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({
      success: true,
      product: transformedProduct,
    })
  } catch (error) {
    console.error("Error in product creation API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

