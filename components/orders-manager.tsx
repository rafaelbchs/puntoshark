"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Eye, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Order = {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  status: "pending" | "processing" | "completed" | "cancelled"
  total: number
  items: OrderItem[]
  createdAt: string
}

type OrderItem = {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
}

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders")
      const data = await response.json()
      setOrders(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching orders:", error)
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: "processing" | "completed" | "cancelled") => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: "Order updated",
          description: `Order status changed to ${status}`,
        })
        fetchOrders()
      } else {
        toast({
          title: "Error",
          description: "Failed to update order status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" />
        <p>Loading orders...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Customer Orders</h2>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setSelectedOrder(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Order Details</DialogTitle>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">Order Information</h3>
                                    <p>Order ID: {selectedOrder.id}</p>
                                    <p>Date: {formatDate(selectedOrder.createdAt)}</p>
                                    <p>Status: {selectedOrder.status}</p>
                                    <p>Total: ${selectedOrder.total.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">Customer Information</h3>
                                    <p>Name: {selectedOrder.customerName}</p>
                                    <p>Email: {selectedOrder.customerEmail}</p>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">Order Items</h3>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedOrder.items.map((item) => (
                                        <TableRow key={item.id}>
                                          <TableCell>{item.name}</TableCell>
                                          <TableCell>${item.price.toFixed(2)}</TableCell>
                                          <TableCell>{item.quantity}</TableCell>
                                          <TableCell className="text-right">
                                            ${(item.price * item.quantity).toFixed(2)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>

                                <div className="flex justify-between items-center">
                                  <h3 className="font-semibold">Update Status</h3>
                                  <div className="flex gap-2">
                                    {selectedOrder.status !== "processing" && (
                                      <Button
                                        variant="outline"
                                        onClick={() => updateOrderStatus(selectedOrder.id, "processing")}
                                      >
                                        Mark as Processing
                                      </Button>
                                    )}
                                    {selectedOrder.status !== "completed" && (
                                      <Button
                                        variant="outline"
                                        className="text-green-600"
                                        onClick={() => updateOrderStatus(selectedOrder.id, "completed")}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Complete
                                      </Button>
                                    )}
                                    {selectedOrder.status !== "cancelled" && (
                                      <Button
                                        variant="outline"
                                        className="text-red-600"
                                        onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancel
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button" variant="outline">
                                  Close
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

