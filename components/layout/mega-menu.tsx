"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, ShoppingBag, User, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { CartDrawer } from "@/components/cart/cart-drawer"

const navigationItems = [
  {
    name: "WOMEN",
    href: "/collections/women",
    subcategories: [
      {
        name: "Clothing",
        items: [
          { name: "T-Shirts", href: "/collections/women/t-shirts" },
          { name: "Sports Bras", href: "/collections/women/sports-bras" },
          { name: "Leggings", href: "/collections/women/leggings" },
          { name: "Shorts", href: "/collections/women/shorts" },
          { name: "Hoodies & Sweatshirts", href: "/collections/women/hoodies-sweatshirts" },
          { name: "Jackets", href: "/collections/women/jackets" },
        ],
      },
      {
        name: "Collections",
        items: [
          { name: "New Releases", href: "/collections/women/new-releases" },
          { name: "Bestsellers", href: "/collections/women/bestsellers" },
          { name: "Essentials", href: "/collections/women/essentials" },
          { name: "Seamless", href: "/collections/women/seamless" },
        ],
      },
    ],
  },
  {
    name: "MEN",
    href: "/collections/men",
    subcategories: [
      {
        name: "Clothing",
        items: [
          { name: "T-Shirts", href: "/collections/men/t-shirts" },
          { name: "Hoodies & Sweatshirts", href: "/collections/men/hoodies-sweatshirts" },
          { name: "Shorts", href: "/collections/men/shorts" },
          { name: "Joggers", href: "/collections/men/joggers" },
          { name: "Jackets", href: "/collections/men/jackets" },
          { name: "Tanks", href: "/collections/men/tanks" },
        ],
      },
      {
        name: "Collections",
        items: [
          { name: "New Releases", href: "/collections/men/new-releases" },
          { name: "Bestsellers", href: "/collections/men/bestsellers" },
          { name: "Essentials", href: "/collections/men/essentials" },
        ],
      },
    ],
  },
  {
    name: "ACCESSORIES",
    href: "/collections/accessories",
    subcategories: [
      {
        name: "Categories",
        items: [
          { name: "Bags", href: "/collections/accessories/bags" },
          { name: "Hats & Caps", href: "/collections/accessories/hats-caps" },
          { name: "Water Bottles", href: "/collections/accessories/water-bottles" },
        ],
      },
    ],
  },
]

export function Navbar() {
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
        className={`sticky top-0 left-0 right-0 z-50 ${isScrolled ? "bg-white shadow-sm" : "bg-white"}`}
        style={{ transition: "box-shadow 0.3s, background-color 0.3s" }}
      >
        {/* Promo banner */}
        <div className="bg-black text-white text-center py-2 text-sm font-medium">
          GET TWO PAIRS OF ARRIVAL SHORTS FOR $40 🔥
        </div>

        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <div
                  style={{
                    color: "#000000",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    lineHeight: "1.75rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    transition: "none",
                  }}
                >
                  PUNTOSHARK
                </div>
              </Link>
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
              <Link href="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                <div
                  style={{
                    color: "#000000",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    lineHeight: "1.75rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    transition: "none",
                  }}
                >
                  PUNTOSHARK
                </div>
              </Link>
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
                  Account
                </Link>
                <Link
                  href="/wishlist"
                  className="text-base font-medium text-gray-900 block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Wishlist
                </Link>
                <Link
                  href="/help"
                  className="text-base font-medium text-gray-900 block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Help
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

