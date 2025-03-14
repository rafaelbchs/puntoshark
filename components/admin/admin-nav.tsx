"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAdminAuth } from "@/context/admin-auth-context"
import { ShoppingBag, Package, BarChart3, Settings, Users, LogOut } from "lucide-react"

export function AdminNav() {
  const pathname = usePathname()
  const { logout } = useAdminAuth()

  const routes = [
    {
      href: "/admin/orders",
      label: "Orders",
      icon: ShoppingBag,
      active: pathname === "/admin/orders" || pathname?.startsWith("/admin/orders/"),
    },
    {
      href: "/admin/products",
      label: "Products",
      icon: Package,
      active: pathname === "/admin/products" || pathname?.startsWith("/admin/products/"),
    },
    {
      href: "/admin/inventory",
      label: "Inventory",
      icon: BarChart3,
      active: pathname === "/admin/inventory",
    },
    {
      href: "/admin/customers",
      label: "Customers",
      icon: Users,
      active: pathname === "/admin/customers",
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
      active: pathname === "/admin/settings",
    },
  ]

  return (
    <nav className="flex flex-col gap-2 p-4">
      {routes.map((route) => (
        <Link key={route.href} href={route.href} passHref>
          <Button
            variant={route.active ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-2",
              route.active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <route.icon className="h-4 w-4" />
            {route.label}
          </Button>
        </Link>
      ))}
      <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground mt-auto" onClick={logout}>
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </nav>
  )
}

