"use server"

import { getServiceSupabase } from "@/lib/supabase"
import { revalidateTag } from "next/cache"
import type { Product } from "@/types/product"
import { PRODUCTS_CACHE_TAG } from "@/lib/constants"

export async function getProductsFromDatabase(): Promise<Product[]> {
  try {
    console.log("Fetching products from database...")
    const supabase = getServiceSupabase()

    // Use fetch with cache tags for better control over caching
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

    console.log(`Found ${data?.length || 0} products in database`)

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

// Function to revalidate product cache
export async function revalidateProductCache() {
  revalidateTag(PRODUCTS_CACHE_TAG)
  console.log("Product cache revalidated")
}

