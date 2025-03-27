"use server"

import { revalidatePath } from "next/cache"
import { getServiceSupabase } from "@/lib/supabase"
import { revalidateProductCache } from "@/lib/products"
import type { Product, ProductStatus, InventoryUpdateLog, ProductVariant } from "@/types/inventory"
import type { Omit } from "@/types/utils"
import type { Partial } from "@/types/utils"

// Add these imports at the top if not already present
import { getCurrentAdmin } from "@/lib/auth"

// Get Supabase admin client
const getSupabase = () => getServiceSupabase()

// Get all products
export async function getProducts(includeDiscontinued = true): Promise<Product[]> {
  try {
    const supabase = getSupabase()
    let query = supabase.from("products").select("*").order("updated_at", { ascending: false })

    // Filter out discontinued products if not explicitly included
    if (!includeDiscontinued) {
      query = query.neq("inventory_status", "discontinued")
    }

    const { data, error } = await query

    if (error) throw error

    // Transform database model to our application model
    return data.map((product) => ({
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
  } catch (error) {
    console.error("Failed to get products:", error)
    throw error
  }
}

// Get product variants for a specific product
export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true })

    if (error) throw error

    // Transform database model to our application model
    return data.map((variant) => ({
      id: variant.id,
      productId: variant.product_id,
      sku: variant.sku,
      price: variant.price,
      compareAtPrice: variant.compare_at_price || undefined,
      inventory: {
        quantity: variant.inventory_quantity,
        lowStockThreshold: variant.low_stock_threshold,
        status: variant.inventory_status,
        managed: variant.inventory_managed,
      },
      attributes: variant.attributes || {},
      barcode: variant.barcode || undefined,
      images: variant.images || [],
      createdAt: variant.created_at,
      updatedAt: variant.updated_at,
    }))
  } catch (error) {
    console.error("Failed to get product variants:", error)
    throw error
  }
}

// Create a product variant
export async function createProductVariant(
  productId: string,
  variantData: Omit<ProductVariant, "id" | "productId" | "createdAt" | "updatedAt">,
): Promise<{ success: boolean; variant?: ProductVariant; error?: string }> {
  try {
    const supabase = getSupabase()
    const admin = await getCurrentAdmin()

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, has_variants")
      .eq("id", productId)
      .single()

    if (productError) throw productError

    // Update the product to indicate it has variants if not already set
    if (!product.has_variants) {
      await supabase.from("products").update({ has_variants: true }).eq("id", productId)
    }

    // Create the variant
    const { data, error } = await supabase
      .from("product_variants")
      .insert([
        {
          product_id: productId,
          sku: variantData.sku,
          price: variantData.price,
          compare_at_price: variantData.compareAtPrice,
          inventory_quantity: variantData.inventory.quantity,
          low_stock_threshold: variantData.inventory.lowStockThreshold,
          inventory_status: variantData.inventory.status,
          inventory_managed: variantData.inventory.managed,
          attributes: variantData.attributes || {},
          barcode: variantData.barcode,
          images: variantData.images || [],
        },
      ])
      .select("*")
      .single()

    if (error) throw error

    // Log the variant creation
    await supabase.from("inventory_logs").insert([
      {
        product_id: productId,
        previous_quantity: 0,
        new_quantity: data.inventory_quantity,
        reason: "variant_created",
        user_id: admin?.id,
        admin_name: admin?.username,
        details: `Variant "${data.sku}" created with initial inventory of ${data.inventory_quantity}`,
        timestamp: new Date().toISOString(),
      },
    ])

    // Revalidate paths and cache
    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${productId}`)
    await revalidateProductCache()

    // Transform database model to our application model
    return {
      success: true,
      variant: {
        id: data.id,
        productId: data.product_id,
        sku: data.sku,
        price: data.price,
        compareAtPrice: data.compare_at_price || undefined,
        inventory: {
          quantity: data.inventory_quantity,
          lowStockThreshold: data.low_stock_threshold,
          status: data.inventory_status,
          managed: data.inventory_managed,
        },
        attributes: data.attributes || {},
        barcode: data.barcode || undefined,
        images: data.images || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    }
  } catch (error) {
    console.error("Failed to create product variant:", error)
    return { success: false, error: "Failed to create product variant" }
  }
}

// Update a product variant
export async function updateProductVariant(
  variantId: string,
  variantData: Partial<ProductVariant>,
): Promise<{ success: boolean; variant?: ProductVariant; error?: string }> {
  try {
    const supabase = getSupabase()
    const admin = await getCurrentAdmin()

    // Get the current variant state to compare changes
    const { data: currentVariant, error: fetchError } = await supabase
      .from("product_variants")
      .select("*, products!inner(name)")
      .eq("id", variantId)
      .single()

    if (fetchError) throw fetchError

    // Prepare update data
    const updateData: any = {}
    if (variantData.sku !== undefined) updateData.sku = variantData.sku
    if (variantData.price !== undefined) updateData.price = variantData.price
    if (variantData.compareAtPrice !== undefined) updateData.compare_at_price = variantData.compareAtPrice
    if (variantData.inventory?.quantity !== undefined) updateData.inventory_quantity = variantData.inventory.quantity
    if (variantData.inventory?.lowStockThreshold !== undefined)
      updateData.low_stock_threshold = variantData.inventory.lowStockThreshold
    if (variantData.inventory?.managed !== undefined) updateData.inventory_managed = variantData.inventory.managed
    if (variantData.inventory?.status !== undefined) updateData.inventory_status = variantData.inventory.status
    if (variantData.attributes !== undefined) updateData.attributes = variantData.attributes
    if (variantData.barcode !== undefined) updateData.barcode = variantData.barcode
    if (variantData.images !== undefined) updateData.images = variantData.images
    updateData.updated_at = new Date().toISOString()

    // Update the variant
    const { data, error } = await supabase
      .from("product_variants")
      .update(updateData)
      .eq("id", variantId)
      .select("*")
      .single()

    if (error) throw error

    // Generate details about what changed
    const changes: string[] = []
    if (currentVariant.sku !== data.sku) changes.push(`SKU changed from "${currentVariant.sku}" to "${data.sku}"`)
    if (currentVariant.price !== data.price)
      changes.push(`price changed from $${currentVariant.price} to $${data.price}`)
    if (currentVariant.inventory_quantity !== data.inventory_quantity) {
      changes.push(`inventory quantity changed from ${currentVariant.inventory_quantity} to ${data.inventory_quantity}`)
    }

    // Log the variant update if inventory changed
    if (currentVariant.inventory_quantity !== data.inventory_quantity) {
      await supabase.from("inventory_logs").insert([
        {
          product_id: currentVariant.product_id,
          previous_quantity: currentVariant.inventory_quantity,
          new_quantity: data.inventory_quantity,
          reason: "variant_updated",
          user_id: admin?.id,
          admin_name: admin?.username,
          details:
            changes.length > 0
              ? `Variant "${data.sku}" updated: ${changes.join(", ")}`
              : `Variant "${data.sku}" updated with no significant changes`,
          timestamp: new Date().toISOString(),
        },
      ])
    }

    // Revalidate paths and cache
    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${currentVariant.product_id}`)
    await revalidateProductCache()

    // Transform database model to our application model
    return {
      success: true,
      variant: {
        id: data.id,
        productId: data.product_id,
        sku: data.sku,
        price: data.price,
        compareAtPrice: data.compare_at_price || undefined,
        inventory: {
          quantity: data.inventory_quantity,
          lowStockThreshold: data.low_stock_threshold,
          status: data.inventory_status,
          managed: data.inventory_managed,
        },
        attributes: data.attributes || {},
        barcode: data.barcode || undefined,
        images: data.images || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    }
  } catch (error) {
    console.error("Failed to update product variant:", error)
    return { success: false, error: "Failed to update product variant" }
  }
}

// Delete a product variant
export async function deleteProductVariant(variantId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabase()
    const admin = await getCurrentAdmin()

    // Get the variant before deletion to include in the log
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("*, products!inner(id, name)")
      .eq("id", variantId)
      .single()

    if (variantError) throw variantError

    // Check if the variant is referenced in any orders
    const { count, error: checkError } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("variant_id", variantId)

    if (checkError) {
      console.error("Error checking order items:", checkError)
    }

    // If variant is used in orders, return an error
    if (count && count > 0) {
      return {
        success: false,
        error: "Cannot delete variant that has been ordered. Consider marking it as discontinued instead.",
      }
    }

    // Log the variant deletion before actually deleting it
    await supabase.from("inventory_logs").insert([
      {
        product_id: variant.product_id,
        previous_quantity: variant.inventory_quantity,
        new_quantity: 0,
        reason: "variant_deleted",
        user_id: admin?.id,
        admin_name: admin?.username,
        details: `Variant "${variant.sku}" deleted from product "${variant.products.name}"`,
        timestamp: new Date().toISOString(),
      },
    ])

    // Delete the variant
    const { error } = await supabase.from("product_variants").delete().eq("id", variantId)

    if (error) throw error

    // Check if this was the last variant and update the product if needed
    const { count: remainingVariants, error: countError } = await supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .eq("product_id", variant.product_id)

    if (!countError && remainingVariants === 0) {
      // This was the last variant, update the product
      await supabase.from("products").update({ has_variants: false }).eq("id", variant.product_id)
    }

    // Revalidate paths and cache
    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${variant.product_id}`)
    await revalidateProductCache()

    return { success: true }
  } catch (error) {
    console.error("Failed to delete product variant:", error)
    return { success: false, error: "Failed to delete product variant" }
  }
}

// Update the getProductById function to include variants
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") return null // No rows returned
      throw error
    }

    if (!data) return null

    // Get variants if the product has them
    let variants: ProductVariant[] = []
    if (data.has_variants) {
      const { data: variantData, error: variantError } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: true })

      if (!variantError && variantData) {
        variants = variantData.map((variant) => ({
          id: variant.id,
          productId: variant.product_id,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compare_at_price || undefined,
          inventory: {
            quantity: variant.inventory_quantity,
            lowStockThreshold: variant.low_stock_threshold,
            status: variant.inventory_status,
            managed: variant.inventory_managed,
          },
          attributes: variant.attributes || {},
          barcode: variant.barcode || undefined,
          images: variant.images || [],
          createdAt: variant.created_at,
          updatedAt: variant.updated_at,
        }))
      }
    }

    // Transform database model to our application model
    return {
      id: data.id,
      name: data.name,
      description: data.description || "",
      price: data.price,
      compareAtPrice: data.compare_at_price || undefined,
      images: data.images,
      category: data.category || "",
      subcategory: data.subcategory || undefined,
      productType: data.product_type || undefined,
      gender: data.gender || undefined,
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
      hasVariants: data.has_variants || false,
      variantAttributes: data.variant_attributes || [],
      variants: variants.length > 0 ? variants : undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error("Failed to get product by ID:", error)
    throw error
  }
}

// Update the createProduct function to support variant attributes
export async function createProduct(
  productData: Omit<Product, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const supabase = getSupabase()
    const admin = await getCurrentAdmin()

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          compare_at_price: productData.compareAtPrice,
          images: productData.images,
          category: productData.category,
          subcategory: productData.subcategory,
          product_type: productData.productType,
          gender: productData.gender,
          tags: productData.tags,
          sku: productData.sku,
          barcode: productData.barcode,
          inventory_quantity: productData.inventory.quantity,
          low_stock_threshold: productData.inventory.lowStockThreshold,
          inventory_managed: productData.inventory.managed,
          inventory_status: productData.inventory.status,
          attributes: productData.attributes || {},
          has_variants: productData.hasVariants || false,
          variant_attributes: productData.variantAttributes || [],
        },
      ])
      .select("*")
      .single()

    if (error) throw error

    // Log the product creation
    await supabase.from("inventory_logs").insert([
      {
        product_id: data.id,
        previous_quantity: 0,
        new_quantity: data.inventory_quantity,
        reason: "product_created",
        user_id: admin?.id,
        admin_name: admin?.username,
        details: `Product "${data.name}" created with initial inventory of ${data.inventory_quantity}`,
        timestamp: new Date().toISOString(),
      },
    ])

    // Revalidate paths and cache
    revalidatePath("/admin/products")
    await revalidateProductCache()

    // Transform database model to our application model
    return {
      success: true,
      product: {
        id: data.id,
        name: data.name,
        description: data.description || "",
        price: data.price,
        compareAtPrice: data.compare_at_price || undefined,
        images: data.images,
        category: data.category || "",
        subcategory: data.subcategory || undefined,
        productType: productData.productType,
        gender: productData.gender,
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
        hasVariants: data.has_variants || false,
        variantAttributes: data.variant_attributes || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    }
  } catch (error) {
    console.error("Failed to create product:", error)
    return { success: false, error: "Failed to create product" }
  }
}

// Update the updateProduct function to support variant attributes
export async function updateProduct(
  id: string,
  productData: Partial<Product>,
): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const supabase = getSupabase()
    const admin = await getCurrentAdmin()

    // Get the current product state to compare changes
    const { data: currentProduct, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // Prepare update data
    const updateData: any = {}
    if (productData.name !== undefined) updateData.name = productData.name
    if (productData.description !== undefined) updateData.description = productData.description
    if (productData.price !== undefined) updateData.price = productData.price
    if (productData.compareAtPrice !== undefined) updateData.compare_at_price = productData.compareAtPrice
    if (productData.images !== undefined) updateData.images = productData.images
    if (productData.category !== undefined) updateData.category = productData.category
    if (productData.subcategory !== undefined) updateData.subcategory = productData.subcategory
    if (productData.productType !== undefined) updateData.product_type = productData.productType
    if (productData.gender !== undefined) updateData.gender = productData.gender
    if (productData.tags !== undefined) updateData.tags = productData.tags
    if (productData.sku !== undefined) updateData.sku = productData.sku
    if (productData.barcode !== undefined) updateData.barcode = productData.barcode
    if (productData.inventory?.quantity !== undefined) updateData.inventory_quantity = productData.inventory.quantity
    if (productData.inventory?.lowStockThreshold !== undefined)
      updateData.low_stock_threshold = productData.inventory.lowStockThreshold
    if (productData.inventory?.managed !== undefined) updateData.inventory_managed = productData.inventory.managed
    if (productData.inventory?.status !== undefined) updateData.inventory_status = productData.inventory.status
    if (productData.attributes !== undefined) updateData.attributes = productData.attributes
    if (productData.hasVariants !== undefined) updateData.has_variants = productData.hasVariants
    if (productData.variantAttributes !== undefined) updateData.variant_attributes = productData.variantAttributes

    // Update the product
    const { data, error } = await supabase.from("products").update(updateData).eq("id", id).select("*").single()

    if (error) throw error

    // Generate details about what changed
    const changes: string[] = []
    if (currentProduct.name !== data.name) changes.push(`name changed from "${currentProduct.name}" to "${data.name}"`)
    if (currentProduct.price !== data.price)
      changes.push(`price changed from $${currentProduct.price} to $${data.price}`)
    if (currentProduct.inventory_quantity !== data.inventory_quantity) {
      changes.push(`inventory quantity changed from ${currentProduct.inventory_quantity} to ${data.inventory_quantity}`)
    }
    if (currentProduct.inventory_status !== data.inventory_status) {
      changes.push(`status changed from ${currentProduct.inventory_status} to ${data.inventory_status}`)
    }

    // Log the product update regardless of what changed
    await supabase.from("inventory_logs").insert([
      {
        product_id: data.id,
        previous_quantity: currentProduct.inventory_quantity,
        new_quantity: data.inventory_quantity,
        reason: "product_updated",
        user_id: admin?.id,
        admin_name: admin?.username,
        details:
          changes.length > 0
            ? `Product "${data.name}" updated: ${changes.join(", ")}`
            : `Product "${data.name}" updated with no significant changes`,
        timestamp: new Date().toISOString(),
      },
    ])

    // Get variants if the product has them
    let variants: ProductVariant[] = []
    if (data.has_variants) {
      const { data: variantData, error: variantError } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: true })

      if (!variantError && variantData) {
        variants = variantData.map((variant) => ({
          id: variant.id,
          productId: variant.product_id,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compare_at_price || undefined,
          inventory: {
            quantity: variant.inventory_quantity,
            lowStockThreshold: variant.low_stock_threshold,
            status: variant.inventory_status,
            managed: variant.inventory_managed,
          },
          attributes: variant.attributes || {},
          barcode: variant.barcode || undefined,
          images: variant.images || [],
          createdAt: variant.created_at,
          updatedAt: variant.updated_at,
        }))
      }
    }

    // Revalidate paths and cache
    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${id}`)
    await revalidateProductCache()

    // Transform database model to our application model
    return {
      success: true,
      product: {
        id: data.id,
        name: data.name,
        description: data.description || "",
        price: data.price,
        compareAtPrice: data.compare_at_price || undefined,
        images: data.images,
        category: data.category || "",
        subcategory: data.subcategory || undefined,
        productType: data.product_type || undefined,
        gender: data.gender || undefined,
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
        hasVariants: data.has_variants || false,
        variantAttributes: data.variant_attributes || [],
        variants: variants.length > 0 ? variants : undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    }
  } catch (error) {
    console.error("Failed to update product:", error)
    return { success: false, error: "Failed to update product" }
  }
}

// Enhance the deleteProduct function to log product deletion
export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabase()
    const admin = await getCurrentAdmin()

    // Get the product before deletion to include in the log
    const { data: product, error: productError } = await supabase.from("products").select("*").eq("id", id).single()

    if (productError) {
      console.error("Error fetching product for deletion log:", productError)
      // Continue with deletion even if we can't get the product details
    }

    // Check if the product is referenced in any orders
    const { count, error: checkError } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("product_id", id)

    if (checkError) {
      console.error("Error checking order items:", checkError)
    }

    // If product is used in orders, return an error
    if (count && count > 0) {
      return {
        success: false,
        error: "Cannot delete product that has been ordered. Consider marking it as discontinued instead.",
      }
    }

    // Log the product deletion before actually deleting it
    if (product) {
      await supabase.from("inventory_logs").insert([
        {
          product_id: id,
          previous_quantity: product.inventory_quantity,
          new_quantity: 0,
          reason: "product_deleted",
          user_id: admin?.id,
          admin_name: admin?.username,
          details: `Product "${product.name}" (SKU: ${product.sku}) deleted`,
          timestamp: new Date().toISOString(),
        },
      ])
    }

    // Then delete related inventory logs
    await supabase.from("inventory_logs").delete().eq("product_id", id)

    // Then delete the product
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("Delete product error:", error)
      return { success: false, error: error.message || "Failed to delete product" }
    }

    // Revalidate paths and cache
    revalidatePath("/admin/products")
    await revalidateProductCache() // Revalidate product cache

    return { success: true }
  } catch (error) {
    console.error("Failed to delete product:", error)
    return { success: false, error: "Failed to delete product" }
  }
}

// Enhance the updateInventory function to include admin information
export async function updateInventory(
  productId: string,
  newQuantity: number,
  reason: string,
  orderId?: string,
  userId?: string,
  notes?: string, // Add notes parameter
): Promise<{ success: boolean; product?: Product; log?: InventoryUpdateLog; error?: string }> {
  try {
    const supabase = getSupabase()
    const admin = await getCurrentAdmin()

    // Get current product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      console.error("Product fetch error:", productError)
      return { success: false, error: "Product not found" }
    }

    const previousQuantity = product.inventory_quantity

    // If quantity hasn't changed, return early with success
    if (previousQuantity === newQuantity) {
      return {
        success: true,
        product: transformProductData(product),
      }
    }

    // Determine new status
    const newStatus = determineProductStatus(newQuantity, product.low_stock_threshold)

    // Update product
    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({
        inventory_quantity: newQuantity,
        inventory_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select("*")
      .single()

    if (updateError) {
      console.error("Product update error:", updateError)
      return { success: false, error: "Failed to update product" }
    }

    // Create details message
    const detailsMessage = notes
      ? `Inventory adjusted from ${previousQuantity} to ${newQuantity} (${reason}). Notes: ${notes}`
      : `Inventory adjusted from ${previousQuantity} to ${newQuantity} (${reason})`

    // Create inventory log with admin information
    const { data: log, error: logError } = await supabase
      .from("inventory_logs")
      .insert([
        {
          product_id: productId,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          reason,
          order_id: orderId,
          user_id: userId || admin?.id,
          admin_name: admin?.username,
          details: detailsMessage,
          timestamp: new Date().toISOString(),
        },
      ])
      .select("*")
      .single()

    if (logError) {
      console.error("Log creation error:", logError)
      // Continue even if log creation fails, but return the error
      return {
        success: true,
        product: transformProductData(updatedProduct),
        error: "Product updated but failed to create log entry",
      }
    }

    // Revalidate paths and cache
    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${productId}`)
    revalidatePath("/admin/inventory")
    revalidatePath("/admin/inventory/logs")
    await revalidateProductCache() // Revalidate product cache

    // Transform database models to our application models
    return {
      success: true,
      product: transformProductData(updatedProduct),
      log: log
        ? {
            id: log.id,
            productId: log.product_id,
            productName: updatedProduct.name,
            previousQuantity: log.previous_quantity,
            newQuantity: log.new_quantity,
            reason: log.reason,
            orderId: log.order_id || undefined,
            userId: log.user_id || undefined,
            adminName: log.admin_name || undefined,
            details: log.details || undefined,
            timestamp: log.timestamp,
          }
        : undefined,
    }
  } catch (error) {
    console.error("Failed to update inventory:", error)
    return { success: false, error: "Failed to update inventory" }
  }
}

// Helper function to transform product data
function transformProductData(data: any): Product {
  return {
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
}

// Helper function to determine product status based on quantity
function determineProductStatus(quantity: number, lowStockThreshold: number): ProductStatus {
  if (quantity <= 0) {
    return "out_of_stock"
  } else if (quantity <= lowStockThreshold) {
    return "low_stock"
  } else {
    return "in_stock"
  }
}

// Modify the getInventoryLogs function to support pagination and filtering
export async function getInventoryLogs(
  options: {
    productId?: string
    reason?: string
    adminId?: string
    dateFrom?: string
    dateTo?: string
    searchTerm?: string
    page?: number
    pageSize?: number
  } = {},
): Promise<{ logs: InventoryUpdateLog[]; total: number }> {
  try {
    const supabase = getSupabase()
    const { productId, reason, adminId, dateFrom, dateTo, searchTerm, page = 1, pageSize = 10 } = options

    // Calculate pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Start building the query
    let query = supabase.from("inventory_logs").select("*, products!inner(name)", { count: "exact" })

    // Apply filters
    if (productId) {
      query = query.eq("product_id", productId)
    }

    if (reason) {
      query = query.eq("reason", reason)
    }

    if (adminId) {
      query = query.eq("user_id", adminId)
    }

    if (dateFrom) {
      query = query.gte("timestamp", dateFrom)
    }

    if (dateTo) {
      // Add one day to include the end date fully
      const nextDay = new Date(dateTo)
      nextDay.setDate(nextDay.getDate() + 1)
      query = query.lt("timestamp", nextDay.toISOString())
    }

    if (searchTerm) {
      // Search in product name or admin name or order ID
      query = query.or(
        `products.name.ilike.%${searchTerm}%,admin_name.ilike.%${searchTerm}%,order_id.ilike.%${searchTerm}%`,
      )
    }

    // Apply pagination and ordering
    query = query.order("timestamp", { ascending: false }).range(from, to)

    // Execute the query
    const { data, error, count } = await query

    if (error) throw error

    // Transform database models to our application models
    const logs = data.map((log) => ({
      id: log.id,
      productId: log.product_id,
      productName: log.products?.name,
      previousQuantity: log.previous_quantity,
      newQuantity: log.new_quantity,
      reason: log.reason,
      orderId: log.order_id || undefined,
      userId: log.user_id || undefined,
      adminName: log.admin_name || undefined,
      details: log.details || undefined,
      timestamp: log.timestamp,
    }))

    return { logs, total: count || 0 }
  } catch (error) {
    console.error("Failed to get inventory logs:", error)
    throw error
  }
}

