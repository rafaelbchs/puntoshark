"use client"

import type React from "react"

import { AdminAuthProvider } from "@/context/admin-auth-context"
import { AdminNav } from "@/components/admin/admin-nav"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <div className="flex min-h-screen">
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-background">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
              <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <AdminNav />
            </div>
          </div>
        </div>
        <div className="md:pl-64 flex flex-col flex-1">
          <div className="md:hidden border-b">
            <div className="flex items-center justify-between h-16 px-4">
              <h1 className="text-lg font-semibold">Admin Dashboard</h1>
              {/* Mobile menu button would go here */}
            </div>
          </div>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </AdminAuthProvider>
  )
}

