"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
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
import ProductVariantForm from "@/components/admin/product-variant-form"
import { deleteProductVariant } from "@/app/actions/inventory"
import type { Product, ProductVariant } from "@/types/inventory"
import { supabase } from "@/lib/supabase"

interface ProductVariantsManagerProps {
  product: Product
}

export default function ProductVariantsManager({ product }: ProductVariantsManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [deletingVariant, setDeletingVariant] = useState<ProductVariant | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch variants on component mount
  useEffect(() => {
    async function fetchVariants() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", product.id)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        // Transform the data to match the frontend model
        const transformedVariants = data.map((variant: any) => ({
          id: variant.id,
          productId: variant.product_id,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compare_at_price,
          inventory: {
            quantity: variant.inventory_quantity,
            lowStockThreshold: variant.low_stock_threshold,
            status: variant.inventory_status,
            managed: variant.inventory_managed,
          },
          attributes: variant.attributes || {},
          createdAt: variant.created_at,
          updatedAt: variant.updated_at,
        }))

        setVariants(transformedVariants)
      } catch (error) {
        console.error("Error fetching variants:", error)
        toast({
          title: "Error",
          description: "Failed to load product variants",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchVariants()
  }, [product.id])

  // Handle variant deletion
  const handleDeleteVariant = async () => {
    if (!deletingVariant) return

    setIsDeleting(true)
    try {
      const result = await deleteProductVariant(deletingVariant.id)

      if (result.success) {
        setVariants(variants.filter((v) => v.id !== deletingVariant.id))
        toast({
          title: "Variant deleted",
          description: "The variant has been deleted successfully",
        })
      } else {
        throw new Error(result.error || "Failed to delete variant")
      }
    } catch (error) {
      console.error("Error deleting variant:", error)
      toast({
        title: "Error",
        description: "Failed to delete variant",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeletingVariant(null)
    }
  }

  // Handle variant form success
  const handleVariantFormSuccess = () => {
    // Refresh variants
    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error refreshing variants:", error)
          return
        }

        // Transform the data to match the frontend model
        const transformedVariants = data.map((variant: any) => ({
          id: variant.id,
          productId: variant.product_id,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compare_at_price,
          inventory: {
            quantity: variant.inventory_quantity,
            lowStockThreshold: variant.low_stock_threshold,
            status: variant.inventory_status,
            managed: variant.inventory_managed,
          },
          attributes: variant.attributes || {},
          createdAt: variant.created_at,
          updatedAt: variant.updated_at,
        }))

        setVariants(transformedVariants)
      })
  }

  // Format variant attributes for display
  const formatAttributes = (attributes: Record<string, string>) => {
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")
  }

  // Get inventory status badge color
  const getInventoryStatusColor = (status: string) => {
    switch (status) {
      case "in_stock":
        return "bg-green-500"
      case "low_stock":
        return "bg-yellow-500"
      case "out_of_stock":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (!product.hasVariants) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Variants not enabled</AlertTitle>
        <AlertDescription>
          This product does not have variants enabled. Go to the Product Details tab and enable variants first.
        </AlertDescription>
      </Alert>
    )
  }

  if (product.variantAttributes?.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No variant attributes selected</AlertTitle>
        <AlertDescription>
          You need to select at least one variant attribute (like size or color) in the Product Details tab before
          adding variants.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Variants</h2>
        <Button onClick={() => setIsAddVariantOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
              <CardFooter>
                <div className="h-9 bg-muted rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : variants.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Variants</CardTitle>
            <CardDescription>This product doesn't have any variants yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Click the "Add Variant" button to create your first variant for this product.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {variants.map((variant) => (
            <Card key={variant.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{formatAttributes(variant.attributes)}</CardTitle>
                <CardDescription className="text-xs">SKU: {variant.sku}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">${variant.price.toFixed(2)}</span>
                  {variant.compareAtPrice > 0 && (
                    <span className="text-sm line-through text-muted-foreground">
                      ${variant.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${getInventoryStatusColor(
                      variant.inventory.status,
                    )} text-white capitalize text-xs px-2 py-0.5`}
                  >
                    {variant.inventory.status.replace("_", " ")}
                  </Badge>
                  <span className="text-sm">
                    {variant.inventory.quantity} {variant.inventory.quantity === 1 ? "unit" : "units"} in stock
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingVariant(variant)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-500 hover:text-red-600"
                  onClick={() => setDeletingVariant(variant)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Variant Form */}
      <ProductVariantForm
        product={product}
        variant={editingVariant}
        open={isAddVariantOpen || !!editingVariant}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddVariantOpen(false)
            setEditingVariant(null)
          }
        }}
        onSuccess={handleVariantFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingVariant} onOpenChange={(open) => !open && setDeletingVariant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this variant. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteVariant()
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

