"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"

export function AddToCartButton({ product }) {
  const { addItem } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    setIsAdding(true)

    try {
      await addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || "/placeholder.svg",
        quantity: 1,
      })

      // Optional: Show success message
    } catch (error) {
      console.error("Failed to add item to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={product.inventory?.status === "out_of_stock" || isAdding}
      onClick={handleAddToCart}
    >
      {product.inventory?.status === "out_of_stock" ? "Out of Stock" : isAdding ? "Adding..." : "Add to Cart"}
    </Button>
  )
}

