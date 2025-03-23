import { ProductCard } from "@/components/product-card"
import { Navbar } from "@/components/navbar"
import { getProductsFromDatabase } from "@/lib/products"

export default async function Home() {
  const products = await getProductsFromDatabase()

  // Make sure we have a valid array
  const validProducts = Array.isArray(products) ? products : []

  return (
    <div>
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Featured Products</h1>

        {validProducts.length === 0 ? (
          <p>No products available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {validProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}