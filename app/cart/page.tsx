"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Trash2, RefreshCw } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

type CartItem = {
  id: string
  productId: string
  name: string
  price: number
  image: string
  quantity: number
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch('/api/cart')
        const data = await response.json()
        
        // Fix 1: Ensure cartItems is always an array
        if (Array.isArray(data)) {
          setCartItems(data)
        } else if (data && typeof data === 'object') {
          // If data is an object with items property
          setCartItems(Array.isArray(data.items) ? data.items : [])
        } else {
          // Fallback to empty array
          setCartItems([])
          console.error('Unexpected cart data format:', data)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching cart:', error)
        setCartItems([]) // Ensure cartItems is an array even on error
        setLoading(false)
      }
    }

    fetchCart()
  }, [])

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      })

      if (response.ok) {
        setCartItems(cartItems.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
      } else {
        toast({
          title: "Error",
          description: "Failed to update quantity",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCartItems(cartItems.filter((item) => item.id !== itemId))
        toast({
          title: "Item removed",
          description: "Item has been removed from your cart",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to remove item",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing item:", error)
    }
  }

  const submitOrder = async () => {
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
      })

      if (response.ok) {
        setCartItems([])
        toast({
          title: "Order submitted",
          description: "Your order has been submitted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to submit order",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting order:", error)
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" />
        <p>Loading your cart...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Your Cart</h1>
      </div>

      {cartItems.length === 0 ? (
        <Card className="text-center p-8">
          <p className="mb-4">Your cart is empty</p>
          <Link href="/">
            <Button>Browse Products</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cart Items</CardTitle>
              </CardHeader>
              <CardContent>
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center py-4 border-b last:border-0">
                    <div className="relative h-20 w-20 mr-4">
                      <Image
                        src={item.image || `/placeholder.svg?height=80&width=80`}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-r-none"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                          className="h-8 w-12 text-center rounded-none"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-l-none"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-4 border-t">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={submitOrder}>
                  Submit Order
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

