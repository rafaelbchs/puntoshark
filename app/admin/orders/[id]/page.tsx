"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Copy } from "lucide-react"
import { getOrderById, updateOrderStatus } from "@/app/actions/checkout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import ProtectedAdminRoute from "@/components/protected-admin-route"
import type { Order } from "@/app/actions/checkout"

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const orderData = await getOrderById(orderId)
        setOrder(orderData || null)
      } catch (error) {
        console.error("Failed to fetch order:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  async function handleStatusChange(status: Order["status"]) {
    if (!order) return

    try {
      const result = await updateOrderStatus(order.id, status)
      if (result.success) {
        setOrder({ ...order, status })
        toast({
          title: "Status updated",
          description: `Order status changed to ${status}`,
          duration: 2000,
        })
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
    }
  }

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId)
    toast({
      title: "Copied to clipboard",
      description: "Order ID has been copied to your clipboard",
      duration: 2000,
    })
  }

  return (
    <ProtectedAdminRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/orders" passHref>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Order Details</h1>
        </div>

        {loading ? (
          <p className="text-center py-8">Loading order details...</p>
        ) : !order ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">Order Not Found</h2>
            <Button onClick={() => router.push("/admin/orders")}>Back to Orders</Button>
          </div>
        ) : (
          <>
            {/* Prominent Order ID Display */}
            <div className="bg-muted p-4 rounded-lg mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-mono font-bold tracking-wider">{order.id}</p>
                  <button
                    onClick={copyOrderId}
                    className="p-1 rounded-md hover:bg-background transition-colors"
                    aria-label="Copy order ID"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  order.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : order.status === "processing"
                      ? "bg-blue-100 text-blue-800"
                      : order.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                }
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Order Summary</CardTitle>
                        <CardDescription>Placed on {new Date(order.createdAt).toLocaleString()}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Items</h3>
                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                ${item.price.toFixed(2)} × {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between font-bold text-lg">
                      <p>Total</p>
                      <p>${order.total.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{order.customerInfo.name}</p>
                    <p>{order.customerInfo.email}</p>
                    <Separator className="my-2" />
                    <h3 className="font-medium">Shipping Address</h3>
                    <p className="whitespace-pre-line">{order.customerInfo.address}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Order Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(value as Order["status"])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full" onClick={() => window.print()}>
                      Print Order
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedAdminRoute>
  )
}

