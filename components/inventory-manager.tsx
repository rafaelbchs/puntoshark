"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Plus, Pencil, Eye, EyeOff, Trash2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  inventory: number
  visible: boolean
}

export default function InventoryManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  const emptyProduct: Product = {
    id: "",
    name: "",
    description: "",
    price: 0,
    image: "",
    inventory: 0,
    visible: true,
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products")
      const data = await response.json()
      setProducts(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching products:", error)
      setLoading(false)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingProduct),
      })

      if (response.ok) {
        toast({
          title: "Product added",
          description: "Product has been added successfully",
        })
        fetchProducts()
        setIsAddDialogOpen(false)
        setEditingProduct(null)
      } else {
        toast({
          title: "Error",
          description: "Failed to add product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding product:", error)
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingProduct) return

    try {
      const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingProduct),
      })

      if (response.ok) {
        toast({
          title: "Product updated",
          description: "Product has been updated successfully",
        })
        fetchProducts()
        setEditingProduct(null)
      } else {
        toast({
          title: "Error",
          description: "Failed to update product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating product:", error)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Product deleted",
          description: "Product has been deleted successfully",
        })
        fetchProducts()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const toggleVisibility = async (id: string, visible: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visible: !visible }),
      })

      if (response.ok) {
        toast({
          title: visible ? "Product hidden" : "Product visible",
          description: `Product is now ${visible ? "hidden from" : "visible to"} customers`,
        })
        fetchProducts()
      } else {
        toast({
          title: "Error",
          description: "Failed to update product visibility",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error toggling visibility:", error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" />
        <p>Loading inventory...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(emptyProduct)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={editingProduct?.name || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct!, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={editingProduct?.price || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct!, price: Number.parseFloat(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingProduct?.description || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct!, description: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inventory">Inventory Count</Label>
                  <Input
                    id="inventory"
                    type="number"
                    value={editingProduct?.inventory || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct!, inventory: Number.parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    value={editingProduct?.image || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct!, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="visible"
                  checked={editingProduct?.visible || false}
                  onCheckedChange={(checked) => setEditingProduct({ ...editingProduct!, visible: checked })}
                />
                <Label htmlFor="visible">Visible to customers</Label>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Add Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No products found. Add your first product to get started.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative h-12 w-12">
                        <Image
                          src={product.image || `/placeholder.svg?height=48&width=48`}
                          alt={product.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.inventory}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleVisibility(product.id, product.visible)}
                        className={product.visible ? "text-green-600" : "text-muted-foreground"}
                      >
                        {product.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setEditingProduct(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[550px]">
                            <DialogHeader>
                              <DialogTitle>Edit Product</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleUpdateProduct} className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">Product Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={editingProduct?.name || ""}
                                    onChange={(e) => setEditingProduct({ ...editingProduct!, name: e.target.value })}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-price">Price ($)</Label>
                                  <Input
                                    id="edit-price"
                                    type="number"
                                    step="0.01"
                                    value={editingProduct?.price || 0}
                                    onChange={(e) =>
                                      setEditingProduct({
                                        ...editingProduct!,
                                        price: Number.parseFloat(e.target.value),
                                      })
                                    }
                                    required
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                  id="edit-description"
                                  value={editingProduct?.description || ""}
                                  onChange={(e) =>
                                    setEditingProduct({ ...editingProduct!, description: e.target.value })
                                  }
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-inventory">Inventory Count</Label>
                                  <Input
                                    id="edit-inventory"
                                    type="number"
                                    value={editingProduct?.inventory || 0}
                                    onChange={(e) =>
                                      setEditingProduct({
                                        ...editingProduct!,
                                        inventory: Number.parseInt(e.target.value),
                                      })
                                    }
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-image">Image URL</Label>
                                  <Input
                                    id="edit-image"
                                    value={editingProduct?.image || ""}
                                    onChange={(e) => setEditingProduct({ ...editingProduct!, image: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="edit-visible"
                                  checked={editingProduct?.visible || false}
                                  onCheckedChange={(checked) =>
                                    setEditingProduct({ ...editingProduct!, visible: checked })
                                  }
                                />
                                <Label htmlFor="edit-visible">Visible to customers</Label>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button type="button" variant="outline">
                                    Cancel
                                  </Button>
                                </DialogClose>
                                <Button type="submit">Update Product</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

