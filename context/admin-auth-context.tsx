"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { adminLogin, adminLogout, verifyAdminToken } from "@/app/actions/auth"

type AdminUser = {
  id: string
  username: string
  role: string
}

type AdminAuthContextType = {
  isAuthenticated: boolean
  user: AdminUser | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if admin is already logged in on initial load
  useEffect(() => {
    async function checkAuth() {
      try {
        const result = await verifyAdminToken()
        if (result.success && result.admin) {
          setIsAuthenticated(true)
          setUser(result.admin)
        }
      } catch (error) {
        console.error("Auth verification error:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await adminLogin(username, password)
      if (result.success && result.admin) {
        setIsAuthenticated(true)
        setUser(result.admin)
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await adminLogout()
      setIsAuthenticated(false)
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }
  return context
}

