"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getProductById } from "@/app/actions/inventory"
import { Button } from "@/components/ui/button"
import ProductForm from "@/components/admin/product-form"
import ProtectedAdminRoute from "@/components/protected-admin-route"
import { toast } from "@/hooks/use-toast"
import type { Product } from "@/types/inventory"

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const productData = await getProductById(productId)
        if (productData) {
          setProduct(productData)
        } else {
          toast({
            title: "Error",
            description: "Product not found",
            variant: "destructive",
          })
          router.push("/admin/products")
        }
      } catch (error) {
        console.error("Failed to fetch product:", error)
        toast({
          title: "Error",
          description: "Failed to load product",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId, router])

  if (loading) {
    return (
      <ProtectedAdminRoute>
        <div className="container mx-auto py-10 px-4">
          <p className="text-center">Loading product...</p>
        </div>
      </ProtectedAdminRoute>
    )
  }

  if (!product) {
    return (
      <ProtectedAdminRoute>
        <div className="container mx-auto py-10 px-4">
          <p className="text-center">Product not found</p>
          <div className="flex justify-center mt-4">
            <Button onClick={() => router.push("/admin/products")}>Back to Products</Button>
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
          <h1 className="text-3xl font-bold">Edit Product</h1>
        </div>

        <ProductForm product={product} isEditing={true} />
      </div>
    </ProtectedAdminRoute>
  )
}

