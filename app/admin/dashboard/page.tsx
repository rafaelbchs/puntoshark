"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { verifyAdminToken } from "@/app/actions/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const result = await verifyAdminToken()

        if (result.success) {
          setAdmin(result.admin)
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage your store products</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/products")} className="w-full">
              View Products
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>View and manage customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/orders")} className="w-full">
              View Orders
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>Manage product inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/inventory")} className="w-full">
              Manage Inventory
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

