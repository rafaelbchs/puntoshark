import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getProductById } from "@/app/actions/inventory"
import ProductForm from "@/components/admin/product-form"
import { Skeleton } from "@/components/ui/skeleton"

interface ProductEditPageProps {
  params: {
    id: string
  }
}

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const product = await getProductById(params.id)

  if (!product) {
    notFound()
  }

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Product</h1>

      <Suspense fallback={<ProductFormSkeleton />}>
        <ProductForm initialData={product} isEdit={true} />
      </Suspense>
    </div>
  )
}

function ProductFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

