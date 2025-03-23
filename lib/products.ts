"use server"

import { getServiceSupabase } from "@/lib/supabase"
import type { Product } from "@/types/product"

export async function getProductsFromDatabase(): Promise<Product[]> {
  try {
    console.log("Fetching products from database...")
    const supabase = getServiceSupabase()

    // Log the Supabase URL to verify connection (don't log the key!)
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)

    const { data, error } = await supabase.from("products").select("*")

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

    console.log("Products data from database:", data)

    if (!data || data.length === 0) {
      console.log("No products found in the database")
      return []
    }

    // Transform database products to match your Product interface
    return data.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images && product.images.length > 0 ? product.images[0] : "/placeholder.svg?height=200&width=200",
      description: product.description || "",
      category: product.category || "",
    }))
  } catch (error) {
    console.error("Failed to fetch products:", error)
    console.error("Error details:", error instanceof Error ? error.message : String(error))
    return []
  }
}