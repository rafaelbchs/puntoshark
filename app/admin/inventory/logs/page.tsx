"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Download, Filter, RefreshCw, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { getInventoryLogs, getProducts } from "@/app/actions/inventory"
import ProtectedAdminRoute from "@/components/protected-admin-route"
import { toast } from "@/hooks/use-toast"
import type { InventoryUpdateLog, Product } from "@/types/inventory"

export default function InventoryLogsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [logs, setLogs] = useState<InventoryUpdateLog[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [totalLogs, setTotalLogs] = useState(0)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [productFilter, setProductFilter] = useState<string>("")
  const [reasonFilter, setReasonFilter] = useState<string>("")
  const [dateFromFilter, setDateFromFilter] = useState<Date | undefined>(undefined)
  const [dateToFilter, setDateToFilter] = useState<Date | undefined>(undefined)
  const [isFilterApplied, setIsFilterApplied] = useState(false)

  // Initialize from URL params if present
  useEffect(() => {
    const page = searchParams.get("page") ? Number.parseInt(searchParams.get("page") as string) : 1
    const size = searchParams.get("size") ? Number.parseInt(searchParams.get("size") as string) : 10
    const search = searchParams.get("search") || ""
    const product = searchParams.get("product") || ""
    const reason = searchParams.get("reason") || ""
    const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom") as string) : undefined
    const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo") as string) : undefined

    setCurrentPage(page)
    setPageSize(size)
    setSearchTerm(search)
    setProductFilter(product)
    setReasonFilter(reason)
    setDateFromFilter(dateFrom)
    setDateToFilter(dateTo)

    // Check if any filter is applied
    setIsFilterApplied(!!(search || product || reason || dateFrom || dateTo))

    // Load products for the filter dropdown
    fetchProducts()

    // Initial logs fetch
    fetchLogs(page, size, search, product, reason, dateFrom, dateTo)
  }, [searchParams])

  const fetchProducts = async () => {
    try {
      const productsData = await getProducts(true) // Include discontinued products
      setProducts(productsData)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast({
        title: "Error",
        description: "Failed to load products for filtering",
        variant: "destructive",
      })
    }
  }

  const fetchLogs = async (
    page: number,
    size: number,
    search?: string,
    productId?: string,
    reason?: string,
    dateFrom?: Date,
    dateTo?: Date,
  ) => {
    setLoading(true)
    try {
      const { logs: logsData, total } = await getInventoryLogs({
        page,
        pageSize: size,
        searchTerm: search,
        productId,
        reason,
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
      })

      setLogs(logsData)
      setTotalLogs(total)
    } catch (error) {
      console.error("Failed to fetch inventory logs:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory logs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    // Update URL with filter parameters
    const params = new URLSearchParams()
    params.set("page", "1") // Reset to first page when applying filters
    params.set("size", pageSize.toString())

    if (searchTerm) params.set("search", searchTerm)
    if (productFilter) params.set("product", productFilter)
    if (reasonFilter) params.set("reason", reasonFilter)
    if (dateFromFilter) params.set("dateFrom", dateFromFilter.toISOString())
    if (dateToFilter) params.set("dateTo", dateToFilter.toISOString())

    router.push(`/admin/inventory/logs?${params.toString()}`)
  }

  const resetFilters = () => {
    setSearchTerm("")
    setProductFilter("")
    setReasonFilter("")
    setDateFromFilter(undefined)
    setDateToFilter(undefined)

    // Reset URL to just the page and size
    const params = new URLSearchParams()
    params.set("page", "1")
    params.set("size", pageSize.toString())
    router.push(`/admin/inventory/logs?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/admin/inventory/logs?${params.toString()}`)
  }

  const handlePageSizeChange = (size: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", "1") // Reset to first page when changing page size
    params.set("size", size)
    router.push(`/admin/inventory/logs?${params.toString()}`)
  }

  // Export logs to CSV
  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Date", "Product", "Previous Qty", "New Qty", "Change", "Reason", "Admin", "Details", "Order ID"]
    const rows = logs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.productName || log.productId,
      log.previousQuantity,
      log.newQuantity,
      log.newQuantity - log.previousQuantity,
      getReasonText(log.reason),
      log.adminName || "System",
      log.details || "",
      log.orderId || "",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `inventory-logs-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Helper function to get reason text
  const getReasonText = (reason: string): string => {
    switch (reason) {
      case "order":
        return "Order Placed"
      case "manual":
        return "Manual Adjustment"
      case "return":
        return "Order Return"
      case "adjustment":
        return "Inventory Adjustment"
      case "product_created":
        return "Product Created"
      case "product_updated":
        return "Product Updated"
      case "product_deleted":
        return "Product Deleted"
      default:
        return reason
    }
  }

  // Helper function to get reason badge
  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case "order":
        return <Badge className="bg-blue-100 text-blue-800">Order Placed</Badge>
      case "manual":
        return <Badge className="bg-purple-100 text-purple-800">Manual Adjustment</Badge>
      case "return":
        return <Badge className="bg-green-100 text-green-800">Order Return</Badge>
      case "adjustment":
        return <Badge className="bg-gray-100 text-gray-800">Inventory Adjustment</Badge>
      case "product_created":
        return <Badge className="bg-teal-100 text-teal-800">Product Created</Badge>
      case "product_updated":
        return <Badge className="bg-amber-100 text-amber-800">Product Updated</Badge>
      case "product_deleted":
        return <Badge className="bg-red-100 text-red-800">Product Deleted</Badge>
      default:
        return <Badge>{reason}</Badge>
    }
  }

  // Calculate total pages
  const totalPages = Math.ceil(totalLogs / pageSize)

  return (
    <ProtectedAdminRoute>
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Link href="/admin/inventory" passHref>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Inventory Logs</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportToCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                fetchLogs(currentPage, pageSize, searchTerm, productFilter, reasonFilter, dateFromFilter, dateToFilter)
              }
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Logs</CardTitle>
            <CardDescription>Narrow down inventory logs by various criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search filter */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search products, admins..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-9"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Product filter */}
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason filter */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="All Reasons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reasons</SelectItem>
                    <SelectItem value="order">Order Placed</SelectItem>
                    <SelectItem value="manual">Manual Adjustment</SelectItem>
                    <SelectItem value="return">Order Return</SelectItem>
                    <SelectItem value="adjustment">Inventory Adjustment</SelectItem>
                    <SelectItem value="product_created">Product Created</SelectItem>
                    <SelectItem value="product_updated">Product Updated</SelectItem>
                    <SelectItem value="product_deleted">Product Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date range filter */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFromFilter ? format(dateFromFilter, "PPP") : "From Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dateFromFilter} onSelect={setDateFromFilter} initialFocus />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateToFilter ? format(dateToFilter, "PPP") : "To Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dateToFilter} onSelect={setDateToFilter} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={resetFilters} disabled={!isFilterApplied}>
                Reset Filters
              </Button>
              <Button onClick={applyFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  Showing {logs.length} of {totalLogs} logs
                </div>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Logs per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="hidden md:table-cell">Admin</TableHead>
                  <TableHead className="hidden lg:table-cell">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        Loading inventory logs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <h3 className="text-lg font-medium mb-2">No logs found</h3>
                      <p className="text-muted-foreground mb-4">
                        {isFilterApplied
                          ? "No logs match your filter criteria. Try adjusting your filters."
                          : "No inventory logs have been recorded yet."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const change = log.newQuantity - log.previousQuantity
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-medium">{new Date(log.timestamp).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>{log.productName || log.productId}</TableCell>
                        <TableCell
                          className={`text-right ${change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : ""}`}
                        >
                          {change > 0 ? `+${change}` : change}
                        </TableCell>
                        <TableCell>{getReasonBadge(log.reason)}</TableCell>
                        <TableCell className="hidden md:table-cell">{log.adminName || "System"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {log.details || (log.orderId ? `Order: ${log.orderId}` : "-")}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      />
                    </PaginationItem>

                    {/* First page */}
                    {currentPage > 2 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Ellipsis if needed */}
                    {currentPage > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Previous page if not first */}
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(currentPage - 1)}>
                          {currentPage - 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Current page */}
                    <PaginationItem>
                      <PaginationLink isActive>{currentPage}</PaginationLink>
                    </PaginationItem>

                    {/* Next page if not last */}
                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(currentPage + 1)}>
                          {currentPage + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Ellipsis if needed */}
                    {currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Last page if not current */}
                    {currentPage < totalPages - 1 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedAdminRoute>
  )
}

