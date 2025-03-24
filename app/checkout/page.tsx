"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"
import { processCheckout } from "@/app/actions/checkout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("")

  if (typeof window !== "undefined" && items.length === 0) {
    router.push("/cart")
    return null
  }

  // Determine if cash payment should be shown
  const showCashOption = deliveryMethod === "delivery" || deliveryMethod === "pickup"

  // Reemplaza la función handleSubmit con esta versión modificada que usa window.location.href para la redirección
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)

      // Add this logging to see what's being submitted
      console.log("Formulario de checkout - datos enviados:", {
        name: formData.get("name"),
        email: formData.get("email"),
        cedula: formData.get("cedula"),
        phone: formData.get("phone"),
        deliveryMethod: formData.get("deliveryMethod"),
        paymentMethod: formData.get("paymentMethod"),
        address: formData.get("address"),
        mrwOffice: formData.get("mrwOffice"),
      })

      console.log("Enviando formulario de checkout...")

      const result = await processCheckout(formData)

      console.log("Resultado del checkout:", result)

      if (result.success) {
        // Clear cart first
        clearCart()

        // Store the order data in sessionStorage for the confirmation page
        if (result.order) {
          try {
            sessionStorage.setItem("lastOrder", JSON.stringify(result.order))
            console.log("Order saved to sessionStorage:", result.order)
          } catch (err) {
            console.error("Failed to save order to sessionStorage:", err)
          }
        }

        console.log("Checkout successful, redirecting to:", `/checkout/confirmation?orderId=${result.orderId}`)

        // Use window.location.href for a hard redirect instead of router.push
        window.location.href = `/checkout/confirmation?orderId=${result.orderId}`
        return // Important: stop execution here
      } else {
        console.error("Checkout fallido:", result.error)
        setError(result.error || "Error al procesar el checkout")
      }
    } catch (err) {
      console.error("Error de checkout:", err)
      setError("Ocurrió un error inesperado")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Datos Personales</CardTitle>
                <CardDescription>Por favor ingresa tus datos para el envío y contacto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula</Label>
                  <Input id="cedula" name="cedula" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" name="phone" type="tel" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Método de Entrega</CardTitle>
                <CardDescription>Selecciona cómo quieres recibir tu pedido.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryMethod">Método de Entrega</Label>
                  <Select name="deliveryMethod" value={deliveryMethod} onValueChange={setDeliveryMethod} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un método de entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mrw">Envío Nacional (MRW)</SelectItem>
                      <SelectItem value="delivery">Delivery (Maracaibo)</SelectItem>
                      <SelectItem value="pickup">Pick-Up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {deliveryMethod === "mrw" && (
                  <div className="space-y-2">
                    <Label htmlFor="mrwOffice">Oficina de MRW</Label>
                    <Input id="mrwOffice" name="mrwOffice" required />
                  </div>
                )}

                {deliveryMethod === "delivery" && (
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección de Entrega</Label>
                    <Textarea id="address" name="address" rows={3} required />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Método de Pago</CardTitle>
                <CardDescription>Selecciona cómo quieres pagar tu pedido.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de Pago</Label>
                  <Select name="paymentMethod" value={paymentMethod} onValueChange={setPaymentMethod} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagoMovil">Pago Móvil</SelectItem>
                      <SelectItem value="zelle">Zelle</SelectItem>
                      <SelectItem value="binance">Binance</SelectItem>
                      {showCashOption && <SelectItem value="efectivo">Efectivo</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                {/* {paymentMethod === "pagoMovil" && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="font-medium">Instrucciones para Pago Móvil:</p>
                    <p className="text-sm mt-2">Realiza tu pago al número: 0414-1234567</p>
                    <p className="text-sm">Banco: Mercantil</p>
                    <p className="text-sm">CI: V-12345678</p>
                  </div>
                )}

                {paymentMethod === "zelle" && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="font-medium">Instrucciones para Zelle:</p>
                    <p className="text-sm mt-2">Envía tu pago a: email@example.com</p>
                    <p className="text-sm">Nombre: John Doe</p>
                  </div>
                )}

                {paymentMethod === "binance" && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="font-medium">Instrucciones para Binance:</p>
                    <p className="text-sm mt-2">Envía USDT a la siguiente dirección:</p>
                    <p className="text-sm break-all">0x1234567890abcdef1234567890abcdef12345678</p>
                    <p className="text-sm mt-2">Red: BEP20 (BSC)</p>
                  </div>
                )} */}
              </CardContent>
              <CardFooter className="flex flex-col items-stretch">
                {error && (
                  <div className="text-sm text-destructive mb-4 w-full p-3 border border-destructive/50 rounded-md bg-destructive/10">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando Pedido...
                    </>
                  ) : (
                    "Completar Pedido"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
              <CardDescription>Revisa tus artículos antes de completar tu pedido.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Cant: {item.quantity}</p>
                    </div>
                    <p>${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold">
                  <p>Total</p>
                  <p>${subtotal.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

