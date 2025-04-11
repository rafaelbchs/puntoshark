import Link from "next/link"
import Image from "next/image"
import { getCategories, getProductsByCategory } from "@/app/actions/inventory"

export default async function GenderCollectionPage({
  params,
}: {
  params: { gender: string }
}) {
  const { gender } = params

  // Format gender for display
  const formattedGender = getGenderText(gender)

  // Special case for accessories
  const isAccessories = gender.toLowerCase() === "accessories"

  // Get all categories
  const categories = await getCategories()

  // Filter categories based on products that exist for this gender
  let filteredCategories = []

  if (isAccessories) {
    // For accessories page, we'll just show accessories
    // First check if we have an accessories category
    const accessoriesCategory = categories.find(
      (cat) => cat.name.toLowerCase() === "accessories" || cat.name.toLowerCase() === "accesorios",
    )

    if (accessoriesCategory) {
      filteredCategories = [accessoriesCategory]
    } else {
      // If no accessories category exists yet, create a placeholder
      filteredCategories = [
        {
          name: "Accesorios",
          subcategories: [],
        },
      ]
    }

    // Also check if we have any accessories products
    const accessoriesProducts = await getProductsByCategory("Accessories")
    if (accessoriesProducts.length === 0 && filteredCategories.length > 0) {
      filteredCategories[0].hasProducts = false
    } else if (accessoriesProducts.length > 0) {
      filteredCategories[0].hasProducts = true
    }
  } else {
    // For gender-specific pages, we'll show all categories that have products
    const categoryPromises = categories.map(async (category) => {
      // Get products for this category and gender, excluding discontinued products
      const products = await getProductsByCategory(category.name, gender)
      return {
        ...category,
        hasProducts: products.length > 0,
      }
    })

    const categoriesWithProductCheck = await Promise.all(categoryPromises)
    filteredCategories = categoriesWithProductCheck.filter((cat) => cat.hasProducts)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pt-24">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">
            {isAccessories ? "Accesorios" : `Colección para ${formattedGender}`}
          </h1>

          {filteredCategories.length === 0 ? (
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
              <h2 className="text-2xl font-semibold tracking-tight">No se encontraron categorías</h2>
              <p className="mt-2 text-muted-foreground max-w-md">
                No pudimos encontrar categorías para esta colección. Por favor, vuelve más tarde.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Volver al Inicio
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => {
                // Create URL-friendly category name
                const categorySlug = category.name.toLowerCase().replace(/\s+/g, "-")

                return (
                  <Link
                    key={category.name}
                    href={`/collections/${gender}/${categorySlug}`}
                    className="group overflow-hidden rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                      <Image
                        src="/placeholder.svg?height=600&width=800"
                        alt={category.name}
                        width={800}
                        height={600}
                        className="h-full w-full object-cover object-center transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-medium">{category.name}</h3>
                      <p className="mt-1 text-muted-foreground">
                        {category.subcategories.length > 0
                          ? `${category.subcategories.length} subcategorías`
                          : "Explora nuestra colección"}
                      </p>
                    </div>
                  </Link>
                )
              })}
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
    case "accessories":
      return "Accesorios"
    default:
      return gender.charAt(0).toUpperCase() + gender.slice(1)
  }
}
