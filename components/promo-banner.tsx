"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import type { PromoBanner as PromoBannerType } from "@/types/promo-banner"

interface PromoBannerProps {
  banner: PromoBannerType | null
}

export function PromoBanner({ banner }: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if banner exists and if it was dismissed
    if (banner) {
      const dismissedBanner = localStorage.getItem("dismissedBanner")
      const dismissedTimestamp = dismissedBanner ? Number.parseInt(dismissedBanner) : 0
      const currentTime = new Date().getTime()

      // Show banner if it wasn't dismissed in the last 24 hours
      if (currentTime - dismissedTimestamp > 24 * 60 * 60 * 1000) {
        setIsVisible(true)
      }
    }
  }, [banner])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem("dismissedBanner", new Date().getTime().toString())
  }

  if (!banner || !isVisible) {
    return null
  }

  const bannerContent = (
    <div className="flex items-center justify-center text-center px-4 py-2 text-sm font-medium">{banner.text}</div>
  )

  return (
    <div
      className="relative w-full"
      style={{
        backgroundColor: banner.bgColor,
        color: banner.textColor,
      }}
    >
      {banner.link ? (
        <Link href={banner.link} className="block">
          {bannerContent}
        </Link>
      ) : (
        bannerContent
      )}

      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-black/10"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" style={{ color: banner.textColor }} />
      </button>
    </div>
  )
}
