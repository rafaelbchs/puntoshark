"use server"

import { revalidatePath } from "next/cache"
import type { Product, ProductStatus, InventoryUpdateLog } from "@/types/inventory"

// In a production app, these would be stored in a database
const products: Product[] = []
const inventoryLogs: InventoryUpdateLog[] = []

// Generate a unique product ID
function generateProductId(): string {
  return `PRD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
}

// Generate a unique log ID
function generateLogId(): string {
  return `LOG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
}

// Get all products
export async function getProducts() {
  // In a real app, this would fetch from a database
  return products
}

// Get product by ID
export async function getProductById(id: string) {
  // In a real app, this would fetch from a database
  return products.find((product) => product.id === id)
}

// Create a new product
export async function createProduct(productData: Omit<Product, "id" | "createdAt" | "updatedAt">) {
  try {
    const newProduct: Product = {
      ...productData,
      id: generateProductId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    products.push(newProduct)
    revalidatePath("/admin/products")

    return { success: true, product: newProduct }
  } catch (error) {
    console.error("Failed to create product:", error)
    return { success: false, error: "Failed to create product" }
  }
}

// Update a product
export async function updateProduct(id: string, productData: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>) {
  try {
    const productIndex = products.findIndex((product) => product.id === id)
    if (productIndex === -1) {
      return { success: false, error: "Product not found" }
    }

    const updatedProduct = {
      ...products[productIndex],
      ...productData,
      updatedAt: new Date().toISOString(),
    }

    products[productIndex] = updatedProduct
    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${id}`)

    return { success: true, product: updatedProduct }
  } catch (error) {
    console.error("Failed to update product:", error)
    return { success: false, error: "Failed to update product" }
  }
}

// Delete a product
export async function deleteProduct(id: string) {
  try {
    const productIndex = products.findIndex((product) => product.id === id)
    if (productIndex === -1) {
      return { success: false, error: "Product not found" }
    }

    products.splice(productIndex, 1)
    revalidatePath("/admin/products")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete product:", error)
    return { success: false, error: "Failed to delete product" }
  }
}

// Update inventory quantity
export async function updateInventory(
  productId: string,
  newQuantity: number,
  reason: InventoryUpdateLog["reason"],
  orderId?: string,
  userId?: string,
) {
  try {
    const productIndex = products.findIndex((product) => product.id === productId)
    if (productIndex === -1) {
      return { success: false, error: "Product not found" }
    }

    const product = products[productIndex]
    const previousQuantity = product.inventory.quantity

    // Update product inventory
    const updatedProduct = {
      ...product,
      inventory: {
        ...product.inventory,
        quantity: newQuantity,
        status: determineProductStatus(newQuantity, product.inventory.lowStockThreshold),
      },
      updatedAt: new Date().toISOString(),
    }

    products[productIndex] = updatedProduct

    // Log the inventory change
    const log: InventoryUpdateLog = {
      id: generateLogId(),
      productId,
      previousQuantity,
      newQuantity,
      reason,
      orderId,
      userId,
      timestamp: new Date().toISOString(),
    }

    inventoryLogs.push(log)

    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${productId}`)
    revalidatePath("/admin/inventory")

    return { success: true, product: updatedProduct, log }
  } catch (error) {
    console.error("Failed to update inventory:", error)
    return { success: false, error: "Failed to update inventory" }
  }
}

// Get inventory logs
export async function getInventoryLogs(productId?: string) {
  if (productId) {
    return inventoryLogs.filter((log) => log.productId === productId)
  }
  return inventoryLogs
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

// Update inventory after order
export async function updateInventoryAfterOrder(
  orderId: string,
  userId: string,
  items: Array<{ id: string; quantity: number }>,
) {
  try {
    const results = await Promise.all(
      items.map(async (item) => {
        const product = await getProductById(item.id)
        if (!product || !product.inventory.managed) {
          return { productId: item.id, success: false, error: "Product not found or inventory not managed" }
        }

        const newQuantity = Math.max(0, product.inventory.quantity - item.quantity)
        const result = await updateInventory(item.id, newQuantity, "order", orderId, userId)

        return { productId: item.id, success: result.success, error: result.error }
      }),
    )

    return { success: true, results }
  } catch (error) {
    console.error("Failed to update inventory after order:", error)
    return { success: false, error: "Failed to update inventory after order" }
  }
}

