import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { verifyAdminToken } from "@/app/actions/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    // Verify admin authentication
    const { success, admin, error } = await verifyAdminToken()

    if (!success || !admin) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    // Get Supabase client
    const supabase = getServiceSupabase()

    // Get product
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
    }

    return NextResponse.json({ product: transformedProduct })
  } catch (error) {
    console.error("Error in product API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

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

    // Check if product exists
    const { data: existingProduct, error: checkError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .single()

    if (checkError && checkError.code === "PGRST116") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if SKU already exists (and it's not this product's SKU)
    const { data: existingSku, error: skuError } = await supabase
      .from("products")
      .select("id")
      .eq("sku", productData.sku)
      .neq("id", productId)
      .single()

    if (existingSku) {
      return NextResponse.json({ error: "SKU already exists on another product" }, { status: 400 })
    }

    // Update product
    const { data, error: updateError } = await supabase
      .from("products")
      .update({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        compare_at_price: productData.compareAtPrice,
        images: productData.images || [],
        category: productData.category,
        tags: productData.tags || [],
        sku: productData.sku,
        barcode: productData.barcode,
        inventory_quantity: productData.inventory?.quantity,
        low_stock_threshold: productData.inventory?.lowStockThreshold,
        inventory_managed: productData.inventory?.managed,
        inventory_status: productData.inventory?.status,
        attributes: productData.attributes || {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select("*")
      .single()

    if (updateError) {
      console.error("Error updating product:", updateError)
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
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
    console.error("Error in product update API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    // Verify admin authentication
    const { success, admin, error } = await verifyAdminToken()

    if (!success || !admin) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    // Get Supabase client
    const supabase = getServiceSupabase()

    // Check if product exists
    const { data: existingProduct, error: checkError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .single()

    if (checkError && checkError.code === "PGRST116") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if product is used in any orders
    const { count, error: orderError } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId)

    if (count && count > 0) {
      return NextResponse.json({ error: "Cannot delete product that is used in orders" }, { status: 400 })
    }

    // First delete related inventory logs
    await supabase.from("inventory_logs").delete().eq("product_id", productId)

    // Delete product
    const { error: deleteError } = await supabase.from("products").delete().eq("id", productId)

    if (deleteError) {
      console.error("Error deleting product:", deleteError)
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    console.error("Error in product deletion API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

