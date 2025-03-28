"use client"

import { useState, useEffect } from "react"

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Set initial value
    checkIsMobile()

    // Subscribe to window resize events
    window.addEventListener("resize", checkIsMobile)

    // Unsubscribe on cleanup
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [breakpoint])

  return isMobile
}

