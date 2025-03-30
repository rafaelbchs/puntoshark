"use client"

import Image from "next/image"
import { useCart } from "@/context/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { getProductCardImageUrl } from "@/lib/image-utils"

type ProductCardProps = {
  product: {
    id: string
    name: string
    price: number
    image?: string
    images?: string[]
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { id, name, price } = product
  // Use the first image from the images array, or the image prop, or a placeholder
  const imageUrl = product.images?.length ? product.images[0] : product.image || "/placeholder.svg?height=200&width=200"

  // Get optimized image URL
  const optimizedImageUrl = getProductCardImageUrl(imageUrl)

  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem({
      id,
      name,
      price,
      image: imageUrl,
    })
    toast({
      title: "Added to cart",
      description: `${name} has been added to your cart`,
      duration: 3000,
    })
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={optimizedImageUrl || "/placeholder.svg"}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
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

