"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, ShoppingBag, User, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { Logo } from "./logo"
import { PromoBanner } from "./promo-banner"
import type { PromoBanner as PromoBannerType } from "@/types/promo-banner"

const navigationItems = [
  {
    name: "MUJERES",
    href: "/collections/women",
    subcategories: [
      {
        name: "Ropa",
        items: [
          { name: "Camisetas", href: "/collections/women/t-shirts" },
          { name: "Sujetadores Deportivos", href: "/collections/women/sports-bras" },
          { name: "Leggings", href: "/collections/women/leggings" },
          { name: "Pantalones Cortos", href: "/collections/women/shorts" },
          { name: "Sudaderas con Capucha", href: "/collections/women/hoodies-sweatshirts" },
          { name: "Chaquetas", href: "/collections/women/jackets" },
        ],
      },
      {
        name: "Colecciones",
        items: [
          { name: "Nuevos Lanzamientos", href: "/collections/women/new-releases" },
          { name: "Más Vendidos", href: "/collections/women/bestsellers" },
          { name: "Esenciales", href: "/collections/women/essentials" },
          { name: "Sin Costuras", href: "/collections/women/seamless" },
        ],
      },
    ],
  },
  {
    name: "HOMBRES",
    href: "/collections/men",
    subcategories: [
      {
        name: "Ropa",
        items: [
          { name: "Camisetas", href: "/collections/men/t-shirts" },
          { name: "Sudaderas con Capucha", href: "/collections/men/hoodies-sweatshirts" },
          { name: "Pantalones Cortos", href: "/collections/men/shorts" },
          { name: "Pantalones de Jogging", href: "/collections/men/joggers" },
          { name: "Chaquetas", href: "/collections/men/jackets" },
          { name: "Camisetas sin Mangas", href: "/collections/men/tanks" },
        ],
      },
      {
        name: "Colecciones",
        items: [
          { name: "Nuevos Lanzamientos", href: "/collections/men/new-releases" },
          { name: "Más Vendidos", href: "/collections/men/bestsellers" },
          { name: "Esenciales", href: "/collections/men/essentials" },
        ],
      },
    ],
  },
  {
    name: "ACCESORIOS",
    href: "/collections/accessories",
    subcategories: [
      {
        name: "Categorías",
        items: [
          { name: "Bolsos", href: "/collections/accessories/bags" },
          { name: "Sombreros y Gorras", href: "/collections/accessories/hats-caps" },
          { name: "Botellas de Agua", href: "/collections/accessories/water-bottles" },
        ],
      },
    ],
  },
]

interface NavbarProps {
  banner: PromoBannerType | null
}

export function Navbar({ banner }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { items, totalItems } = useCart()
  const isMobile = useIsMobile()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close cart when navigating
  useEffect(() => {
    const handleRouteChange = () => {
      setCartOpen(false)
    }

    window.addEventListener("popstate", handleRouteChange)
    return () => {
      window.removeEventListener("popstate", handleRouteChange)
    }
  }, [])

  return (
    <>
      {/* Main header */}
      <header
        className="sticky top-0 left-0 right-0 z-50 bg-white"
        style={{
          boxShadow: isScrolled ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          transition: "box-shadow 0.3s",
        }}
      >
        {/* Promo banner */}
        <PromoBanner banner={banner} />

        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Logo />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:justify-center space-x-8">
              {navigationItems.map((item) => (
                <div key={item.name} className="relative group">
                  <Link href={item.href} className="text-sm font-medium text-gray-900 hover:text-black py-2">
                    {item.name}
                  </Link>

                  {/* Dropdown menu */}
                  <div className="absolute left-0 transform -translate-x-1/4 mt-2 w-screen max-w-5xl bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-8 p-8">
                      {item.subcategories.map((category) => (
                        <div key={category.name}>
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            {category.name}
                          </h3>
                          <ul className="space-y-4">
                            {category.items.map((subItem) => (
                              <li key={subItem.name}>
                                <Link href={subItem.href} className="text-sm text-gray-900 hover:text-black">
                                  {subItem.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Navigation */}
            <div className="flex items-center space-x-6">
              <button className="text-gray-900 hover:text-black hidden md:block">
                <Heart className="h-5 w-5" />
              </button>

              <Link href="/account" className="text-gray-900 hover:text-black hidden md:block">
                <User className="h-5 w-5" />
              </Link>

              <button className="relative text-gray-900 hover:text-black" onClick={() => setCartOpen(true)}>
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-900"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          <div className="flex flex-col h-full overflow-y-auto pb-12 pt-4 px-4">
            <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-gray-900">
                <Menu className="h-6 w-6" />
              </Button>
            </div>

            <div className="space-y-6">
              {navigationItems.map((item) => (
                <div key={item.name} className="py-2 border-b border-gray-200">
                  <Link
                    href={item.href}
                    className="text-base font-medium text-gray-900 block py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  <div className="mt-3 space-y-6 pl-4">
                    {item.subcategories.map((category) => (
                      <div key={category.name} className="space-y-3">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {category.name}
                        </h3>
                        <ul className="space-y-3">
                          {category.items.map((subItem) => (
                            <li key={subItem.name}>
                              <Link
                                href={subItem.href}
                                className="text-sm text-gray-900"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {subItem.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <Link
                  href="/account"
                  className="text-base font-medium text-gray-900 block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Cuenta
                </Link>
                <Link
                  href="/wishlist"
                  className="text-base font-medium text-gray-900 block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Lista de Deseos
                </Link>
                <Link
                  href="/help"
                  className="text-base font-medium text-gray-900 block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ayuda
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
