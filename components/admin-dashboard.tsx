"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import InventoryManager from "@/components/inventory-manager"
import OrdersManager from "@/components/orders-manager"

export default function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="inventory">
        <TabsList className="mb-8">
          <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
          <TabsTrigger value="orders">Customer Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <InventoryManager />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

