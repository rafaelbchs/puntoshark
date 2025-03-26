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
import { LogOut, Plus, Minus, Search, X, Filter } from "lucide-react"
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { Product, InventoryUpdateLog } from "@/types/inventory"

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [logs, setLogs] = useState<InventoryUpdateLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<InventoryUpdateLog[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0)
  const [adjustmentReason, setAdjustmentReason] = useState<"manual" | "return">("manual")
  const [activeTab, setActiveTab] = useState("inventory")
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [logSearchQuery, setLogSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [productCurrentPage, setProductCurrentPage] = useState(1)
  const [logCurrentPage, setLogCurrentPage] = useState(1)
  const [productTotalPages, setProductTotalPages] = useState(1)
  const [logTotalPages, setLogTotalPages] = useState(1)
  const { logout } = useAdminAuth()

  const itemsPerPage = 10

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  // Filter products when search or filter changes
  useEffect(() => {
    let result = [...products]

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((product) => product.inventory.status === statusFilter)
    }

    // Apply search
    if (productSearchQuery) {
      const query = productSearchQuery.toLowerCase()
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query),
      )
    }

    setFilteredProducts(result)
    setProductTotalPages(Math.ceil(result.length / itemsPerPage))
    setProductCurrentPage(1) // Reset to first page when filters change
  }, [products, statusFilter, productSearchQuery])

  // Filter logs when search changes
  useEffect(() => {
    let result = [...logs]

    // Apply search
    if (logSearchQuery) {
      const query = logSearchQuery.toLowerCase()
      result = result.filter((log) => {
        const product = products.find((p) => p.id === log.productId)
        return (
          product?.name.toLowerCase().includes(query) ||
          false ||
          log.reason.toLowerCase().includes(query) ||
          log.orderId?.toLowerCase().includes(query) ||
          false
        )
      })
    }

    setFilteredLogs(result)
    setLogTotalPages(Math.ceil(result.length / itemsPerPage))
    setLogCurrentPage(1) // Reset to first page when search changes
  }, [logs, logSearchQuery, products])

  async function fetchData() {
    try {
      const [productsData, logsData] = await Promise.all([getProducts(), getInventoryLogs()])
      setProducts(productsData || [])
      setFilteredProducts(productsData || [])
      setProductTotalPages(Math.ceil((productsData?.length || 0) / itemsPerPage))

      setLogs(logsData || [])
      setFilteredLogs(logsData || [])
      setLogTotalPages(Math.ceil((logsData?.length || 0) / itemsPerPage))
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
          setFilteredLogs([result.log, ...filteredLogs])
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

  // Get current page of products
  const getCurrentPageProducts = () => {
    const startIndex = (productCurrentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }

  // Get current page of logs
  const getCurrentPageLogs = () => {
    const startIndex = (logCurrentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredLogs.slice(startIndex, endIndex)
  }

  // Generate pagination items for products
  const getProductPaginationItems = () => {
    const items = []

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink isActive={productCurrentPage === 1} onClick={() => setProductCurrentPage(1)}>
          1
        </PaginationLink>
      </PaginationItem>,
    )

    // Show ellipsis if needed
    if (productCurrentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Show pages around current page
    for (
      let i = Math.max(2, productCurrentPage - 1);
      i <= Math.min(productTotalPages - 1, productCurrentPage + 1);
      i++
    ) {
      if (i <= 1 || i >= productTotalPages) continue // Skip first and last page as they're always shown
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={productCurrentPage === i} onClick={() => setProductCurrentPage(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Show ellipsis if needed
    if (productCurrentPage < productTotalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Always show last page if there's more than one page
    if (productTotalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            isActive={productCurrentPage === productTotalPages}
            onClick={() => setProductCurrentPage(productTotalPages)}
          >
            {productTotalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return items
  }

  // Generate pagination items for logs
  const getLogPaginationItems = () => {
    const items = []

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink isActive={logCurrentPage === 1} onClick={() => setLogCurrentPage(1)}>
          1
        </PaginationLink>
      </PaginationItem>,
    )

    // Show ellipsis if needed
    if (logCurrentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Show pages around current page
    for (let i = Math.max(2, logCurrentPage - 1); i <= Math.min(logTotalPages - 1, logCurrentPage + 1); i++) {
      if (i <= 1 || i >= logTotalPages) continue // Skip first and last page as they're always shown
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={logCurrentPage === i} onClick={() => setLogCurrentPage(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Show ellipsis if needed
    if (logCurrentPage < logTotalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Always show last page if there's more than one page
    if (logTotalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink isActive={logCurrentPage === logTotalPages} onClick={() => setLogCurrentPage(logTotalPages)}>
            {logTotalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return items
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

                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      className="pl-8"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                    />
                    {productSearchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-9 w-9"
                        onClick={() => setProductSearchQuery("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="low_stock">Low Stock</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading inventory...</p>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium mb-2">No products found</h3>
                    <p className="text-muted-foreground mb-4">
                      {productSearchQuery || statusFilter !== "all"
                        ? "No products match your search criteria"
                        : "You haven't added any products yet."}
                    </p>
                    {!productSearchQuery && statusFilter === "all" && (
                      <Link href="/admin/products/new" passHref>
                        <Button>Add Your First Product</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
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
                        {getCurrentPageProducts().map((product) => (
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

                    {/* Pagination */}
                    {productTotalPages > 1 && (
                      <Pagination className="mt-6">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setProductCurrentPage((prev) => Math.max(1, prev - 1))}
                              disabled={productCurrentPage === 1}
                            />
                          </PaginationItem>

                          {getProductPaginationItems()}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setProductCurrentPage((prev) => Math.min(productTotalPages, prev + 1))}
                              disabled={productCurrentPage === productTotalPages}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Inventory History</CardTitle>
                <CardDescription>View a log of all inventory changes</CardDescription>

                <div className="relative mt-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search history..."
                    className="pl-8"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                  />
                  {logSearchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-9"
                      onClick={() => setLogSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading history...</p>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium mb-2">No inventory changes found</h3>
                    <p className="text-muted-foreground">
                      {logSearchQuery
                        ? "No history entries match your search criteria"
                        : "Inventory changes will be recorded here."}
                    </p>
                  </div>
                ) : (
                  <>
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
                        {getCurrentPageLogs().map((log) => {
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

                    {/* Pagination */}
                    {logTotalPages > 1 && (
                      <Pagination className="mt-6">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setLogCurrentPage((prev) => Math.max(1, prev - 1))}
                              disabled={logCurrentPage === 1}
                            />
                          </PaginationItem>

                          {getLogPaginationItems()}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setLogCurrentPage((prev) => Math.min(logTotalPages, prev + 1))}
                              disabled={logCurrentPage === logTotalPages}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
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
                  name="adjustmentReason"
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

