"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProductForm from "@/components/admin/product-form"
import ProtectedAdminRoute from "@/components/protected-admin-route"

export default function NewProductPage() {
  return (
    <ProtectedAdminRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/products" passHref>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Add New Product</h1>
        </div>

        <ProductForm />
      </div>
    </ProtectedAdminRoute>
  )
}

