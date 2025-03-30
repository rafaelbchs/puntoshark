"use client"

import { ShoppingCart, Trash } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/context/cart-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function CartDropdown() {
  const { items, removeItem, totalItems, subtotal } = useCart()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Shopping Cart</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">Your cart is empty</div>
          ) : (
            <DropdownMenuGroup>
              {items.map((item) => (
                <DropdownMenuItem key={item.id} className="flex items-center gap-4 py-4 cursor-default">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                    <Image
                      src={item.image || "/placeholder.svg?height=64&width=64"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault()
                      removeItem(item.id)
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
        </div>
        {items.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-4">
              <div className="flex justify-between text-sm mb-4">
                <span>Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <Link href="/cart" passHref>
                <Button className="w-full">View Cart</Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

