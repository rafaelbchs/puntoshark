"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Copy, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import type { Order } from "@/app/actions/checkout"

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Try to get the order from sessionStorage
    try {
      const savedOrder = sessionStorage.getItem("lastOrder")
      console.log("Saved order from sessionStorage:", savedOrder)

      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder)
        setOrder(parsedOrder)
        setLoading(false)

        // Clear the sessionStorage after retrieving the order
        // to prevent showing old orders on page refresh
        sessionStorage.removeItem("lastOrder")
      } else {
        setError("Order details not found. Please contact support with your order ID.")
        setLoading(false)
      }
    } catch (err) {
      console.error("Error retrieving order from sessionStorage:", err)
      setError("Failed to load order details. Please contact support.")
      setLoading(false)
    }
  }, [])

  const copyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId)
      setCopied(true)
      toast({
        title: "Copied to clipboard",
        description: "Order ID has been copied to your clipboard",
        duration: 2000,
      })

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareOrder = async () => {
    if (orderId && navigator.share) {
      try {
        await navigator.share({
          title: "My Order",
          text: `My order ID is: ${orderId}. Please process my order.`,
        })
        toast({
          title: "Shared successfully",
          description: "Your order details have been shared",
          duration: 2000,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      copyOrderId()
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <p>Loading order information...</p>
      </div>
    )
  }

  // If we have an order ID but no order details, still show the confirmation
  // with the order ID, which is the most important part for the user to share
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-xl mb-6">Thank you for your purchase</p>

        {/* Success Alert */}
        <Alert className="bg-green-50 border-green-200 mb-8">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your order has been successfully created and is now being processed.
          </AlertDescription>
        </Alert>

        {/* Prominent Order ID Display with Admin Instructions */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle>Your Order ID</CardTitle>
            <CardDescription>Please share this ID with our admins for order tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl font-mono font-bold tracking-wider">{orderId}</span>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={copyOrderId} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy ID"}
              </Button>
              <Button variant="outline" size="sm" onClick={shareOrder} className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
          <CardFooter className="pt-0 text-sm text-muted-foreground">
            Contact our admin team at support@example.com with this order ID for any questions
          </CardFooter>
        </Card>
      </div>

      {order ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Placed on {new Date(order.createdAt).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Items</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p>{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p>${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Shipping Information</h3>
              <p>{order.customerInfo.name}</p>
              <p>{order.customerInfo.email}</p>
              <p className="whitespace-pre-line">{order.customerInfo.address}</p>
            </div>

            <div className="flex justify-between font-bold text-lg">
              <p>Total</p>
              <p>${order.total.toFixed(2)}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="w-full p-4 border border-dashed rounded-md text-center">
              <p className="text-sm text-muted-foreground mb-1">Order Status</p>
              <p className="font-medium capitalize">{order.status}</p>
            </div>
            <Link href="/" className="w-full">
              <Button className="w-full">Continue Shopping</Button>
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-8 text-center">
            {error && <p className="text-muted-foreground mb-4">{error}</p>}
            <p className="text-muted-foreground">
              Your order has been received. Please keep your order ID for reference.
            </p>
            <Link href="/" className="mt-4 inline-block">
              <Button>Continue Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

