import Link from "next/link"
import Image from "next/image"

export default function CollectionsPage() {
  const collections = [
    {
      name: "Men's Collection",
      description: "Explore our latest men's fashion",
      image: "/placeholder.svg?height=600&width=800",
      href: "/collections/men",
    },
    {
      name: "Women's Collection",
      description: "Discover stylish women's clothing",
      image: "/placeholder.svg?height=600&width=800",
      href: "/collections/women",
    },
    {
      name: "Accessories",
      description: "Complete your look with our accessories",
      image: "/placeholder.svg?height=600&width=800",
      href: "/collections/accessories",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pt-24">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Collections</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Link
                key={collection.name}
                href={collection.href}
                className="group overflow-hidden rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                  <Image
                    src={collection.image || "/placeholder.svg"}
                    alt={collection.name}
                    width={800}
                    height={600}
                    className="h-full w-full object-cover object-center transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-medium">{collection.name}</h3>
                  <p className="mt-1 text-muted-foreground">{collection.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

