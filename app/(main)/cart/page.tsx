"use client"

import { Minus, Plus, ShoppingBag, Trash } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/context/cart-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, totalItems } = useCart()

  if (items.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold mb-8">Tu Carrito</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 rounded-full bg-muted p-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-6">Parece que aún no has añadido nada a tu carrito.</p>
          <Link href="/" passHref>
            <Button>Continuar Comprando</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 md:py-16">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">
        Tu Carrito ({totalItems} {totalItems === 1 ? "artículo" : "artículos"})
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Mobile and tablet view - Card layout */}
          <div className="lg:hidden space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                      <Image
                        src={item.image || "/placeholder.svg?height=80&width=80"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <h3 className="font-medium line-clamp-2">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">${item.price.toFixed(2)}</p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-none"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                            className="h-8 w-10 rounded-none text-center border-x [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-l-none"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop view - Table-like layout */}
          <div className="hidden lg:block border rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 bg-muted p-4 text-sm font-medium">
              <div className="col-span-6">Producto</div>
              <div className="col-span-2 text-center">Cantidad</div>
              <div className="col-span-3 text-right">Precio</div>
              <div className="col-span-1"></div>
            </div>

            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 p-4 items-center">
                  <div className="col-span-6 flex items-center gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                      <Image
                        src={item.image || "/placeholder.svg?height=64&width=64"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-r-none"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                        className="h-8 w-14 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-l-none"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="col-span-3 text-right font-medium">${(item.price * item.quantity).toFixed(2)}</div>

                  <div className="col-span-1 text-right">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="sticky top-4">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-4">Resumen del Pedido</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span>Calculado al finalizar la compra</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  <Link href="/checkout" passHref>
                    <Button className="w-full mt-2">Proceder al Pago</Button>
                  </Link>

                  <div className="text-center mt-4">
                    <Link href="/" className="text-sm text-primary hover:underline">
                      Continuar Comprando
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
