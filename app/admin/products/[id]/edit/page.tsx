"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import ProductForm from "@/components/admin/product-form"
import { getProductById } from "@/app/actions/inventory"
import type { Product } from "@/types/inventory"
import ProtectedAdminRoute from "@/components/protected-admin-route"

export default function EditProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await getProductById(params.id)
        if (!data) {
          setError("Product not found")
        } else {
          setProduct(data)
        }
      } catch (err) {
        console.error("Error loading product:", err)
        setError("Failed to load product")
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [params.id])

  if (error) {
    return (
      <ProtectedAdminRoute>
        <div className="container mx-auto py-10 px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin/products" passHref>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Edit Product</h1>
          </div>

          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/products")}>
              Return to Products
            </Button>
          </div>
        </div>
      </ProtectedAdminRoute>
    )
  }

  return (
    <ProtectedAdminRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/products" passHref>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            {loading ? <Skeleton className="h-9 w-48" /> : `Edit ${product?.name}`}
          </h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <ProductForm initialData={product} />
        )}
      </div>
    </ProtectedAdminRoute>
  )
}

