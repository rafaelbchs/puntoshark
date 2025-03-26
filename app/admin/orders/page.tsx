import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import ProtectedAdminRoute from "@/components/protected-admin-route"
import OrdersManager from "@/components/orders-manager"

export default function AdminOrdersPage() {
  return (
    <ProtectedAdminRoute>
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Pedidos</h1>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="processing">Procesando</TabsTrigger>
            <TabsTrigger value="completed">Completados</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Todos los Pedidos</CardTitle>
                <CardDescription>Visualiza y gestiona todos los pedidos realizados en la tienda.</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<OrdersManagerSkeleton />}>
                  <OrdersManager filter="all" />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Pendientes</CardTitle>
                <CardDescription>Pedidos que están pendientes de procesamiento.</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<OrdersManagerSkeleton />}>
                  <OrdersManager filter="pending" />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="processing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos en Procesamiento</CardTitle>
                <CardDescription>Pedidos que están siendo procesados actualmente.</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<OrdersManagerSkeleton />}>
                  <OrdersManager filter="processing" />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Completados</CardTitle>
                <CardDescription>Pedidos que han sido entregados y completados.</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<OrdersManagerSkeleton />}>
                  <OrdersManager filter="completed" />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="cancelled" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Cancelados</CardTitle>
                <CardDescription>Pedidos que han sido cancelados.</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<OrdersManagerSkeleton />}>
                  <OrdersManager filter="cancelled" />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedAdminRoute>
  )
}

function OrdersManagerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[250px]" />
        </div>
        <Skeleton className="h-9 w-[100px]" />
      </div>
      <div className="rounded-md border">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
          </div>
        </div>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="border-t p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Array(5)
                  .fill(0)
                  .map((_, j) => (
                    <Skeleton key={j} className="h-8" />
                  ))}
              </div>
            </div>
          ))}
      </div>
      <div className="flex items-center justify-end gap-2">
        <Skeleton className="h-9 w-[100px]" />
        <Skeleton className="h-9 w-[100px]" />
      </div>
    </div>
  )
}

