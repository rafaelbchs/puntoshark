import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import ProductGrid from "@/components/product-grid"

export default async function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Shop Products</h1>
        <Link href="/cart">
          <Button variant="outline" className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            View Cart
          </Button>
        </Link>
      </div>

      <ProductGrid />
    </div>
  )
}

