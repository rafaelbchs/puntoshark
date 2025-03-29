import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sku = searchParams.get("sku")
    const productId = searchParams.get("productId")

    if (!sku) {
      return NextResponse.json({ error: "SKU is required" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Build query to check if SKU exists
    let query = supabase.from("products").select("id", { count: "exact", head: true }).eq("sku", sku)

    // If productId is provided, exclude that product from the check
    // (useful when updating a product - we don't want to count its own SKU as a duplicate)
    if (productId) {
      query = query.neq("id", productId)
    }

    const { count: productCount, error: productError } = await query

    if (productError) {
      console.error("Error checking product SKU:", productError)
      return NextResponse.json({ error: "Failed to check SKU uniqueness" }, { status: 500 })
    }

    // Also check in product_variants table
    const variantQuery = supabase.from("product_variants").select("id", { count: "exact", head: true }).eq("sku", sku)

    const { count: variantCount, error: variantError } = await variantQuery

    if (variantError) {
      console.error("Error checking variant SKU:", variantError)
      return NextResponse.json({ error: "Failed to check SKU uniqueness" }, { status: 500 })
    }

    // SKU is unique if it doesn't exist in either table
    const isUnique = productCount === 0 && variantCount === 0

    return NextResponse.json({ isUnique })
  } catch (error) {
    console.error("Unexpected error checking SKU:", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}

