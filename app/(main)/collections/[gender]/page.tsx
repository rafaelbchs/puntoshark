import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getProducts, getCategories } from "@/app/actions/inventory"
import ProductGrid from "@/components/product-grid"

// This is a placeholder component for when you don't have products yet
function EmptyState({ gender }: { gender: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10 text-muted-foreground"
        >
          <path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
          <path d="M16 19h6" />
          <path d="M19 16v6" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">No products yet</h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        We're working on adding {gender === "men" ? "men's" : gender === "women" ? "women's" : ""} products to our
        collection. Check back soon!
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Return to Home
      </Link>
    </div>
  )
}

export default async function GenderPage({
  params,
}: {
  params: { gender: string }
}) {
  const { gender } = params

  // Validate the gender
  const validGenders = ["men", "women", "accessories", "unisex", "kids"]
  if (!validGenders.includes(gender)) {
    return notFound()
  }

  // Format the gender for display
  const formattedGender = gender.charAt(0).toUpperCase() + gender.slice(1)

  // Fetch products for this gender
  const products = await getProducts()

  // Fetch categories to display subcategory links
  const categories = await getCategories()

  // Filter products by gender
  const filteredProducts = products.filter((product) => {
    // For gender matching:
    // 1. If product.gender is null, show in all genders except accessories
    // 2. If gender is "accessories", match products with null gender or "accessories" gender
    // 3. Otherwise, match the gender exactly (case insensitive)
    if (gender === "accessories") {
      return !product.gender || product.gender.toLowerCase() === "accessories"
    } else if (!product.gender) {
      return true
    } else {
      return product.gender.toLowerCase() === gender.toLowerCase()
    }
  })

  // Get unique categories from the filtered products
  const uniqueCategories = [...new Set(filteredProducts.map((product) => product.category))].filter(Boolean)

  return (
    <div className="min-h-screen flex flex-col">
      <div className="pt-24 pb-6 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex items-center text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
            <span className="font-medium text-foreground">{formattedGender}</span>
          </div>

          <h1 className="text-3xl font-bold mt-4">{formattedGender}'s Collection</h1>

          {/* Category links */}
          {uniqueCategories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {uniqueCategories.map((category) => {
                // Convert category to kebab-case for URL
                const categorySlug = category?.toLowerCase().replace(/\s+/g, "-")
                return (
                  <Link
                    key={category}
                    href={`/collections/${gender}/${categorySlug}`}
                    className="px-3 py-1 bg-background rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {category}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8">
        {filteredProducts.length > 0 ? <ProductGrid products={filteredProducts} /> : <EmptyState gender={gender} />}
      </div>
    </div>
  )
}

