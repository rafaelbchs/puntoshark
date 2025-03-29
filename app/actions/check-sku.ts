"use server"

import { getServiceSupabase } from "@/lib/supabase"

// Function to check if a SKU already exists
export async function checkSkuExists(sku: string, currentProductId?: string): Promise<boolean> {
  try {
    const supabase = getServiceSupabase()

    let query = supabase
      .from("products")
      .select("id")
      .eq("sku", sku)
      .eq("inventory_status", "discontinued", { negate: true }) // Exclude discontinued products

    // If we're editing an existing product, exclude it from the check
    if (currentProductId) {
      query = query.neq("id", currentProductId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error checking SKU:", error)
      return false
    }

    return data.length > 0
  } catch (error) {
    console.error("Unexpected error checking SKU:", error)
    return false
  }
}

