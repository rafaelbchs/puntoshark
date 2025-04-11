import Link from "next/link"
import Image from "next/image"
import { getProductsByCategory } from "@/app/actions/inventory"
import { formatCurrency } from "@/lib/utils"
import { getProductCardImageUrl } from "@/lib/image-utils"

export default async function CategoryPage({
  params,
}: {
  params: { gender: string; category: string }
}) {
  const { gender, category } = params

  // Normalize the category from URL format (e.g., "t-shirts" to "T-Shirts")
  const normalizedCategory = category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  // For accessories, we need to handle them differently since they don't have a gender
  const isAccessories = normalizedCategory.toLowerCase() === "accessories" || gender.toLowerCase() === "accessories"

  // Fetch products by category
  const products = await getProductsByCategory(
    isAccessories ? "accessories" : normalizedCategory,
    isAccessories ? undefined : gender,
  )

  // Format gender for display
  const formattedGender = gender.charAt(0).toUpperCase() + gender.slice(1)

  // Determine the page title
  const pageTitle = isAccessories ? "Accesorios" : `${getGenderText(formattedGender)} ${normalizedCategory}`

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pt-24">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">{pageTitle}</h1>

          {products.length === 0 ? (
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
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">No se encontraron productos</h2>
              <p className="mt-2 text-muted-foreground max-w-md">
                No pudimos encontrar productos en esta categoría. Por favor, vuelve más tarde o explora otras
                categorías.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Volver al Inicio
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group overflow-hidden rounded-lg border hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <Image
                      src={
                        product.images?.[0]
                          ? getProductCardImageUrl(product.images[0])
                          : "/placeholder.svg?height=400&width=400"
                      }
                      alt={product.name}
                      width={400}
                      height={400}
                      className="h-full w-full object-cover object-center transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium">{product.name}</h3>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm font-medium">{formatCurrency(product.price)}</p>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <p className="text-sm text-muted-foreground line-through">
                          {formatCurrency(product.compareAtPrice)}
                        </p>
                      )}
                    </div>
                    {product.hasVariants && (
                      <p className="mt-1 text-xs text-muted-foreground">Múltiples opciones disponibles</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function to translate gender
function getGenderText(gender: string): string {
  switch (gender.toLowerCase()) {
    case "men":
      return "Hombres"
    case "women":
      return "Mujeres"
    case "unisex":
      return "Unisex"
    default:
      return gender
  }
}
