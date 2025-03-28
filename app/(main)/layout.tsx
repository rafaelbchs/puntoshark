import type React from "react"
import { getServiceSupabase } from "@/lib/supabase"
import { Navbar } from "@/components/layout/navbar"

// Disable all caching
export const revalidate = 0
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Direct database query to get the banner data
  const supabase = getServiceSupabase()
  let banner = null

  try {
    console.log("Layout: Fetching banner data from settings table")
    const { data, error } = await supabase.from("settings").select("value").eq("id", "promoBanner").single()

    if (error) {
      console.error("Layout: Error fetching banner:", error)
    } else if (data && data.value) {
      banner = data.value
      console.log("Layout: Banner data fetched:", banner)
    } else {
      console.log("Layout: No banner data found or banner is disabled")
    }
  } catch (error) {
    console.error("Layout: Exception fetching banner:", error)
  }

  return (
    <>
      <Navbar banner={banner} />
      <main>{children}</main>
    </>
  )
}

