"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/context/admin-auth-context"
import { Loader2 } from "lucide-react"

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <p>Please log in to access this page.</p>
      </div>
    )
  }

  return <>{children}</>
}

