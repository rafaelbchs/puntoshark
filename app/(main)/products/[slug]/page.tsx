import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { getProductById } from "@/app/actions/inventory"
import { getProductDetailImageUrl } from "@/lib/image-utils"
import { ProductVariantSelector } from "@/components/product-variant-selector"

export default async function ProductPage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params

  // Fetch the product by ID
  const product = await getProductById(slug).catch(() => null)

  // If product not found, show a not found page
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 pt-24">
          <div className="container mx-auto px-4 py-8">
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Product Not Found</h2>
              <p className="mt-2 text-muted-foreground max-w-md">
                We couldn't find the product you're looking for. It may have been removed or doesn't exist yet.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Format gender for breadcrumb
  const formattedGender = product.gender ? product.gender.charAt(0).toUpperCase() + product.gender.slice(1) : "Products"

  return (
    <div className="min-h-screen flex flex-col">
      <div className="pt-24 pb-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
            {product.gender && (
              <>
                <Link href={`/collections/${product.gender}`} className="text-muted-foreground hover:text-foreground">
                  {formattedGender}
                </Link>
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
              </>
            )}
            {product.category && (
              <>
                <Link
                  href={`/collections/${product.gender}/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {product.category}
                </Link>
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
              </>
            )}
            <span className="font-medium text-foreground">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={
                  product.images?.[0]
                    ? getProductDetailImageUrl(product.images[0])
                    : "/placeholder.svg?height=800&width=800"
                }
                alt={product.name}
                width={800}
                height={800}
                className="h-full w-full object-cover object-center"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1).map((image, index) => (
                  <div key={index} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={getProductDetailImageUrl(image) || "/placeholder.svg"}
                      alt={`${product.name} - Image ${index + 2}`}
                      width={200}
                      height={200}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <div className="mt-2 flex items-center">
                <p className="text-2xl font-semibold">${product.price.toFixed(2)}</p>
                {product.compareAtPrice && (
                  <p className="ml-3 text-lg text-gray-500 line-through">${product.compareAtPrice.toFixed(2)}</p>
                )}
              </div>
            </div>

            <div className="border-t border-b py-4">
              <div className="prose max-w-none">
                <p>{product.description}</p>
              </div>
            </div>

            {/* Variant Selector */}
            {product.hasVariants && product.variantAttributes && product.variantAttributes.length > 0 && (
              <ProductVariantSelector product={product} />
            )}

            {/* Inventory Status */}
            <div>
              {product.inventory.status === "in_stock" && (
                <p className="text-sm text-green-600 font-medium">In Stock</p>
              )}
              {product.inventory.status === "low_stock" && (
                <p className="text-sm text-amber-600 font-medium">Low Stock</p>
              )}
              {product.inventory.status === "out_of_stock" && (
                <p className="text-sm text-red-600 font-medium">Out of Stock</p>
              )}
              {product.inventory.status === "discontinued" && (
                <p className="text-sm text-gray-600 font-medium">Discontinued</p>
              )}
            </div>

            {/* Product Metadata */}
            <div className="pt-6 space-y-2 text-sm">
              <p>
                <span className="font-medium">SKU:</span> {product.sku}
              </p>
              {product.category && (
                <p>
                  <span className="font-medium">Category:</span> {product.category}
                </p>
              )}
              {product.subcategory && (
                <p>
                  <span className="font-medium">Subcategory:</span> {product.subcategory}
                </p>
              )}
              {product.tags && product.tags.length > 0 && (
                <p>
                  <span className="font-medium">Tags:</span> {product.tags.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

