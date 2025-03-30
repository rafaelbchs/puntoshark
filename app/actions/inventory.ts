"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { getServiceSupabase } from "@/lib/supabase"
import type { Product, ProductVariant, InventoryUpdateLog, LogFilter } from "@/types/inventory"

const getSupabase = () => getServiceSupabase()

// Improved SKU generation function to minimize duplicates
async function generateUniqueSKU(name: string, category: string): Promise<string> {
  const supabase = getSupabase()

  // Get first 3 letters of category (uppercase)
  const categoryPrefix = (category || "GEN").substring(0, 3).toUpperCase()

  // Get first 3 letters of product name (uppercase)
  const namePrefix = (name || "PRD").substring(0, 3).toUpperCase()

  // Add timestamp component (last 4 digits of current timestamp)
  const timestamp = Date.now().toString().slice(-4)

  // Generate a random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000)

  // Combine all parts to create a more unique SKU
  const proposedSKU = `${categoryPrefix}-${namePrefix}-${timestamp}${randomNum}`

  // Check if this SKU already exists
  const { count } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("sku", proposedSKU)

  // If SKU exists, recursively try again with a new random number
  if (count && count > 0) {
    console.log(`SKU ${proposedSKU} already exists, generating a new one...`)
    return generateUniqueSKU(name, category)
  }

  return proposedSKU
}

// Function to create a new product
export async function createProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<{
  success: boolean
  product?: Product
  error?: string
}> {
  try {
    const supabase = getSupabase()

    // Generate a UUID for the product
    const id = randomUUID()

    // Filter out any blob URLs from images
    const validImages = product.images?.filter((url) => !url.startsWith("blob:")) || []

    // Generate a unique SKU if not provided
    const sku = product.sku || (await generateUniqueSKU(product.name, product.category))

    // Set default gender to "unisex" if not provided
    const gender = product.gender || "unisex"

    // Prepare the data for insertion
    const dbProduct = {
      id,
      name: product.name,
      description: product.description,
      price: product.price,
      compare_at_price: product.compareAtPrice,
      images: validImages,
      category: product.category,
      subcategory: product.subcategory,
      product_type: product.productType,
      gender: gender,
      tags: product.tags || [],
      sku,
      barcode: product.barcode,
      inventory_quantity: product.inventory_quantity || 0,
      low_stock_threshold: product.low_stock_threshold || 5,
      inventory_status: product.inventory_status || "in_stock",
      inventory_managed: product.inventory_managed || true,
      attributes: product.attributes || {},
      has_variants: product.has_variants || false,
      variant_attributes: product.variant_attributes || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("products").insert([dbProduct]).select("*").single()

    if (error) {
      console.error("Error creating product:", error)

      // Check if it's a duplicate SKU error
      if (error.message.includes("duplicate key") && error.message.includes("sku")) {
        // Try again with a forced new SKU
        console.log("Duplicate SKU detected, retrying with a new SKU...")
        const newSku = await generateUniqueSKU(product.name, product.category)
        return createProduct({
          ...product,
          sku: newSku,
        })
      }

      return { success: false, error: error.message }
    }

    // Create or update the category in the categories table
    await createOrUpdateCategory(product.category, product.subcategory)

    revalidatePath("/admin/products")
    revalidatePath("/admin/inventory")
    revalidatePath("/")
    revalidatePath(`/collections/${gender}/${product.category}`)

    return { success: true, product: transformDbProductToProduct(data) }
  } catch (error: any) {
    console.error("Unexpected error creating product:", error)
    return { success: false, error: error.message || "Unexpected error creating product" }
  }
}

// Function to update an existing product
export async function updateProduct(
  id: string,
  updates: Partial<Product>,
): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const supabase = getSupabase()

    // Prepare the data for update
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // Map frontend field names to database field names
    if (updates.compareAtPrice !== undefined) {
      updateData.compare_at_price = updates.compareAtPrice
      delete updateData.compareAtPrice
    }

    if (updates.productType !== undefined) {
      updateData.product_type = updates.productType
      delete updateData.productType
    }

    if (updates.variantAttributes !== undefined) {
      updateData.variant_attributes = updates.variantAttributes
      delete updateData.variantAttributes
    }

    if (updates.hasVariants !== undefined) {
      updateData.has_variants = updates.hasVariants
      delete updateData.hasVariants
    }

    // If inventory fields are provided in the nested inventory object, flatten them
    if (updates.inventory) {
      if (updates.inventory.quantity !== undefined) {
        updateData.inventory_quantity = updates.inventory.quantity
      }
      if (updates.inventory.lowStockThreshold !== undefined) {
        updateData.low_stock_threshold = updates.inventory.lowStockThreshold
      }
      if (updates.inventory.status !== undefined) {
        updateData.inventory_status = updates.inventory.status
      }
      if (updates.inventory.managed !== undefined) {
        updateData.inventory_managed = updates.inventory.managed
      }
      delete updateData.inventory
    }

    // If SKU is being updated, check if it's unique
    if (updates.sku) {
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("sku", updates.sku)
        .neq("id", id) // Exclude the current product

      if (count && count > 0) {
        return {
          success: false,
          error: "SKU already exists. Please use a different SKU.",
        }
      }
    }

    const { data, error } = await supabase.from("products").update(updateData).eq("id", id).select("*").single()

    if (error) {
      console.error("Error updating product:", error)
      return { success: false, error: error.message }
    }

    // Create or update the category in the categories table if category is updated
    if (updates.category) {
      await createOrUpdateCategory(updates.category, updates.subcategory)
    }

    revalidatePath("/admin/products")
    revalidatePath("/admin/inventory")
    revalidatePath("/")
    revalidatePath(`/collections/${data.gender}/${data.category}`)

    return { success: true, product: transformDbProductToProduct(data) }
  } catch (error: any) {
    console.error("Unexpected error updating product:", error)
    return { success: false, error: error.message || "Unexpected error updating product" }
  }
}

// Create or update a category in the categories table
async function createOrUpdateCategory(category: string, subcategory = "") {
  const supabase = getSupabase()

  // Check if the category already exists
  const { data: existingCategory, error: categoryError } = await supabase
    .from("categories")
    .select("*")
    .eq("name", category)
    .single()

  if (categoryError && categoryError.code !== "PGRST116") {
    console.error("Error checking existing category:", categoryError)
    return // Stop if there's an error other than 'not found'
  }

  if (!existingCategory) {
    // Category doesn't exist, so create it
    const { error: insertError } = await supabase.from("categories").insert([
      {
        name: category,
        subcategories: subcategory ? [subcategory] : [],
      },
    ])

    if (insertError) {
      console.error("Error creating category:", insertError)
    } else {
      revalidatePath("/categories")
    }
  } else {
    // Category exists, check if subcategory needs to be added to the array
    if (subcategory) {
      const currentSubcategories = existingCategory.subcategories || []

      // Only add if it doesn't already exist in the array
      if (!currentSubcategories.includes(subcategory)) {
        const updatedSubcategories = [...currentSubcategories, subcategory]

        const { error: updateError } = await supabase
          .from("categories")
          .update({ subcategories: updatedSubcategories })
          .eq("name", category)

        if (updateError) {
          console.error("Error updating subcategories:", updateError)
        } else {
          revalidatePath("/categories")
        }
      }
    }
  }
}

// Function to get all categories
export async function getCategories(): Promise<{ name: string; subcategories: string[] }[]> {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    return data.map((category) => ({
      name: category.name,
      subcategories: category.subcategories || [],
    }))
  } catch (error) {
    console.error("Failed to get categories:", error)
    return []
  }
}

// Function to update inventory
export async function updateInventory(
  productId: string,
  newQuantity: number,
  reason: string,
  orderId?: string,
  userId?: string,
  details?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabase()

    // Get the product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()

    if (productError) {
      console.error("Error fetching product:", productError)
      return { success: false, error: "Product not found" }
    }

    // Determine new status
    const newStatus =
      newQuantity <= 0 ? "out_of_stock" : newQuantity <= product.low_stock_threshold ? "low_stock" : "in_stock"

    // Update product inventory
    const { error: updateError } = await supabase
      .from("products")
      .update({
        inventory_quantity: newQuantity,
        inventory_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)

    if (updateError) {
      console.error("Error updating inventory:", updateError)
      return { success: false, error: "Failed to update inventory" }
    }

    // Create inventory log
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("username")
      .eq("id", userId)
      .single()

    const { error: logError } = await supabase.from("inventory_logs").insert([
      {
        product_id: productId,
        product_name: product.name,
        previous_quantity: product.inventory_quantity,
        new_quantity: newQuantity,
        reason,
        order_id: orderId,
        user_id: userId,
        admin_name: admin?.username,
        details,
      },
    ])

    if (logError) {
      console.error("Error creating inventory log:", logError)
    }

    revalidatePath("/admin/inventory")
    revalidatePath(`/admin/inventory/adjust/${productId}`)
    revalidatePath(`/admin/inventory/logs`)
    revalidatePath(`/admin/products/${productId}`)

    return { success: true }
  } catch (error) {
    console.error("Unexpected error updating inventory:", error)
    return { success: false, error: "Unexpected error updating inventory" }
  }
}

// Function to "delete" a product (soft delete by marking as discontinued)
export async function deleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabase()

    // Instead of deleting, update the product to mark it as discontinued
    const { error } = await supabase
      .from("products")
      .update({
        inventory_status: "discontinued",
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)

    if (error) {
      console.error("Error deleting product:", error)
      return { success: false, error: error.message }
    }

    // Revalidate all relevant paths
    revalidatePath("/admin/products")
    revalidatePath("/admin/inventory")
    revalidatePath("/")
    revalidatePath("/collections")

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error deleting product:", error)
    return { success: false, error: error.message || "Unexpected error deleting product" }
  }
}

// Helper function to transform database product to frontend product
function transformDbProductToProduct(data: any): Product {
  return {
    id: data.id,
    name: data.name,
    description: data.description || "",
    price: data.price,
    compareAtPrice: data.compare_at_price,
    images: data.images || [],
    category: data.category || "",
    subcategory: data.subcategory,
    productType: data.product_type,
    gender: data.gender,
    tags: data.tags || [],
    sku: data.sku,
    barcode: data.barcode,
    inventory: {
      quantity: data.inventory_quantity,
      lowStockThreshold: data.low_stock_threshold,
      status: data.inventory_status,
      managed: data.inventory_managed,
    },
    attributes: data.attributes || {},
    hasVariants: data.has_variants || false,
    variantAttributes: data.variant_attributes || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    // Keep the original fields too for compatibility
    inventory_quantity: data.inventory_quantity,
    inventory_status: data.inventory_status,
    inventory_managed: data.inventory_managed,
    low_stock_threshold: data.low_stock_threshold,
  }
}

// Function to get a product by ID
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching product:", error)
      return null
    }

    return transformDbProductToProduct(data)
  } catch (error) {
    console.error("Unexpected error fetching product:", error)
    return null
  }
}

// Function to get all products
export async function getProducts(includeDiscontinued = false): Promise<Product[]> {
  try {
    const supabase = getSupabase()
    let query = supabase.from("products").select("*").order("created_at", { ascending: false })

    if (!includeDiscontinued) {
      query = query.neq("inventory_status", "discontinued")
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

    // Transform the database models to match the frontend model
    return data.map(transformDbProductToProduct)
  } catch (error) {
    console.error("Unexpected error fetching products:", error)
    return []
  }
}

// Function to get inventory logs
export async function getInventoryLogs(filter: LogFilter): Promise<{ logs: InventoryUpdateLog[]; total: number }> {
  try {
    const supabase = getSupabase()

    let query = supabase
      .from("inventory_logs")
      .select("*, products(name)", { count: "exact" })
      .order("timestamp", { ascending: false })

    if (filter.productId) {
      query = query.eq("product_id", filter.productId)
    }

    if (filter.reason) {
      query = query.eq("reason", filter.reason)
    }

    if (filter.adminId) {
      query = query.eq("user_id", filter.adminId)
    }

    if (filter.dateFrom) {
      query = query.gte("timestamp", filter.dateFrom)
    }

    if (filter.dateTo) {
      query = query.lte("timestamp", filter.dateTo)
    }

    if (filter.searchTerm) {
      query = query.ilike("products.name", `%${filter.searchTerm}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching inventory logs:", error)
      return { logs: [], total: 0 }
    }

    const logs: InventoryUpdateLog[] = data.map((log: any) => ({
      id: log.id,
      productId: log.product_id,
      productName: log.products?.name || "Unknown",
      previousQuantity: log.previous_quantity,
      newQuantity: log.new_quantity,
      reason: log.reason,
      orderId: log.order_id,
      userId: log.user_id,
      adminName: log.admin_name,
      details: log.details,
      timestamp: log.timestamp,
    }))

    return { logs, total: count || 0 }
  } catch (error) {
    console.error("Failed to get inventory logs:", error)
    return { logs: [], total: 0 }
  }
}

// Function to create a new product variant
export async function createProductVariant(
  productId: string,
  variant: Omit<ProductVariant, "id" | "createdAt" | "updatedAt" | "productId">,
): Promise<{ success: boolean; variant?: ProductVariant; error?: string }> {
  try {
    const supabase = getSupabase()

    // Get the parent product to use for SKU generation if needed
    const { data: parentProduct } = await supabase
      .from("products")
      .select("name, category, sku")
      .eq("id", productId)
      .single()

    // Generate a unique SKU for the variant if not provided
    let variantSku = variant.sku
    if (!variantSku && parentProduct) {
      // Use parent SKU as base and add variant suffix
      const baseSku = parentProduct.sku || (await generateUniqueSKU(parentProduct.name, parentProduct.category))
      const variantSuffix = Date.now().toString().slice(-3) + Math.floor(100 + Math.random() * 900)
      variantSku = `${baseSku}-V${variantSuffix}`

      // Check if this variant SKU already exists
      const { count } = await supabase
        .from("product_variants")
        .select("*", { count: "exact", head: true })
        .eq("sku", variantSku)

      // If SKU exists, generate a completely new one
      if (count && count > 0) {
        variantSku = await generateUniqueSKU(parentProduct.name + " Variant", parentProduct.category)
      }
    }

    const { data, error } = await supabase
      .from("product_variants")
      .insert([
        {
          product_id: productId,
          sku: variantSku,
          price: variant.price,
          compare_at_price: variant.compareAtPrice,
          inventory_quantity: variant.inventory.quantity,
          low_stock_threshold: variant.inventory.lowStockThreshold,
          inventory_status: variant.inventory.status,
          inventory_managed: variant.inventory.managed,
          attributes: variant.attributes,
        },
      ])
      .select("*")
      .single()

    if (error) {
      console.error("Error creating product variant:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/products/${productId}`)

    return { success: true, variant: data as ProductVariant }
  } catch (error) {
    console.error("Unexpected error creating product variant:", error)
    return { success: false, error: "Unexpected error creating product variant" }
  }
}

// Function to update an existing product variant
export async function updateProductVariant(
  variantId: string,
  updates: Partial<ProductVariant>,
): Promise<{ success: boolean; variant?: ProductVariant; error?: string }> {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from("product_variants")
      .update({
        sku: updates.sku,
        price: updates.price,
        compare_at_price: updates.compareAtPrice,
        inventory_quantity: updates.inventory?.quantity,
        low_stock_threshold: updates.inventory?.lowStockThreshold,
        inventory_status: updates.inventory?.status,
        inventory_managed: updates.inventory?.managed,
        attributes: updates.attributes,
      })
      .eq("id", variantId)
      .select("*")
      .single()

    if (error) {
      console.error("Error updating product variant:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/products/${data.product_id}`)

    return { success: true, variant: data as ProductVariant }
  } catch (error) {
    console.error("Unexpected error updating product variant:", error)
    return { success: false, error: "Unexpected error updating product variant" }
  }
}

// Function to delete a product variant
export async function deleteProductVariant(variantId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabase()

    const { error } = await supabase.from("product_variants").delete().eq("id", variantId)

    if (error) {
      console.error("Error deleting product variant:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/products")
    revalidatePath("/admin/inventory")

    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting product variant:", error)
    return { success: false, error: "Unexpected error deleting product variant" }
  }
}

export async function getProductsByCategory(category: string, gender?: string): Promise<Product[]> {
  const supabase = getSupabase()
  let query = supabase.from("products").select("*").order("created_at", { ascending: false })

  // For accessories, we need to handle them differently
  if (category.toLowerCase() === "accessories" || gender === "accessories") {
    // Use product_type for accessories instead of category
    query = query.eq("product_type", "accessories")
  } else {
    // For other categories, filter by category and gender if provided
    query = query.ilike("category", `%${category}%`)

    // If gender is provided, filter by gender
    if (gender && gender !== "accessories") {
      query = query.eq("gender", gender)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching products by category:", error)
    throw new Error("Failed to fetch products by category")
  }

  return data.map(transformDbProductToProduct)
}