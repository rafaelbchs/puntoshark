import Link from "next/link"
import { CartDropdown } from "./cart-dropdown"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          ShopName
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:underline">
            Home
          </Link>
          <Link href="/products" className="text-sm font-medium hover:underline">
            Products
          </Link>
          <Link href="/about" className="text-sm font-medium hover:underline">
            About
          </Link>
          <Link href="/contact" className="text-sm font-medium hover:underline">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <CartDropdown />
          <Button variant="outline" size="sm" className="hidden md:inline-flex">
            Sign In
          </Button>
        </div>
      </div>
    </header>
  )
}

