"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, ArrowUpDown, Edit, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { deleteProductVariant } from "@/app/actions/inventory"
import { formatCurrency } from "@/lib/utils"
import type { ProductVariant } from "@/types/inventory"

interface InventoryVariantsTableProps {
  variants: (ProductVariant & {
    productName: string
    productCategory: string
    productSubcategory?: string
  })[]
}

export function InventoryVariantsTable({ variants }: InventoryVariantsTableProps) {
  const router = useRouter()
  const [selectedVariants, setSelectedVariants] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVariants(variants.map((variant) => variant.id))
    } else {
      setSelectedVariants([])
    }
  }

  const handleSelectVariant = (variantId: string, checked: boolean) => {
    if (checked) {
      setSelectedVariants([...selectedVariants, variantId])
    } else {
      setSelectedVariants(selectedVariants.filter((id) => id !== variantId))
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (confirm("Are you sure you want to delete this variant? This action cannot be undone.")) {
      setIsDeleting(variantId)
      try {
        const result = await deleteProductVariant(variantId)
        if (result.success) {
          toast.success("Variant deleted successfully")
          router.refresh()
        } else {
          toast.error(result.error || "Failed to delete variant")
        }
      } catch (error) {
        console.error("Error deleting variant:", error)
        toast.error("An error occurred while deleting the variant")
      } finally {
        setIsDeleting(null)
      }
    }
  }

  const getInventoryStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            In Stock
          </Badge>
        )
      case "low_stock":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Low Stock
          </Badge>
        )
      case "out_of_stock":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Out of Stock
          </Badge>
        )
      case "discontinued":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Discontinued
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Format variant attributes for display
  const formatAttributes = (attributes: Record<string, any>) => {
    return Object.entries(attributes)
      .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
      .join(", ")
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedVariants.length === variants.length && variants.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Select all variants"
              />
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1">
                <span>Product</span>
                <Button variant="ghost" size="icon" className="h-4 w-4">
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1">
                <span>Variant</span>
                <Button variant="ghost" size="icon" className="h-4 w-4">
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1">
                <span>SKU</span>
                <Button variant="ghost" size="icon" className="h-4 w-4">
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1">
                <span>Price</span>
                <Button variant="ghost" size="icon" className="h-4 w-4">
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1">
                <span>Quantity</span>
                <Button variant="ghost" size="icon" className="h-4 w-4">
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No variants found.
              </TableCell>
            </TableRow>
          ) : (
            variants.map((variant) => (
              <TableRow key={variant.id} className={isDeleting === variant.id ? "opacity-50" : ""}>
                <TableCell>
                  <Checkbox
                    checked={selectedVariants.includes(variant.id)}
                    onCheckedChange={(checked) => handleSelectVariant(variant.id, !!checked)}
                    aria-label={`Select ${variant.productName} - ${formatAttributes(variant.attributes)}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{variant.productName}</div>
                  <div className="text-sm text-muted-foreground">{variant.productCategory}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{formatAttributes(variant.attributes)}</div>
                </TableCell>
                <TableCell>{variant.sku}</TableCell>
                <TableCell>{formatCurrency(variant.price)}</TableCell>
                <TableCell>{variant.inventory.quantity}</TableCell>
                <TableCell>{getInventoryStatusBadge(variant.inventory.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isDeleting === variant.id}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/products/${variant.productId}?variant=${variant.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/products/${variant.productId}/edit?variant=${variant.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteVariant(variant.id)}
                        disabled={isDeleting === variant.id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

