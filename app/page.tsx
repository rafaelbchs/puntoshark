"use client"

import { ProductCard } from "@/components/product-card"
import { Navbar } from "@/components/navbar"

// Demo products
const products = [
  {
    id: "1",
    name: "Premium T-Shirt",
    price: 29.99,
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "2",
    name: "Designer Jeans",
    price: 79.99,
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "3",
    name: "Casual Sneakers",
    price: 59.99,
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "4",
    name: "Leather Wallet",
    price: 49.99,
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "5",
    name: "Wireless Headphones",
    price: 129.99,
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "6",
    name: "Smart Watch",
    price: 199.99,
    image: "/placeholder.svg?height=200&width=200",
  },
]

export default function Home() {
  return (
    <div>
      <Navbar />
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Featured Products</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

