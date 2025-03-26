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
      <div className="flex min-h-screen flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 md:hidden">
          <AdminNav />
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        </header>

        {/* Desktop sidebar and main content */}
        <div className="flex flex-1 flex-col md:flex-row">
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
          <main className="flex-1 md:pl-64">{children}</main>
        </div>
      </div>
    </AdminAuthProvider>
  )
}

