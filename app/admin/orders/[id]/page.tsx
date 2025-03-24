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
          title: "Estado actualizado",
          description: `Estado del pedido cambiado a ${getStatusText(status)}`,
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
      title: "Copiado al portapapeles",
      description: "ID del pedido copiado al portapapeles",
      duration: 2000,
    })
  }

  // Helper function to translate status to Spanish
  function getStatusText(status: string): string {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "processing":
        return "Procesando"
      case "completed":
        return "Completado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  // Helper function to translate delivery method to Spanish
  function getDeliveryMethodText(method?: string): string {
    switch (method) {
      case "mrw":
        return "Envío Nacional (MRW)"
      case "delivery":
        return "Delivery (Maracaibo)"
      case "pickup":
        return "Pick-Up"
      default:
        return method || "No especificado"
    }
  }

  // Helper function to translate payment method to Spanish
  function getPaymentMethodText(method?: string): string {
    switch (method) {
      case "pagoMovil":
        return "Pago Móvil"
      case "zelle":
        return "Zelle"
      case "binance":
        return "Binance"
      case "efectivo":
        return "Efectivo"
      default:
        return method || "No especificado"
    }
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
          <h1 className="text-3xl font-bold">Detalles del Pedido</h1>
        </div>

        {loading ? (
          <p className="text-center py-8">Cargando detalles del pedido...</p>
        ) : !order ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">Pedido No Encontrado</h2>
            <Button onClick={() => router.push("/admin/orders")}>Volver a Pedidos</Button>
          </div>
        ) : (
          <>
            {/* Prominent Order ID Display */}
            <div className="bg-muted p-4 rounded-lg mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ID del Pedido</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-mono font-bold tracking-wider">{order.id}</p>
                  <button
                    onClick={copyOrderId}
                    className="p-1 rounded-md hover:bg-background transition-colors"
                    aria-label="Copiar ID del pedido"
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
                {getStatusText(order.status)}
              </Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Resumen del Pedido</CardTitle>
                        <CardDescription>Realizado el {new Date(order.createdAt).toLocaleString()}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Artículos</h3>
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
                    <CardTitle>Información del Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{order.customerInfo.name}</p>
                    <p>Cédula: {order.customerInfo.cedula || "N/A"}</p>
                    <p>Teléfono: {order.customerInfo.phone || "N/A"}</p>
                    <p>{order.customerInfo.email}</p>
                    <Separator className="my-2" />
                    <h3 className="font-medium">Método de Entrega</h3>
                    <p>{getDeliveryMethodText(order.customerInfo.deliveryMethod)}</p>
                    {order.customerInfo.deliveryMethod === "mrw" && <p>Oficina MRW: {order.customerInfo.mrwOffice}</p>}
                    {order.customerInfo.deliveryMethod === "delivery" && (
                      <>
                        <h3 className="font-medium">Dirección de Entrega</h3>
                        <p className="whitespace-pre-line">{order.customerInfo.address}</p>
                      </>
                    )}
                    <Separator className="my-2" />
                    <h3 className="font-medium">Método de Pago</h3>
                    <p>{getPaymentMethodText(order.customerInfo.paymentMethod)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estado del Pedido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(value as Order["status"])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="processing">Procesando</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full" onClick={() => window.print()}>
                      Imprimir Pedido
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

