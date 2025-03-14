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
export async function updateInventory(productId, newQuantity, reason, orderId, userId = "admin") {
  try {
    const supabase = getSupabase()

    // Get current product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()

    if (productError) throw productError
    if (!product) {
      return { success: false, error: "Product not found" }
    }

    const previousQuantity = product.inventory_quantity

    // Determine new status
    const newStatus = determineProductStatus(newQuantity, product.low_stock_threshold)

    // Start a transaction using RPC (you'll need to create this function in Supabase)
    const { data, error } = await supabase.rpc("update_inventory", {
      p_product_id: productId,
      p_new_quantity: newQuantity,
      p_new_status: newStatus,
      p_previous_quantity: previousQuantity,
      p_reason: reason,
      p_order_id: orderId,
      p_user_id: userId,
    })

    if (error) {
      // If RPC doesn't exist, do it manually
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

      if (updateError) throw updateError

      // Create inventory log
      const { data: log, error: logError } = await supabase
        .from("inventory_logs")
        .insert([
          {
            product_id: productId,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            reason: reason,
            order_id: orderId,
            user_id: userId,
          },
        ])
        .select("*")
        .single()

      if (logError) throw logError

      revalidatePath("/admin/products")
      revalidatePath(`/admin/products/${productId}`)
      revalidatePath("/admin/inventory")

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
        log: {
          id: log.id,
          productId: log.product_id,
          previousQuantity: log.previous_quantity,
          newQuantity: log.new_quantity,
          reason: log.reason,
          orderId: log.order_id || undefined,
          userId: log.user_id || undefined,
          timestamp: log.timestamp,
        },
      }
    }

    // If RPC was successful
    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${productId}`)
    revalidatePath("/admin/inventory")

    return {
      success: true,
      product: data.product,
      log: data.log,
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

