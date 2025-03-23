"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import type { Product, ProductStatus, InventoryUpdateLog } from "@/types/inventory"

// Get all products
export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    })

    // Transform database model to our application model
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price,
      compareAtPrice: product.compareAtPrice || undefined,
      images: product.images,
      category: product.category || "",
      tags: product.tags,
      sku: product.sku,
      barcode: product.barcode || undefined,
      inventory: {
        quantity: product.inventoryQuantity,
        lowStockThreshold: product.lowStockThreshold,
        status: product.inventoryStatus as ProductStatus,
        managed: product.inventoryManaged,
      },
      attributes: (product.attributes as Record<string, string>) || {},
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }))
  } catch (error) {
    console.error("Failed to get products:", error)
    throw error
  }
}

// Get product by ID
export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) return null

    // Transform database model to our application model
    return {
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price,
      compareAtPrice: product.compareAtPrice || undefined,
      images: product.images,
      category: product.category || "",
      tags: product.tags,
      sku: product.sku,
      barcode: product.barcode || undefined,
      inventory: {
        quantity: product.inventoryQuantity,
        lowStockThreshold: product.lowStockThreshold,
        status: product.inventoryStatus as ProductStatus,
        managed: product.inventoryManaged,
      },
      attributes: (product.attributes as Record<string, string>) || {},
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }
  } catch (error) {
    console.error("Failed to get product by ID:", error)
    throw error
  }
}

// Create a new product
export async function createProduct(productData: Omit<Product, "id" | "createdAt" | "updatedAt">) {
  try {
    const newProduct = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        compareAtPrice: productData.compareAtPrice,
        images: productData.images,
        category: productData.category,
        tags: productData.tags,
        sku: productData.sku,
        barcode: productData.barcode,
        inventoryQuantity: productData.inventory.quantity,
        lowStockThreshold: productData.inventory.lowStockThreshold,
        inventoryManaged: productData.inventory.managed,
        inventoryStatus: productData.inventory.status,
        attributes: productData.attributes || {},
      },
    })

    revalidatePath("/admin/products")

    // Transform database model to our application model
    return {
      success: true,
      product: {
        id: newProduct.id,
        name: newProduct.name,
        description: newProduct.description || "",
        price: newProduct.price,
        compareAtPrice: newProduct.compareAtPrice || undefined,
        images: newProduct.images,
        category: newProduct.category || "",
        tags: newProduct.tags,
        sku: newProduct.sku,
        barcode: newProduct.barcode || undefined,
        inventory: {
          quantity: newProduct.inventoryQuantity,
          lowStockThreshold: newProduct.lowStockThreshold,
          status: newProduct.inventoryStatus as ProductStatus,
          managed: newProduct.inventoryManaged,
        },
        attributes: (newProduct.attributes as Record<string, string>) || {},
        createdAt: newProduct.createdAt.toISOString(),
        updatedAt: newProduct.updatedAt.toISOString(),
      },
    }
  } catch (error) {
    console.error("Failed to create product:", error)
    return { success: false, error: "Failed to create product" }
  }
}

// Update a product
export async function updateProduct(id: string, productData: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>) {
  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        compareAtPrice: productData.compareAtPrice,
        images: productData.images,
        category: productData.category,
        tags: productData.tags,
        sku: productData.sku,
        barcode: productData.barcode,
        inventoryQuantity: productData.inventory?.quantity,
        lowStockThreshold: productData.inventory?.lowStockThreshold,
        inventoryManaged: productData.inventory?.managed,
        inventoryStatus: productData.inventory?.status,
        attributes: productData.attributes || {},
      },
    })

    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${id}`)

    // Transform database model to our application model
    return {
      success: true,
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description || "",
        price: updatedProduct.price,
        compareAtPrice: updatedProduct.compareAtPrice || undefined,
        images: updatedProduct.images,
        category: updatedProduct.category || "",
        tags: updatedProduct.tags,
        sku: updatedProduct.sku,
        barcode: updatedProduct.barcode || undefined,
        inventory: {
          quantity: updatedProduct.inventoryQuantity,
          lowStockThreshold: updatedProduct.lowStockThreshold,
          status: updatedProduct.inventoryStatus as ProductStatus,
          managed: updatedProduct.inventoryManaged,
        },
        attributes: (updatedProduct.attributes as Record<string, string>) || {},
        createdAt: updatedProduct.createdAt.toISOString(),
        updatedAt: updatedProduct.updatedAt.toISOString(),
      },
    }
  } catch (error) {
    console.error("Failed to update product:", error)
    return { success: false, error: "Failed to update product" }
  }
}

// Delete a product
export async function deleteProduct(id: string) {
  try {
    // First delete related inventory logs
    await prisma.inventoryLog.deleteMany({
      where: { productId: id },
    })

    // Then delete the product
    await prisma.product.delete({
      where: { id },
    })

    revalidatePath("/admin/products")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete product:", error)
    return { success: false, error: "Failed to delete product" }
  }
}

// Update inventory quantity
// export async function updateInventory(
//   productId: string,
//   newQuantity: number,
//   reason: InventoryUpdateLog["reason"],
//   orderId?: string,
//   userId?: string,
// ) {
//   try {
//     // Get current product
//     const product = await prisma.product.findUnique({
//       where: { id: productId },
//     })

//     if (!product) {
//       return { success: false, error: "Product not found" }
//     }

//     const previousQuantity = product.inventoryQuantity

//     // Determine new status
//     const newStatus = determineProductStatus(newQuantity, product.lowStockThreshold)

//     // Update product in a transaction along with creating a log
//     const [updatedProduct, log] = await prisma.$transaction([
//       // Update product
//       prisma.product.update({
//         where: { id: productId },
//         data: {
//           inventoryQuantity: newQuantity,
//           inventoryStatus: newStatus,
//           updatedAt: new Date(),
//         },
//       }),

//       // Create inventory log
//       prisma.inventoryLog.create({
//         data: {
//           productId,
//           previousQuantity,
//           newQuantity,
//           reason,
//           orderId,
//           userId,
//         },
//       }),
//     ])

//     revalidatePath("/admin/products")
//     revalidatePath(`/admin/products/${productId}`)
//     revalidatePath("/admin/inventory")

//     // Transform database models to our application models
//     return {
//       success: true,
//       product: {
//         id: updatedProduct.id,
//         name: updatedProduct.name,
//         description: updatedProduct.description || "",
//         price: updatedProduct.price,
//         compareAtPrice: updatedProduct.compareAtPrice || undefined,
//         images: updatedProduct.images,
//         category: updatedProduct.category || "",
//         tags: updatedProduct.tags,
//         sku: updatedProduct.sku,
//         barcode: updatedProduct.barcode || undefined,
//         inventory: {
//           quantity: updatedProduct.inventoryQuantity,
//           lowStockThreshold: updatedProduct.lowStockThreshold,
//           status: updatedProduct.inventoryStatus as ProductStatus,
//           managed: updatedProduct.inventoryManaged,
//         },
//         attributes: (updatedProduct.attributes as Record<string, string>) || {},
//         createdAt: updatedProduct.createdAt.toISOString(),
//         updatedAt: updatedProduct.updatedAt.toISOString(),
//       },
//       log: {
//         id: log.id,
//         productId: log.productId,
//         previousQuantity: log.previousQuantity,
//         newQuantity: log.newQuantity,
//         reason: log.reason as InventoryUpdateLog["reason"],
//         orderId: log.orderId || undefined,
//         userId: log.userId || undefined,
//         timestamp: log.timestamp.toISOString(),
//       },
//     }
//   } catch (error) {
//     console.error("Failed to update inventory:", error)
//     return { success: false, error: "Failed to update inventory" }
//   }
// }

// Get inventory logs
export async function getInventoryLogs(productId?: string) {
  try {
    const logs = await prisma.inventoryLog.findMany({
      where: productId ? { productId } : undefined,
      orderBy: {
        timestamp: "desc",
      },
    })

    // Transform database models to our application models
    return logs.map((log) => ({
      id: log.id,
      productId: log.productId,
      previousQuantity: log.previousQuantity,
      newQuantity: log.newQuantity,
      reason: log.reason as InventoryUpdateLog["reason"],
      orderId: log.orderId || undefined,
      userId: log.userId || undefined,
      timestamp: log.timestamp.toISOString(),
    }))
  } catch (error) {
    console.error("Failed to get inventory logs:", error)
    throw error
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

// Update inventory after order
export async function updateInventoryAfterOrder(
  orderId: string,
  userId: string,
  items: Array<{ id: string; quantity: number }>,
) {
  try {
    const results = await Promise.all(
      items.map(async (item) => {
        try {
          // Get current product
          const product = await prisma.product.findUnique({
            where: { id: item.id },
          })

          if (!product || !product.inventoryManaged) {
            return { productId: item.id, success: false, error: "Product not found or inventory not managed" }
          }

          const newQuantity = Math.max(0, product.inventoryQuantity - item.quantity)

          // Update inventory
          const result = await updateInventory(item.id, newQuantity, "order", orderId, userId)

          return { productId: item.id, success: result.success, error: result.error }
        } catch (error) {
          console.error(`Failed to update inventory for product ${item.id}:`, error)
          return { productId: item.id, success: false, error: "Failed to update inventory" }
        }
      }),
    )

    return { success: true, results }
  } catch (error) {
    console.error("Failed to update inventory after order:", error)
    return { success: false, error: "Failed to update inventory after order" }
  }
}

