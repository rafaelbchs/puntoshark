"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getProducts, deleteProduct, updateProduct } from "@/app/actions/inventory"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import ProtectedAdminRoute from "@/components/protected-admin-route"
import { useAdminAuth } from "@/context/admin-auth-context"
import { LogOut, Plus, Edit, Trash2, AlertCircle } from "lucide-react"
import { RevalidateButton } from "@/components/admin/revalidate-button" // Import the new component
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
import type { Product } from "@/types/inventory"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const { logout } = useAdminAuth()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const productsData = await getProducts()
      setProducts(productsData || [])
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId)
    setDeleteDialogOpen(true)
  }

  // Add a new function to handle marking a product as discontinued
  const markAsDiscontinued = async (productId: string) => {
    try {
      const product = products.find((p) => p.id === productId)
      if (!product) return

      const result = await updateProduct(productId, {
        inventory: {
          ...product.inventory,
          status: "discontinued",
          managed: false,
        },
      })

      if (result.success) {
        // Update the product in the local state
        setProducts(
          products.map((p) =>
            p.id === productId ? { ...p, inventory: { ...p.inventory, status: "discontinued", managed: false } } : p,
          ),
        )

        toast({
          title: "Product Discontinued",
          description: "Product has been marked as discontinued",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to mark product as discontinued:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  // Modify the confirmDelete function to handle products in orders
  const confirmDelete = async () => {
    if (!productToDelete) return

    try {
      const result = await deleteProduct(productToDelete)

      if (result.success) {
        setProducts(products.filter((product) => product.id !== productToDelete))
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
      } else {
        // If the product can't be deleted because it's in orders, offer to mark it as discontinued
        if (result.error?.includes("Cannot delete product that has been ordered")) {
          toast({
            title: "Cannot Delete Product",
            description:
              "This product has been ordered by customers. Would you like to mark it as discontinued instead?",
            variant: "destructive",
            action: (
              <Button
                variant="outline"
                onClick={() => {
                  markAsDiscontinued(productToDelete)
                  setDeleteDialogOpen(false)
                  setProductToDelete(null)
                }}
                className="mt-2"
              >
                Mark as Discontinued
              </Button>
            ),
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete product",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Failed to delete product:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const getStatusBadge = (status: Product["inventory"]["status"]) => {
    switch (status) {
      case "in_stock":
        return <Badge className="bg-green-100 text-green-800">In Stock</Badge>
      case "low_stock":
        return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
      case "out_of_stock":
        return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
      case "discontinued":
        return <Badge className="bg-gray-100 text-gray-800">Discontinued</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <ProtectedAdminRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin: Products</h1>
          <div className="flex gap-2">
            <RevalidateButton /> {/* Add the revalidate button */}
            <Link href="/admin/products/new" passHref>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </Link>
            <Button variant="outline" onClick={logout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Management</CardTitle>
            <CardDescription>View, edit, and manage your product inventory</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading products...</p>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">You haven't added any products yet.</p>
                <Link href="/admin/products/new" passHref>
                  <Button>Add Your First Product</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Inventory</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.inventory.quantity}</TableCell>
                      <TableCell>{getStatusBadge(product.inventory.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/products/${product.id}`} passHref>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product and remove it from your
                inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedAdminRoute>
  )
}

