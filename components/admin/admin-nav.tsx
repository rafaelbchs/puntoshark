"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAdminAuth } from "@/context/admin-auth-context"
import { ShoppingBag, Package, BarChart3, Settings, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function AdminNav() {
  const pathname = usePathname()
  const { logout } = useAdminAuth()
  const [open, setOpen] = useState(false)

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
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
      active: pathname === "/admin/settings",
    },
  ]

  // Mobile navigation using Sheet component
  const MobileNav = () => (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px]">
        <div className="flex flex-col gap-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Admin Dashboard</h2>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex flex-col gap-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  route.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            ))}
            <Button
              variant="ghost"
              className="mt-auto justify-start gap-2 text-muted-foreground"
              onClick={() => {
                setOpen(false)
                logout()
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )

  // Desktop navigation
  return (
    <>
      <MobileNav />
      <nav className="hidden md:flex md:flex-col gap-2 p-4">
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
    </>
  )
}

