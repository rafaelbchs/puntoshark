import { ProductCard } from "@/components/product-card"
import { Navbar } from "@/components/navbar"
import { getProductsFromDatabase } from "@/lib/products"
import { Suspense } from "react"

// This component will fetch products with caching
async function ProductGrid() {
  const products = await getProductsFromDatabase()

  // Log to confirm we're filtering out discontinued products
  console.log("Products fetched for homepage:", products.length, "(discontinued products filtered out)")

  // Make sure we have a valid array
  const validProducts = Array.isArray(products) ? products : []

  if (validProducts.length === 0) {
    return <p>No products available</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {validProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

// Loading fallback component
function ProductsLoading() {
  return <div className="animate-pulse">Loading products...</div>
}

export default async function Home() {
  return (
    <div>
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Featured Products</h1>

        <Suspense fallback={<ProductsLoading />}>
          <ProductGrid />
        </Suspense>
      </main>
    </div>
  )
}

// Generate static params with revalidation
export const revalidate = 3600 // Revalidate at most once per hour

