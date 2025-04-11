"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"

export function Logo() {
  const logoRef = useRef<HTMLDivElement>(null)

  // Force the color to stay black after component mounts
  useEffect(() => {
    if (logoRef.current) {
      // Initial set
      logoRef.current.style.color = "#000000"

      // Set up a MutationObserver to watch for style changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "style" || mutation.attributeName === "class") {
            logoRef.current!.style.color = "#000000"
          }
        })
      })

      observer.observe(logoRef.current, {
        attributes: true,
        attributeFilter: ["style", "class"],
      })

      return () => observer.disconnect()
    }
  }, [])

  return (
    <Link href="/" className="flex items-center">
      <div
        ref={logoRef}
        style={{
          color: "#000000",
          fontWeight: 700,
          fontSize: "1.25rem",
          lineHeight: "1.75rem",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          transition: "none",
          WebkitTransition: "none",
          MozTransition: "none",
          OTransition: "none",
          msTransition: "none",
        }}
      >
        PUNTOSHARK
      </div>
    </Link>
  )
}
