"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getProducts, updateInventory, getInventoryLogs } from "@/app/actions/inventory"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import ProtectedAdminRoute from "@/components/protected-admin-route"
import { useAdminAuth } from "@/context/admin-auth-context"
import { LogOut, Plus, Minus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Product, InventoryUpdateLog } from "@/types/inventory"

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [logs, setLogs] = useState<InventoryUpdateLog[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0)
  const [adjustmentReason, setAdjustmentReason] = useState<"manual" | "return">("manual")
  const [activeTab, setActiveTab] = useState("inventory")
  const { logout } = useAdminAuth()

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsData, logsData] = await Promise.all([getProducts(), getInventoryLogs()])
        setProducts(productsData || [])
        setLogs(logsData || [])
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast({
          title: "Error",
          description: "Failed to load inventory data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAdjustClick = (product: Product) => {
    setSelectedProduct(product)
    setAdjustmentQuantity(0)
    setAdjustDialogOpen(true)
  }

  const confirmAdjustment = async () => {
    if (!selectedProduct) return

    try {
      const newQuantity = selectedProduct.inventory.quantity + adjustmentQuantity
      if (newQuantity < 0) {
        toast({
          title: "Error",
          description: "Inventory cannot be negative",
          variant: "destructive",
        })
        return
      }

      const result = await updateInventory(selectedProduct.id, newQuantity, adjustmentReason, undefined, "admin")

      if (result.success && result.product) {
        // Update products list
        setProducts(products.map((p) => (p.id === selectedProduct.id ? result.product : p)))

        // Update logs if a new log was created
        if (result.log) {
          setLogs([result.log, ...logs])
        }

        toast({
          title: "Success",
          description: "Inventory updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update inventory",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update inventory:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setAdjustDialogOpen(false)
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

  const getReasonBadge = (reason: InventoryUpdateLog["reason"]) => {
    switch (reason) {
      case "order":
        return <Badge className="bg-blue-100 text-blue-800">Order</Badge>
      case "manual":
        return <Badge className="bg-purple-100 text-purple-800">Manual</Badge>
      case "return":
        return <Badge className="bg-green-100 text-green-800">Return</Badge>
      case "adjustment":
        return <Badge className="bg-gray-100 text-gray-800">Adjustment</Badge>
      default:
        return <Badge>{reason}</Badge>
    }
  }

  return (
    <ProtectedAdminRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin: Inventory Management</h1>
          <div className="flex gap-2">
            <Link href="/admin/products" passHref>
              <Button variant="outline">Products</Button>
            </Link>
            <Button variant="outline" onClick={logout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>View and adjust your product inventory levels</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading inventory...</p>
                ) : products.length === 0 ? (
                  <div className="text-center py-8">
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
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell>{product.inventory.quantity}</TableCell>
                          <TableCell>{getStatusBadge(product.inventory.status)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdjustClick(product)}
                              disabled={!product.inventory.managed}
                            >
                              Adjust
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Inventory History</CardTitle>
                <CardDescription>View a log of all inventory changes</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading history...</p>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium mb-2">No inventory changes found</h3>
                    <p className="text-muted-foreground">Inventory changes will be recorded here.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Order ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => {
                        const product = products.find((p) => p.id === log.productId)
                        const change = log.newQuantity - log.previousQuantity

                        return (
                          <TableRow key={log.id}>
                            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                            <TableCell>{product?.name || log.productId}</TableCell>
                            <TableCell className={change >= 0 ? "text-green-600" : "text-red-600"}>
                              {change >= 0 ? `+${change}` : change}
                            </TableCell>
                            <TableCell>{getReasonBadge(log.reason)}</TableCell>
                            <TableCell>
                              {log.orderId ? (
                                <Link href={`/admin/orders/${log.orderId}`} className="text-primary hover:underline">
                                  {log.orderId}
                                </Link>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Inventory</DialogTitle>
              <DialogDescription>
                {selectedProduct?.name} (Current: {selectedProduct?.inventory.quantity})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustmentQuantity((prev) => prev - 1)}
                  disabled={selectedProduct?.inventory.quantity + adjustmentQuantity <= 0 && adjustmentQuantity <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <Input
                  type="number"
                  value={adjustmentQuantity}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value)
                    if (!isNaN(value)) {
                      setAdjustmentQuantity(value)
                    }
                  }}
                  className="text-center"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustmentQuantity((prev) => prev + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for adjustment</label>
                <Select
                  value={adjustmentReason}
                  onValueChange={(value) => setAdjustmentReason(value as "manual" | "return")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Adjustment</SelectItem>
                    <SelectItem value="return">Customer Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                New quantity will be:{" "}
                <strong>{selectedProduct ? selectedProduct.inventory.quantity + adjustmentQuantity : 0}</strong>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmAdjustment}>Confirm Adjustment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedAdminRoute>
  )
}

