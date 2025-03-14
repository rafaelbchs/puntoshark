"use client"

import Image from "next/image"
import { useCart } from "@/context/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

type ProductCardProps = {
  id: string
  name: string
  price: number
  image?: string
}

export function ProductCard({ id, name, price, image = "/placeholder.svg?height=200&width=200" }: ProductCardProps) {
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem({ id, name, price, image })
    toast({
      title: "Added to cart",
      description: `${name} has been added to your cart`,
      duration: 3000, // Will auto-dismiss after 3 seconds
    })
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full">
        <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />
      </div>
      <CardContent className="p-4">
        <CardTitle className="line-clamp-1">{name}</CardTitle>
        <p className="text-lg font-bold mt-2">${price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={handleAddToCart} className="w-full">
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  )
}

