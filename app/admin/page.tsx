"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/context/admin-auth-context"

export default function AdminPage() {
  const router = useRouter()
  const { isAuthenticated } = useAdminAuth()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin/orders")
    } else {
      router.push("/admin/login")
    }
  }, [isAuthenticated, router])

  return (
    <div className="container mx-auto py-10 px-4 text-center">
      <p>Redirecting...</p>
    </div>
  )
}

