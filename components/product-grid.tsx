// If you're using a client-side product grid component, let's update it too

"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  inventory: number
  visible: boolean
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products")
        const data = await response.json()

        // Filter out any discontinued products that might have slipped through
        const activeProducts = data.products.filter((product: any) => product.inventory?.status !== "discontinued")

        setProducts(activeProducts)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching products:", error)
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const addToCart = async (productId: string) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      })

      if (response.ok) {
        toast({
          title: "Added to cart",
          description: "Product has been added to your cart",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to add product to cart",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-10">Loading products...</div>
  }

  if (products.length === 0) {
    return <div className="text-center py-10">No products available.</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <div className="relative aspect-square">
            <Image
              src={product.image || `/placeholder.svg?height=300&width=300`}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">{product.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
            <p className="font-bold">${product.price.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">
              {product.inventory > 0 ? `${product.inventory} in stock` : "Out of stock"}
            </p>
          </CardContent>
          <CardFooter className="p-4">
            <Button className="w-full" onClick={() => addToCart(product.id)} disabled={product.inventory === 0}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

