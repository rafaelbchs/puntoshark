"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { toast } from "@/hooks/use-toast"
import type { Product } from "@/types/inventory"

interface AddToCartButtonProps {
  product: Product
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { addItem } = useCart()

  const handleAddToCart = () => {
    setIsAddingToCart(true)

    try {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || "",
      })

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={product.inventory.status === "out_of_stock" || isAddingToCart}
      onClick={handleAddToCart}
    >
      {isAddingToCart ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
        </>
      ) : product.inventory.status === "out_of_stock" ? (
        "Out of Stock"
      ) : (
        "Add to Cart"
      )}
    </Button>
  )
}

