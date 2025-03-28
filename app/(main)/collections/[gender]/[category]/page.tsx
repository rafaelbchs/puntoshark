import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

// This is a placeholder component for when you don't have products yet
function EmptyState({ category, gender }: { category: string; gender: string }) {
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
        We're working on adding {gender === "men" ? "men's" : gender === "women" ? "women's" : ""} {category} to our
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

export default function CategoryPage({
  params,
}: {
  params: { gender: string; category: string }
}) {
  const { gender, category } = params

  // Validate the gender and category
  const validGenders = ["men", "women", "accessories"]
  if (!validGenders.includes(gender)) {
    return notFound()
  }

  // Format the category and gender for display
  const formattedCategory = category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  const formattedGender = gender.charAt(0).toUpperCase() + gender.slice(1)

  return (
    <div className="min-h-screen flex flex-col">
      <div className="pt-24 pb-6 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex items-center text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
            <Link href={`/collections/${gender}`} className="text-muted-foreground hover:text-foreground">
              {formattedGender}
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
            <span className="font-medium text-foreground">{formattedCategory}</span>
          </div>

          <h1 className="text-3xl font-bold mt-4">
            {formattedGender}'s {formattedCategory}
          </h1>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8">
        {/* This is where you'll map through your actual products once you have them */}
        <EmptyState category={formattedCategory.toLowerCase()} gender={gender} />
      </div>
    </div>
  )
}

