import type React from "react"
import { getPromoBannerSettings } from "@/app/actions/settings"
import { Navbar } from "@/components/layout/navbar"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch promo banner settings
  const promoBanner = await getPromoBannerSettings()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar banner={promoBanner} />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Your Store. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

