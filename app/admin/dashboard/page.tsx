"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { verifyAdminToken } from "@/app/actions/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ShoppingBag, Package, BarChart3, Settings } from "lucide-react"

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

  const dashboardItems = [
    {
      title: "Orders",
      description: "View and manage customer orders",
      icon: ShoppingBag,
      href: "/admin/orders",
    },
    {
      title: "Products",
      description: "Manage your store products",
      icon: Package,
      href: "/admin/products",
    },
    {
      title: "Inventory",
      description: "Manage product inventory",
      icon: BarChart3,
      href: "/admin/inventory",
    },
    {
      title: "Settings",
      description: "Configure store settings",
      icon: Settings,
      href: "/admin/settings",
    },
  ]

  return (
    <div className="container mx-auto py-6 px-4 md:py-8">
      <h1 className="text-2xl font-bold mb-6 md:text-3xl md:mb-8">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dashboardItems.map((item) => (
          <Card key={item.title} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <item.icon className="h-5 w-5 text-primary" />
                {item.title}
              </CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(item.href)} className="w-full">
                View {item.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

