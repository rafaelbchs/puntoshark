"use server"

import { revalidatePath } from "next/cache"
import { getServiceSupabase } from "@/lib/supabase"

// Get Supabase admin client
const getSupabase = () => getServiceSupabase()

// Get all products
export async function getProducts() {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("products").select("*").order("updated_at", { ascending: false })

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

// Get product by ID
export async function getProductById(id) {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") return null // No rows returned
      throw error
    }

    if (!data) return null

    // Transform database model to our application model
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
  } catch (error) {
    console.error("Failed to get product by ID:", error)
    throw error
  }
}

// Create a new product
export async function createProduct(productData) {
  try {
    const supabase = getSupabase()

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
          tags: productData.tags,
          sku: productData.sku,
          barcode: productData.barcode,
          inventory_quantity: productData.inventory.quantity,
          low_stock_threshold: productData.inventory.lowStockThreshold,
          inventory_managed: productData.inventory.managed,
          inventory_status: productData.inventory.status,
          attributes: productData.attributes || {},
        },
      ])
      .select("*")
      .single()

    if (error) throw error

    revalidatePath("/admin/products")

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
      },
    }
  } catch (error) {
    console.error("Failed to create product:", error)
    return { success: false, error: "Failed to create product" }
  }
}

// Update a product
export async function updateProduct(id, productData) {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from("products")
      .update({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        compare_at_price: productData.compareAtPrice,
        images: productData.images,
        category: productData.category,
        tags: productData.tags,
        sku: productData.sku,
        barcode: productData.barcode,
        inventory_quantity: productData.inventory?.quantity,
        low_stock_threshold: productData.inventory?.lowStockThreshold,
        inventory_managed: productData.inventory?.managed,
        inventory_status: productData.inventory?.status,
        attributes: productData.attributes || {},
      })
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error

    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${id}`)

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
      },
    }
  } catch (error) {
    console.error("Failed to update product:", error)
    return { success: false, error: "Failed to update product" }
  }
}

// Delete a product
export async function deleteProduct(id) {
  try {
    const supabase = getSupabase()

    // First delete related inventory logs
    await supabase.from("inventory_logs").delete().eq("product_id", id)

    // Then delete the product
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/admin/products")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete product:", error)
    return { success: false, error: "Failed to delete product" }
  }
}

// Update inventory quantity
export async function updateInventory(
  productId,
  newQuantity,
  reason,
  orderId,
  userId
) {
  try {
    const supabase = getSupabase()
    
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

    // Determine new status
    const newStatus = determineProductStatus(newQuantity, product.low_stock_threshold)

    // Update product
    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({
        inventory_quantity: newQuantity,
        inventory_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", productId)
      .select("*")
      .single()

    if (updateError) {
      console.error("Product update error:", updateError)
      return { success: false, error: "Failed to update product" }
    }

    // Create inventory log
    const { data: log, error: logError } = await supabase
      .from("inventory_logs")
      .insert([{
        product_id: productId,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        reason,
        order_id: orderId,
        user_id: userId,
        timestamp: new Date().toISOString()
      }])
      .select("*")
      .single()

    if (logError) {
      console.error("Log creation error:", logError)
      // Continue even if log creation fails
    }

    // Revalidate paths
    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${productId}`)
    revalidatePath("/admin/inventory")

    // Transform database models to our application models
    return {
      success: true,
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description || "",
        price: updatedProduct.price,
        compareAtPrice: updatedProduct.compare_at_price || undefined,
        images: updatedProduct.images,
        category: updatedProduct.category || "",
        tags: updatedProduct.tags,
        sku: updatedProduct.sku,
        barcode: updatedProduct.barcode || undefined,
        inventory: {
          quantity: updatedProduct.inventory_quantity,
          lowStockThreshold: updatedProduct.low_stock_threshold,
          status: updatedProduct.inventory_status,
          managed: updatedProduct.inventory_managed,
        },
        attributes: updatedProduct.attributes || {},
        createdAt: updatedProduct.created_at,
        updatedAt: updatedProduct.updated_at,
      },
      log: log ? {
        id: log.id,
        productId: log.product_id,
        previousQuantity: log.previous_quantity,
        newQuantity: log.new_quantity,
        reason: log.reason,
        orderId: log.order_id || undefined,
        userId: log.user_id || undefined,
        timestamp: log.timestamp,
      } : undefined,
    }
  } catch (error) {
    console.error("Failed to update inventory:", error)
    return { success: false, error: "Failed to update inventory" }
  }
}

// Helper function to determine product status based on quantity
function determineProductStatus(quantity, lowStockThreshold) {
  if (quantity <= 0) {
    return "out_of_stock"
  } else if (quantity <= lowStockThreshold) {
    return "low_stock"
  } else {
    return "in_stock"
  }
}

export async function getInventoryLogs(productId) {
  try {
    const supabase = getSupabase()
    
    // Build the query
    let query = supabase.from("inventory_logs").select("*").order("timestamp", { ascending: false })
    
    // Add filter if productId is provided
    if (productId) {
      query = query.eq("product_id", productId)
    }
    
    // Execute the query
    const { data, error } = await query
    
    if (error) throw error

    // Transform database models to our application models
    return data.map((log) => ({
      id: log.id,
      productId: log.product_id,
      previousQuantity: log.previous_quantity,
      newQuantity: log.new_quantity,
      reason: log.reason,
      orderId: log.order_id || undefined,
      userId: log.user_id || undefined,
      timestamp: log.timestamp,
    }))
  } catch (error) {
    console.error("Failed to get inventory logs:", error)
    throw error
  }
}