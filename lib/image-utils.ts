/**
 * Utility functions for image handling
 */

/**
 * Generate an optimized image URL with width and height parameters
 * This uses Supabase Storage's image transformation capabilities
 *
 * @param url Original image URL
 * @param width Desired width
 * @param height Desired height
 * @returns Optimized image URL
 */
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
  
  /**
   * Generate a product card image URL
   *
   * @param url Original image URL
   * @returns Product card image URL
   */
  export function getProductCardImageUrl(url: string): string {
    return getOptimizedImageUrl(url, 400, 400)
  }
  
  /**
   * Generate a product detail image URL
   *
   * @param url Original image URL
   * @returns Product detail image URL
   */
  export function getProductDetailImageUrl(url: string): string {
    return getOptimizedImageUrl(url, 800, 800)
  }
  
  