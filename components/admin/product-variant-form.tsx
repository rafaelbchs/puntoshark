"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { createProductVariant, updateProductVariant } from "@/app/actions/inventory"
import type { Product, ProductVariant } from "@/types/inventory"

interface ProductVariantFormProps {
  product: Product
  variant?: ProductVariant
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function ProductVariantForm({
  product,
  variant,
  open,
  onOpenChange,
  onSuccess,
}: ProductVariantFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    sku: variant?.sku || `${product.sku}-${Date.now().toString().slice(-4)}`,
    price: variant?.price || product.price,
    compareAtPrice: variant?.compareAtPrice || 0,
    inventoryQuantity: variant?.inventory.quantity || 0,
    attributes:
      variant?.attributes ||
      product.variantAttributes?.reduce(
        (acc, attr) => {
          acc[attr] = ""
          return acc
        },
        {} as Record<string, string>,
      ) ||
      {},
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: Number.parseFloat(value) || 0 }))
  }

  const handleAttributeChange = (attribute: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attribute]: value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const variantData = {
        sku: formData.sku,
        price: formData.price,
        compareAtPrice: formData.compareAtPrice || undefined,
        inventory: {
          quantity: formData.inventoryQuantity,
          lowStockThreshold: product.inventory.lowStockThreshold,
          status: determineStatus(formData.inventoryQuantity, product.inventory.lowStockThreshold),
          managed: product.inventory.managed,
        },
        attributes: formData.attributes,
      }

      let result
      if (variant) {
        // Update existing variant
        result = await updateProductVariant(variant.id, variantData)
      } else {
        // Create new variant
        result = await createProductVariant(product.id, variantData as any)
      }

      if (result.success) {
        toast({
          title: "Success",
          description: variant ? "Variant updated successfully" : "Variant created successfully",
        })
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save variant",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to save variant:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const determineStatus = (quantity: number, threshold: number) => {
    if (quantity <= 0) return "out_of_stock"
    if (quantity <= threshold) return "low_stock"
    return "in_stock"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{variant ? "Edit Variant" : "Add Variant"}</DialogTitle>
            <DialogDescription>
              {variant
                ? "Update the details for this product variant."
                : "Create a new variant with specific attributes."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} required />
            </div>

            {product.variantAttributes?.map((attr) => (
              <div key={attr} className="space-y-2">
                <Label htmlFor={`attr-${attr}`}>{attr}</Label>
                <Input
                  id={`attr-${attr}`}
                  value={formData.attributes[attr] || ""}
                  onChange={(e) => handleAttributeChange(attr, e.target.value)}
                  placeholder={`Enter ${attr.toLowerCase()}`}
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleNumberChange}
                    className="pl-7"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare at Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    id="compareAtPrice"
                    name="compareAtPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.compareAtPrice}
                    onChange={handleNumberChange}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventoryQuantity">Inventory Quantity</Label>
              <Input
                id="inventoryQuantity"
                name="inventoryQuantity"
                type="number"
                min="0"
                value={formData.inventoryQuantity}
                onChange={handleNumberChange}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : variant ? "Update Variant" : "Create Variant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

