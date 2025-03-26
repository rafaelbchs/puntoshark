"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Copy, Plus, Minus, Trash, Save, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import ProtectedAdminRoute from "@/components/protected-admin-route"
import { getProducts } from "@/app/actions/inventory"
import { getOrderById, updateOrderStatus } from "@/app/actions/checkout"
import type { Order, OrderItem } from "@/types/checkout"
import type { Product } from "@/types/inventory"

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedOrder, setEditedOrder] = useState<Order | null>(null)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<Order["status"] | null>(null)
  const [inventoryImpact, setInventoryImpact] = useState<{
    type: "increase" | "decrease" | "none"
    message: string
  }>({ type: "none", message: "" })
  const [isStatusChanging, setIsStatusChanging] = useState(false)

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true)
        setError(null)

        // Use the direct function call instead of destructuring the result
        const orderData = await getOrderById(orderId)

        if (orderData) {
          setOrder(orderData)
          setEditedOrder(orderData)
        } else {
          setError("No se encontró el pedido")
        }
      } catch (error) {
        console.error("Failed to fetch order:", error)
        setError(error instanceof Error ? error.message : "Error al cargar el pedido")
      } finally {
        setLoading(false)
      }
    }

    async function fetchProducts() {
      try {
        const productsData = await getProducts(true) // Include discontinued products
        setAvailableProducts(productsData || [])
      } catch (error) {
        console.error("Failed to fetch products:", error)
      }
    }

    fetchOrder()
    fetchProducts()
  }, [orderId])

  // Calculate inventory impact when changing order status
  const calculateInventoryImpact = (currentStatus: string, newStatus: string) => {
    // No inventory impact if order is not managed by inventory
    if (!order?.inventoryUpdated && !["processing", "completed"].includes(newStatus)) {
      return { type: "none", message: "No inventory changes will occur." }
    }

    // Inventory decrease scenarios
    if (
      (currentStatus === "pending" && (newStatus === "processing" || newStatus === "completed")) ||
      (currentStatus === "processing" && newStatus === "completed")
    ) {
      return {
        type: "decrease",
        message: "This will decrease inventory levels for the ordered products.",
      }
    }

    // Inventory increase scenarios (cancellations or returns)
    if (
      ((currentStatus === "processing" || currentStatus === "completed") && newStatus === "cancelled") ||
      (currentStatus === "completed" && newStatus === "processing")
    ) {
      return {
        type: "increase",
        message: "This will increase inventory levels by returning items to stock.",
      }
    }

    return { type: "none", message: "No inventory changes will occur." }
  }

  async function handleStatusChange(status: Order["status"]) {
    if (!order || isStatusChanging) return

    // Calculate inventory impact
    const impact = calculateInventoryImpact(order.status, status)
    setInventoryImpact(impact)
    setPendingStatus(status)

    // Show confirmation dialog if there's inventory impact
    if (impact.type !== "none") {
      setShowStatusConfirmation(true)
    } else {
      // No inventory impact, proceed directly
      confirmStatusChange(status)
    }
  }

  async function confirmStatusChange(status: Order["status"]) {
    if (!order) return

    setIsStatusChanging(true)
    try {
      const { success, error } = await updateOrderStatus(order.id, status)

      if (success) {
        setOrder({ ...order, status })
        toast({
          title: "Estado actualizado",
          description: `Estado del pedido cambiado a ${getStatusText(status)}`,
          duration: 2000,
        })
      } else {
        toast({
          title: "Error",
          description: error || "No se pudo actualizar el estado del pedido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      })
    } finally {
      setIsStatusChanging(false)
      setShowStatusConfirmation(false)
      setPendingStatus(null)
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

  // Edit mode functions
  const toggleEditMode = () => {
    if (editMode) {
      // Discard changes
      setEditedOrder(order)
    }
    setEditMode(!editMode)
  }

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (!editedOrder) return

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      setEditedOrder({
        ...editedOrder,
        items: editedOrder.items.filter((item) => item.id !== itemId),
        total: editedOrder.items
          .filter((item) => item.id !== itemId)
          .reduce((sum, item) => sum + item.price * item.quantity, 0),
      })
    } else {
      // Update quantity
      const updatedItems = editedOrder.items.map((item) => (item.id === itemId ? { ...item, quantity } : item))

      setEditedOrder({
        ...editedOrder,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      })
    }
  }

  const removeItem = (itemId: string) => {
    if (!editedOrder) return

    const updatedItems = editedOrder.items.filter((item) => item.id !== itemId)
    setEditedOrder({
      ...editedOrder,
      items: updatedItems,
      total: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    })
  }

  const addProductToOrder = () => {
    if (!editedOrder || !selectedProduct) return

    const product = availableProducts.find((p) => p.id === selectedProduct)
    if (!product) return

    // Check if product already exists in order
    const existingItemIndex = editedOrder.items.findIndex((item) => item.id === product.id)

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...editedOrder.items]
      updatedItems[existingItemIndex].quantity += selectedQuantity

      setEditedOrder({
        ...editedOrder,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      })
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: selectedQuantity,
        image: product.images && product.images.length > 0 ? product.images[0] : undefined,
      }

      const updatedItems = [...editedOrder.items, newItem]

      setEditedOrder({
        ...editedOrder,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      })
    }

    // Reset selection
    setSelectedProduct("")
    setSelectedQuantity(1)
  }

  const saveOrderChanges = async () => {
    if (!editedOrder || !order) return

    try {
      // Preserve the original customer information
      const updatedOrder = {
        ...editedOrder,
        customerInfo: order.customerInfo, // Keep original customer info
      }

      // This would be your server action to update the order
      // For now, we'll just simulate it
      toast({
        title: "Cambios guardados",
        description: "Los cambios al pedido han sido guardados",
      })

      // Update local state
      setOrder(updatedOrder)
      setEditMode(false)
    } catch (error) {
      console.error("Failed to save order changes:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    }
  }

  // Check if order is in a final state (completed or cancelled)
  const isOrderInFinalState = order?.status === "completed" || order?.status === "cancelled"

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

          {!editMode && order && (
            <Button variant="outline" onClick={toggleEditMode} className="ml-auto">
              Editar Productos
            </Button>
          )}

          {editMode && (
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={toggleEditMode}>
                Cancelar
              </Button>
              <Button onClick={saveOrderChanges}>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="ml-2">Cargando detalles del pedido...</p>
          </div>
        ) : error || !order ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">Pedido No Encontrado</h2>
            <p className="text-muted-foreground mb-6">{error || "No se pudo encontrar el pedido solicitado."}</p>
            <Button onClick={() => router.push("/admin/orders")}>Volver a Pedidos</Button>
          </div>
        ) : (
          <>
            {/* Prominent Order ID Display */}
            <div className="bg-muted p-4 rounded-lg mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
              <div className="lg:col-span-2 space-y-4">
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
                        {(editMode ? editedOrder?.items : order.items).map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b pb-3"
                          >
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border">
                                  <Image
                                    src={item.image || "/placeholder.svg"}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                              </div>
                            </div>

                            {editMode ? (
                              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                <div className="flex items-center border rounded-md">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-r-none"
                                    onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(item.id, Number.parseInt(e.target.value) || 0)}
                                    className="h-8 w-14 rounded-none text-center border-x"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-l-none"
                                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item.id)}
                                  className="text-destructive"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                                <p className="font-medium w-20 text-right">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <p className="text-sm text-muted-foreground">
                                  {item.quantity} × ${item.price.toFixed(2)}
                                </p>
                                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {editMode && (
                      <div className="pt-4 border-t">
                        <h3 className="font-medium mb-4">Añadir Producto</h3>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Select value={selectedProduct} onValueChange={setSelectedProduct} className="flex-1">
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProducts.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - ${product.price.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="flex items-center border rounded-md mt-2 sm:mt-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-8 rounded-r-none"
                              onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={selectedQuantity}
                              onChange={(e) => setSelectedQuantity(Number.parseInt(e.target.value) || 1)}
                              className="h-10 w-14 rounded-none text-center border-x"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-8 rounded-l-none"
                              onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button onClick={addProductToOrder} disabled={!selectedProduct} className="mt-2 sm:mt-0">
                            <Plus className="h-4 w-4 mr-2" />
                            Añadir
                          </Button>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between font-bold text-lg">
                      <p>Total</p>
                      <p>${(editMode ? editedOrder?.total : order.total).toFixed(2)}</p>
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
                    {/* Replace the Select component with conditional rendering based on order status */}
                    {isOrderInFinalState ? (
                      <div className="flex items-center h-10 w-[130px] px-3 py-2 border rounded-md bg-muted">
                        <span className="text-sm">{getStatusText(order.status)}</span>
                      </div>
                    ) : (
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(value as Order["status"])}
                        disabled={editMode || isStatusChanging}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Estado">
                            {isStatusChanging ? (
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                <span>Actualizando...</span>
                              </div>
                            ) : (
                              getStatusText(order.status)
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {/* Only show Pending option if current status is Pending */}
                          {order.status === "pending" && <SelectItem value="pending">Pendiente</SelectItem>}
                          <SelectItem value="processing">Procesando</SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {/* Inventory status information */}
                    <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                      <h4 className="font-medium mb-1">Información de Inventario:</h4>
                      <p>
                        {order.inventoryUpdated
                          ? "El inventario ya ha sido actualizado para este pedido."
                          : "El inventario se actualizará automáticamente cuando el pedido se marque como 'Completado'."}
                      </p>

                      {order.status === "pending" && (
                        <p className="mt-2">
                          <AlertTriangle className="h-4 w-4 inline-block mr-1 text-yellow-600" />
                          Al cambiar a "Procesando" o "Completado", se reducirá el inventario.
                        </p>
                      )}

                      {order.status === "processing" && (
                        <p className="mt-2">
                          <AlertTriangle className="h-4 w-4 inline-block mr-1 text-yellow-600" />
                          Al cambiar a "Completado", se reducirá el inventario si aún no se ha actualizado.
                        </p>
                      )}

                      {(order.status === "processing" || order.status === "completed") && !isOrderInFinalState && (
                        <p className="mt-2">
                          <AlertTriangle className="h-4 w-4 inline-block mr-1 text-yellow-600" />
                          Al cambiar a "Cancelado", se devolverán los productos al inventario.
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full" onClick={() => window.print()}>
                      Imprimir Pedido
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>

            {/* Status change confirmation dialog */}
            <AlertDialog open={showStatusConfirmation} onOpenChange={setShowStatusConfirmation}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar cambio de estado</AlertDialogTitle>
                  <AlertDialogDescription>
                    Estás cambiando el estado del pedido de <strong>{getStatusText(order.status)}</strong> a{" "}
                    <strong>{pendingStatus ? getStatusText(pendingStatus) : ""}</strong>.
                    <div
                      className={`mt-4 p-3 rounded-md ${
                        inventoryImpact.type === "decrease"
                          ? "bg-red-50 text-red-800"
                          : inventoryImpact.type === "increase"
                            ? "bg-green-50 text-green-800"
                            : "bg-blue-50 text-blue-800"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                      <span className="font-medium">Impacto en el inventario:</span> {inventoryImpact.message}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => pendingStatus && confirmStatusChange(pendingStatus)}
                    className={
                      inventoryImpact.type === "decrease"
                        ? "bg-red-600 hover:bg-red-700"
                        : inventoryImpact.type === "increase"
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                    }
                  >
                    Confirmar Cambio
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </ProtectedAdminRoute>
  )
}

