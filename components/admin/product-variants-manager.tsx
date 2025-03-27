"use client"

import { useState } from "react"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { deleteProductVariant } from "@/app/actions/inventory"
import ProductVariantForm from "./product-variant-form"
import type { Product, ProductVariant } from "@/types/inventory"

interface ProductVariantsManagerProps {
  product: Product
  onVariantChange?: () => void
}

export default function ProductVariantsManager({ product, onVariantChange }: ProductVariantsManagerProps) {
  const [variantFormOpen, setVariantFormOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [variantToDelete, setVariantToDelete] = useState<ProductVariant | null>(null)

  const handleEditVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    setVariantFormOpen(true)
  }

  const handleAddVariant = () => {
    setSelectedVariant(undefined)
    setVariantFormOpen(true)
  }

  const handleDeleteClick = (variant: ProductVariant) => {
    setVariantToDelete(variant)
    setDeleteDialogOpen(true)
  }

  const handleDeleteVariant = async () => {
    if (!variantToDelete) return

    try {
      const result = await deleteProductVariant(variantToDelete.id)
      if (result.success) {
        toast({
          title: "Success",
          description: "Variant deleted successfully",
        })
        if (onVariantChange) onVariantChange()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete variant",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete variant:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setVariantToDelete(null)
    }
  }

  const handleVariantSuccess = () => {
    if (onVariantChange) onVariantChange()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Product Variants</CardTitle>
        <Button onClick={handleAddVariant} disabled={!product.variantAttributes?.length}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </CardHeader>
      <CardContent>
        {product.variants && product.variants.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                {product.variantAttributes?.map((attr) => (
                  <TableHead key={attr}>{attr}</TableHead>
                ))}
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell>{variant.sku}</TableCell>
                  {product.variantAttributes?.map((attr) => (
                    <TableCell key={attr}>{variant.attributes[attr] || "-"}</TableCell>
                  ))}
                  <TableCell>${variant.price || product.price}</TableCell>
                  <TableCell>{variant.inventory.quantity}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleEditVariant(variant)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteClick(variant)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center p-4 border rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground">No variants created yet.</p>
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={handleAddVariant}
              disabled={!product.variantAttributes?.length}
            >
              Create your first variant
            </Button>
          </div>
        )}

        {!product.variantAttributes?.length && (
          <div className="text-center p-4 border rounded-md bg-muted/50 mt-4">
            <p className="text-sm text-muted-foreground">
              You need to define variant attributes before creating variants.
            </p>
          </div>
        )}
      </CardContent>

      <ProductVariantForm
        product={product}
        variant={selectedVariant}
        open={variantFormOpen}
        onOpenChange={setVariantFormOpen}
        onSuccess={handleVariantSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the variant {variantToDelete?.sku}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVariant}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

