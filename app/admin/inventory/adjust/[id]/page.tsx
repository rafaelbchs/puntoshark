"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getProductById, updateInventory } from "@/app/actions/inventory"
import ProtectedAdminRoute from "@/components/protected-admin-route"
import { toast } from "@/hooks/use-toast"
import type { Product } from "@/types/inventory"

export default function AdjustInventoryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [quantity, setQuantity] = useState<number>(0)
  const [reason, setReason] = useState<string>("manual")
  const [notes, setNotes] = useState<string>("")

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await getProductById(params.id)
        if (productData) {
          setProduct(productData)
          setQuantity(productData.inventory.quantity)
        }
      } catch (error) {
        console.error("Failed to fetch product:", error)
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product) return

    setSaving(true)
    try {
      // Calculate the new quantity based on the adjustment type
      const result = await updateInventory(
        product.id,
        quantity,
        reason,
        undefined,
        undefined,
        notes, // Pass notes as an additional parameter
      )

      if (!result.success) {
        throw new Error(result.error || "Failed to update inventory")
      }

      toast({
        title: "Success",
        description: "Inventory updated successfully",
      })

      // Redirect back to inventory page
      router.push("/admin/inventory")
    } catch (error) {
      console.error("Failed to update inventory:", error)
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center">
          <p>Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center">
          <p>Product not found</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedAdminRoute>
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/admin/inventory" passHref>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Adjust Inventory</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>Current inventory information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-medium">Current Quantity</p>
                      <p className="text-2xl font-bold">{product.inventory.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm">{product.inventory.status.replace("_", " ")}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Adjust Inventory</CardTitle>
                  <CardDescription>Update the inventory quantity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">New Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 0)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      {quantity > product.inventory.quantity
                        ? `Adding ${quantity - product.inventory.quantity} units`
                        : quantity < product.inventory.quantity
                          ? `Removing ${product.inventory.quantity - quantity} units`
                          : "No change in quantity"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Adjustment</Label>
                    <Select value={reason} onValueChange={setReason} required>
                      <SelectTrigger id="reason">
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Adjustment</SelectItem>
                        <SelectItem value="return">Order Return</SelectItem>
                        <SelectItem value="adjustment">Inventory Count</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any additional details about this adjustment"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </ProtectedAdminRoute>
  )
}

