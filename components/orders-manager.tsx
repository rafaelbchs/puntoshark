"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getOrders } from "@/app/actions/checkout"
import type { Order } from "@/types/checkout"

interface OrdersManagerProps {
  filter?: "all" | "pending" | "processing" | "completed" | "cancelled"
}

export default function OrdersManager({ filter = "all" }: OrdersManagerProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<"date" | "total" | "status">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true)
        const allOrders = await getOrders()
        setOrders(allOrders || [])
      } catch (error) {
        console.error("Failed to load orders:", error)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  // Filter orders based on the selected tab
  const filteredOrders = orders.filter((order) => {
    // Apply status filter
    if (filter !== "all" && order.status !== filter) {
      return false
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        order.id.toLowerCase().includes(searchLower) ||
        order.customerInfo.name.toLowerCase().includes(searchLower) ||
        order.customerInfo.email.toLowerCase().includes(searchLower) ||
        order.customerInfo.cedula?.toLowerCase().includes(searchLower) ||
        order.customerInfo.phone?.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortField === "date") {
      return sortDirection === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else if (sortField === "total") {
      return sortDirection === "asc" ? a.total - b.total : b.total - a.total
    } else if (sortField === "status") {
      const statusOrder = { pending: 0, processing: 1, completed: 2, cancelled: 3 }
      return sortDirection === "asc"
        ? statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
        : statusOrder[b.status as keyof typeof statusOrder] - statusOrder[a.status as keyof typeof statusOrder]
    }
    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: "date" | "total" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number.parseInt(value))
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  // Helper function to translate status to Spanish and get badge color
  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pendiente
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Procesando
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Completado
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Format date to local string
  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="ml-2">Cargando pedidos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por ID, nombre, email..."
            className="pl-8 w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Pedidos por página" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 por página</SelectItem>
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="20">20 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium">No hay pedidos</h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm
              ? "No se encontraron pedidos que coincidan con tu búsqueda."
              : "No hay pedidos disponibles en esta categoría."}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-5 p-4 bg-muted/50">
              <div className="font-medium">ID del Pedido</div>
              <div className="font-medium">Cliente</div>
              <div className="font-medium hidden md:block">Productos</div>
              <div className="font-medium flex items-center cursor-pointer" onClick={() => handleSort("total")}>
                Total
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </div>
              <div className="font-medium flex items-center cursor-pointer" onClick={() => handleSort("date")}>
                Fecha
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </div>
            </div>

            {paginatedOrders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-1 md:grid-cols-5 p-4 border-t hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/admin/orders/${order.id}`)}
              >
                <div className="flex flex-col">
                  <span className="font-mono text-sm">{order.id}</span>
                  <span className="md:hidden mt-1">{getStatusBadge(order.status)}</span>
                </div>
                <div className="flex flex-col">
                  <span>{order.customerInfo.name}</span>
                  <span className="text-sm text-muted-foreground">{order.customerInfo.email}</span>
                </div>
                <div className="hidden md:flex items-center">
                  <span>{order.items.length} productos</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">${order.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span>{formatDate(order.createdAt)}</span>
                    <span className="hidden md:inline-block mt-1">{getStatusBadge(order.status)}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedOrders.length)} de{" "}
                {sortedOrders.length} pedidos
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageToShow
                  if (totalPages <= 5) {
                    pageToShow = i + 1
                  } else if (currentPage <= 3) {
                    pageToShow = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageToShow = totalPages - 4 + i
                  } else {
                    pageToShow = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={i}
                      variant={currentPage === pageToShow ? "default" : "outline"}
                      size="icon"
                      onClick={() => handlePageChange(pageToShow)}
                      className="hidden sm:inline-flex"
                    >
                      {pageToShow}
                    </Button>
                  )
                })}
                <span className="sm:hidden text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

