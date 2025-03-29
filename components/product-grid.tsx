import Link from "next/link"
import Image from "next/image"
import { getProductCardImageUrl } from "@/lib/image-utils"
import type { Product } from "@/types/inventory"

interface ProductGridProps {
  products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <div key={product.id} className="group relative">
          <Link href={`/products/${product.id}`} className="block">
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={
                  product.images?.[0]
                    ? getProductCardImageUrl(product.images[0])
                    : "/placeholder.svg?height=400&width=400"
                }
                alt={product.name}
                width={400}
                height={400}
                className="h-full w-full object-cover object-center transition-opacity group-hover:opacity-75"
              />
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
              <div className="mt-1 flex justify-between items-center">
                <p className="text-sm font-medium text-gray-900">${product.price.toFixed(2)}</p>
                {product.compareAtPrice && (
                  <p className="text-sm text-gray-500 line-through">${product.compareAtPrice.toFixed(2)}</p>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 capitalize">{product.category}</p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}

