export function getProductCardImageUrl(url: string): string {
  if (!url) return "/placeholder.svg?height=400&width=400"

  // Skip blob URLs
  if (url.startsWith("blob:")) {
    return "/placeholder.svg?height=400&width=400"
  }

  // Return valid URLs
  return url
}

/**
 * Gets a properly formatted URL for product detail images
 * Handles blob URLs, Supabase URLs, and fallbacks
 */
export function getProductDetailImageUrl(url: string): string {
  if (!url) return "/placeholder.svg?height=800&width=800"

  // Skip blob URLs
  if (url.startsWith("blob:")) {
    return "/placeholder.svg?height=800&width=800"
  }

  // Return valid URLs
  return url
}

export function getOptimizedImageUrl(url: string, width?: number, height?: number): string {
  // If it's not a Supabase Storage URL, return the original URL
  if (!url || !url.includes("supabase")) {
    return url || "/placeholder.svg"
  }

  // Parse the URL
  try {
    const parsedUrl = new URL(url)

    // Add width and height parameters if provided
    if (width) {
      parsedUrl.searchParams.set("width", width.toString())
    }

    if (height) {
      parsedUrl.searchParams.set("height", height.toString())
    }

    // Return the optimized URL
    return parsedUrl.toString()
  } catch (error) {
    console.error("Error parsing image URL:", error)
    return url
  }
}

/**
 * Generate a thumbnail URL
 *
 * @param url Original image URL
 * @returns Thumbnail URL
 */
export function getThumbnailUrl(url: string): string {
  return getOptimizedImageUrl(url, 200, 200)
}
