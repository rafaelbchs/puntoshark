"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { PRODUCTS_CACHE_TAG } from "@/lib/constants"

export function RevalidateButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleRevalidate = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag: PRODUCTS_CACHE_TAG }),
      })

      if (response.ok) {
        toast({
          title: "Cache Revalidated",
          description: "The product cache has been refreshed.",
        })
      } else {
        throw new Error("Failed to revalidate")
      }
    } catch (error) {
      console.error("Revalidation error:", error)
      toast({
        title: "Revalidation Failed",
        description: "Could not refresh the cache. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRevalidate}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Refreshing..." : "Refresh Cache"}
    </Button>
  )
}

