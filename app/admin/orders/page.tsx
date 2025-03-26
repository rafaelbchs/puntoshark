"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getOrders, updateOrderStatus } from "@/app/actions/checkout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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
import ProtectedAdminRoute from "@/components/protected-admin-route"
import { useAdminAuth } from "@/context/admin-auth-context"
import { LogOut, Search, AlertTriangle, Filter } from "lucide-react"
import type { Order } from "@/types/checkout"
import { toast } from "@/components/ui/use-toast"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<Order["status"] | null>(null)
  const [inventoryImpact, setInventoryImpact] = useState<{
    type: "increase" | "decrease" | "none"
    message: string
  }>({ type: "none", message: "" })
  const { logout } = useAdminAuth()
  // Add a loading state for status changes
  const [changingOrderId, setChangingOrderId] = useState<string | null>(null)

  const ordersPerPage = 10

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    // Apply filters and search
    let result = [...orders]

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.customerInfo.name.toLowerCase().includes(query) ||
          order.customerInfo.email.toLowerCase().includes(query) ||
          order.customerInfo.cedula?.toLowerCase().includes(query),
      )
    }

    setFilteredOrders(result)
    setTotalPages(Math.ceil(result.length / ordersPerPage))
    setCurrentPage(1) // Reset to first page when filters change
  }, [orders, statusFilter, searchQuery])

  async function fetchOrders() {
    try {
      const ordersData = await getOrders()
      setOrders(ordersData || [])
      setFilteredOrders(ordersData || [])
      setTotalPages(Math.ceil((ordersData?.length || 0) / ordersPerPage))
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate inventory impact when changing order status
  const calculateInventoryImpact = (currentStatus: string, newStatus: string) => {
    // No inventory impact if order is not managed by inventory
    if (!["processing", "completed"].includes(newStatus)) {
      return { type: "none", message: "No inventory changes will occur." }
    }

    // Inventory decrease scenarios
    if (
      (currentStatus === "pending" && (newStatus === "processing" || newStatus === "completed")) ||
      (currentStatus === "processing" && newStatus === "completed")
    ) {
      return {
        type: "decrease",
        message: "This will decrease inventory levels for the ordered products.",
      }
    }

    // Inventory increase scenarios (cancellations or returns)
    if (
      ((currentStatus === "processing" || currentStatus === "completed") && newStatus === "cancelled") ||
      (currentStatus === "completed" && newStatus === "processing")
    ) {
      return {
        type: "increase",
        message: "This will increase inventory levels by returning items to stock.",
      }
    }

    return { type: "none", message: "No inventory changes will occur." }
  }

  // Update the handleStatusChange function to include loading state
  async function handleStatusChange(orderId: string, currentStatus: string, newStatus: Order["status"]) {
    if (changingOrderId) return // Prevent multiple simultaneous status changes

    // Calculate inventory impact
    const impact = calculateInventoryImpact(currentStatus, newStatus)
    setInventoryImpact(impact)
    setSelectedOrderId(orderId)
    setPendingStatus(newStatus)

    // Show confirmation dialog if there's inventory impact
    if (impact.type !== "none") {
      setShowStatusConfirmation(true)
    } else {
      // No inventory impact, proceed directly
      confirmStatusChange(orderId, newStatus)
    }
  }

  // Update the confirmStatusChange function to include loading state
  async function confirmStatusChange(orderId: string, status: Order["status"]) {
    setChangingOrderId(orderId)
    try {
      const result = await updateOrderStatus(orderId, status)
      if (result.success) {
        // Update local state
        setOrders(orders.map((order) => (order.id === orderId ? { ...order, status } : order)))
        setShowStatusConfirmation(false)
        setPendingStatus(null)
        setSelectedOrderId(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update order status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setChangingOrderId(null)
    }
  }

  // Get current page of orders
  const getCurrentPageOrders = () => {
    const startIndex = (currentPage - 1) * ordersPerPage
    const endIndex = startIndex + ordersPerPage
    return filteredOrders.slice(startIndex, endIndex)
  }

  // Generate pagination items
  const getPaginationItems = () => {
    const items = []

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink isActive={currentPage === 1} onClick={() => setCurrentPage(1)}>
          1
        </PaginationLink>
      </PaginationItem>,
    )

    // Show ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i <= 1 || i >= totalPages) continue // Skip first and last page as they're always shown
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={currentPage === i} onClick={() => setCurrentPage(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink isActive={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
            {totalPages}
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
          <h1 className="text-3xl font-bold">Admin: Orders</h1>
          <Button variant="outline" onClick={logout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
            <CardDescription>View and manage customer orders</CardDescription>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, customer name, email..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading orders...</p>
            ) : filteredOrders.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {searchQuery || statusFilter !== "all" ? "No orders match your search criteria" : "No orders found"}
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPageOrders().map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div>
                            <p>{order.customerInfo.name}</p>
                            <p className="text-sm text-muted-foreground">{order.customerInfo.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>${order.total.toFixed(2)}</TableCell>
                        {/* Update the Select component in the TableCell to disable it for completed/cancelled orders */}
                        <TableCell>
                          {order.status === "completed" || order.status === "cancelled" ? (
                            <div className="flex items-center h-10 w-[130px] px-3 py-2 border rounded-md bg-muted">
                              <span className="text-sm">
                                {order.status === "completed" ? "Completed" : "Cancelled"}
                              </span>
                            </div>
                          ) : (
                            <Select
                              value={order.status}
                              onValueChange={(value) =>
                                handleStatusChange(order.id, order.status, value as Order["status"])
                              }
                              disabled={changingOrderId === order.id}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Status">
                                  {changingOrderId === order.id ? (
                                    <div className="flex items-center gap-2">
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                      <span>Updating...</span>
                                    </div>
                                  ) : (
                                    order.status
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {/* Only show Pending option if current status is Pending */}
                                {order.status === "pending" && <SelectItem value="pending">Pending</SelectItem>}
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/orders/${order.id}`} passHref>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>

                      {getPaginationItems()}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Status change confirmation dialog */}
        <AlertDialog open={showStatusConfirmation} onOpenChange={setShowStatusConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to change the order status?
                <div
                  className={`mt-4 p-3 rounded-md ${
                    inventoryImpact.type === "decrease"
                      ? "bg-red-50 text-red-800"
                      : inventoryImpact.type === "increase"
                        ? "bg-green-50 text-green-800"
                        : "bg-blue-50 text-blue-800"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                  <span className="font-medium">Inventory Impact:</span> {inventoryImpact.message}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedOrderId && pendingStatus && confirmStatusChange(selectedOrderId, pendingStatus)}
                className={
                  inventoryImpact.type === "decrease"
                    ? "bg-red-600 hover:bg-red-700"
                    : inventoryImpact.type === "increase"
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                }
              >
                Confirm Change
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedAdminRoute>
  )
}

