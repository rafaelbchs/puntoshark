import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"

// This is a placeholder component for when you don't have products yet
function EmptyState({ gender }: { gender: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10 text-muted-foreground"
        >
          <path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
          <path d="M16 19h6" />
          <path d="M19 16v6" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">No products yet</h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        We're working on adding {gender === "men" ? "men's" : gender === "women" ? "women's" : ""} products to our
        collection. Check back soon!
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Return to Home
      </Link>
    </div>
  )
}

export default function GenderPage({
  params,
}: {
  params: { gender: string }
}) {
  const { gender } = params

  // Validate the gender
  const validGenders = ["men", "women", "accessories"]
  if (!validGenders.includes(gender)) {
    return notFound()
  }

  // Format the gender for display
  const formattedGender = gender.charAt(0).toUpperCase() + gender.slice(1)

  // Get the appropriate categories based on gender
  const categories =
    gender === "accessories"
      ? [
          { name: "Bags", href: `/collections/${gender}/bags`, image: "/placeholder.svg?height=400&width=300" },
          {
            name: "Hats & Caps",
            href: `/collections/${gender}/hats-caps`,
            image: "/placeholder.svg?height=400&width=300",
          },
          {
            name: "Water Bottles",
            href: `/collections/${gender}/water-bottles`,
            image: "/placeholder.svg?height=400&width=300",
          },
        ]
      : [
          { name: "T-Shirts", href: `/collections/${gender}/t-shirts`, image: "/placeholder.svg?height=400&width=300" },
          {
            name: gender === "men" ? "Shorts" : "Leggings",
            href: `/collections/${gender}/${gender === "men" ? "shorts" : "leggings"}`,
            image: "/placeholder.svg?height=400&width=300",
          },
          { name: "Hoodies", href: `/collections/${gender}/hoodies`, image: "/placeholder.svg?height=400&width=300" },
          {
            name: gender === "men" ? "Joggers" : "Sports Bras",
            href: `/collections/${gender}/${gender === "men" ? "joggers" : "sports-bras"}`,
            image: "/placeholder.svg?height=400&width=300",
          },
        ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="pt-24 pb-6 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex items-center text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
            <span className="font-medium text-foreground">{formattedGender}</span>
          </div>

          <h1 className="text-3xl font-bold mt-4">{formattedGender}'s Collection</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-8">Categories</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link key={category.name} href={category.href} className="group">
              <div className="aspect-h-4 aspect-w-3 overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  width={300}
                  height={400}
                  className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-base font-medium text-foreground">{category.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  Shop Now
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16">
          <EmptyState gender={gender} />
        </div>
      </div>
    </div>
  )
}

