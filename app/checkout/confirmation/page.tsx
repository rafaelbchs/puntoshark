"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Copy, Share2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import type { Order } from "@/app/actions/checkout"

// Add this function at the top level of the component
async function fetchOrderById(orderId: string) {
  try {
    console.log("Fetching order by ID:", orderId)
    const response = await fetch(`/api/orders?id=${orderId}`)
    const data = await response.json()

    if (data.order) {
      console.log("Order fetched successfully:", data.order)
      console.log("Customer info in API response:", data.order.customerInfo)
      return data.order
    } else {
      console.error("No order found with ID:", orderId)
      return null
    }
  } catch (error) {
    console.error("Error fetching order:", error)
    return null
  }
}

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mejora la experiencia de carga inicial añadiendo un efecto de transición suave
  useEffect(() => {
    // Try to get the order from sessionStorage
    async function getOrderData() {
      try {
        console.log("Checking for order in sessionStorage...")
        const savedOrder = sessionStorage.getItem("lastOrder")
        console.log("Saved order from sessionStorage:", savedOrder)

        if (savedOrder) {
          const parsedOrder = JSON.parse(savedOrder)
          console.log("Parsed order data:", parsedOrder)
          console.log("Customer info:", parsedOrder.customerInfo)
          console.log("Delivery method:", parsedOrder.customerInfo.deliveryMethod)
          console.log("Payment method:", parsedOrder.customerInfo.paymentMethod)

          // Pequeño retraso para permitir que la página se renderice primero
          // y evitar el parpadeo de la pantalla de carga
          setTimeout(() => {
            setOrder(parsedOrder)
            setLoading(false)
          }, 300)

          // Clear the sessionStorage after retrieving the order
          sessionStorage.removeItem("lastOrder")
          console.log("Order retrieved and sessionStorage cleared")
        } else {
          console.log("No order found in sessionStorage, checking for orderId in URL...")
          const orderIdFromUrl = searchParams.get("orderId")
          console.log("Order ID from URL:", orderIdFromUrl)

          if (orderIdFromUrl) {
            // If we have an orderId but no order data, try to fetch the order
            const fetchedOrder = await fetchOrderById(orderIdFromUrl)
            console.log("Fetched order data:", fetchedOrder)

            if (fetchedOrder) {
              console.log("Customer info from API:", fetchedOrder.customerInfo)
              console.log("Delivery method from API:", fetchedOrder.customerInfo.deliveryMethod)
              console.log("Payment method from API:", fetchedOrder.customerInfo.paymentMethod)

              // Pequeño retraso para permitir que la página se renderice primero
              setTimeout(() => {
                setOrder(fetchedOrder)
                setLoading(false)
              }, 300)
            } else {
              setError("Detalles del pedido no encontrados. Por favor contacta a soporte con tu ID de pedido.")
              setLoading(false)
            }
          } else {
            console.log("No order ID found in URL")
            setError("No se encontró información del pedido.")
            setLoading(false)
          }
        }
      } catch (err) {
        console.error("Error retrieving order from sessionStorage:", err)
        setError("Error al cargar los detalles del pedido. Por favor contacta a soporte.")
        setLoading(false)
      }
    }

    getOrderData()
  }, [searchParams])

  const copyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId)
      setCopied(true)
      toast({
        title: "Copiado al portapapeles",
        description: "El ID del pedido ha sido copiado al portapapeles",
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
          title: "Mi Pedido",
          text: `Mi ID de pedido es: ${orderId}. Por favor procesa mi pedido.`,
        })
        toast({
          title: "Compartido exitosamente",
          description: "Los detalles de tu pedido han sido compartidos",
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
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Finalizando tu pedido...</p>
          <p className="text-sm text-muted-foreground">Estamos preparando tu confirmación</p>
        </div>
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
        <h1 className="text-3xl font-bold mb-2">¡Pedido Confirmado!</h1>
        <p className="text-xl mb-6">Gracias por tu compra</p>

        {/* Success Alert */}
        <Alert className="bg-green-50 border-green-200 mb-8">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-800">¡Éxito!</AlertTitle>
          <AlertDescription className="text-green-700">
            Tu pedido ha sido creado exitosamente y está siendo procesado.
          </AlertDescription>
        </Alert>

        {/* Prominent Order ID Display with Admin Instructions */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle>Tu ID de Pedido</CardTitle>
            <CardDescription>
              Por favor comparte este ID con nuestros administradores para seguimiento del pedido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl font-mono font-bold tracking-wider">{orderId}</span>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={copyOrderId} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                {copied ? "¡Copiado!" : "Copiar ID"}
              </Button>
              <Button variant="outline" size="sm" onClick={shareOrder} className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Compartir
              </Button>
            </div>
          </CardContent>
          <CardFooter className="pt-0 text-sm text-muted-foreground">
            Contacta a nuestro equipo de administración en support@example.com con este ID de pedido para cualquier
            consulta
          </CardFooter>
        </Card>
      </div>

      {order ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Detalles del Pedido</CardTitle>
            <CardDescription>Realizado el {new Date(order.createdAt).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Artículos</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p>{item.name}</p>
                      <p className="text-sm text-muted-foreground">Cant: {item.quantity}</p>
                    </div>
                    <p>${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Información del Cliente</h3>
              <p>{order.customerInfo.name}</p>
              <p>Cédula: {order.customerInfo.cedula}</p>
              <p>Teléfono: {order.customerInfo.phone}</p>
              <p>{order.customerInfo.email}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Información de Entrega</h3>
              <p>Método: {getDeliveryMethodText(order.customerInfo.deliveryMethod)}</p>
              {order.customerInfo.deliveryMethod === "mrw" && <p>Oficina MRW: {order.customerInfo.mrwOffice}</p>}
              {order.customerInfo.deliveryMethod === "delivery" && (
                <p className="whitespace-pre-line">Dirección: {order.customerInfo.address}</p>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">Método de Pago</h3>
              <p>{getPaymentMethodText(order.customerInfo.paymentMethod)}</p>
            </div>

            <div className="flex justify-between font-bold text-lg">
              <p>Total</p>
              <p>${order.total.toFixed(2)}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="w-full p-4 border border-dashed rounded-md text-center">
              <p className="text-sm text-muted-foreground mb-1">Estado del Pedido</p>
              <p className="font-medium capitalize">{getStatusText(order.status)}</p>
            </div>
            <Link href="/" className="w-full">
              <Button className="w-full">Continuar Comprando</Button>
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-8 text-center">
            {error && <p className="text-muted-foreground mb-4">{error}</p>}
            <p className="text-muted-foreground">
              Tu pedido ha sido recibido. Por favor guarda tu ID de pedido como referencia.
            </p>
            <Link href="/" className="mt-4 inline-block">
              <Button>Continuar Comprando</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper functions to translate values to Spanish
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

