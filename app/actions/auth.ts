"use server"

import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Secret key for JWT
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_key_for_development_only")

// Admin login
export async function adminLogin(username: string, password: string) {
  try {
    // Find admin by username
    const admin = await prisma.admin.findUnique({
      where: { username },
    })

    if (!admin) {
      return { success: false, error: "Invalid credentials" }
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, admin.passwordHash)

    if (!passwordMatch) {
      return { success: false, error: "Invalid credentials" }
    }

    // Create JWT token
    const token = await new SignJWT({
      id: admin.id,
      username: admin.username,
      role: admin.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET)

    // Set cookie
    cookies().set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    return {
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "An error occurred during login" }
  }
}

// Admin logout
export async function adminLogout() {
  cookies().delete("admin_token")
  return { success: true }
}

// Verify admin token
export async function verifyAdminToken() {
  try {
    const token = cookies().get("admin_token")?.value

    if (!token) {
      return { success: false, error: "No token found" }
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    return {
      success: true,
      admin: {
        id: payload.id as string,
        username: payload.username as string,
        role: payload.role as string,
      },
    }
  } catch (error) {
    console.error("Token verification error:", error)
    return { success: false, error: "Invalid token" }
  }
}

// Create admin (for initial setup)
export async function createAdmin(username: string, password: string, name?: string, email?: string) {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username },
    })

    if (existingAdmin) {
      return { success: false, error: "Username already exists" }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        username,
        passwordHash,
        name,
        email,
        role: "admin",
      },
    })

    return {
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    }
  } catch (error) {
    console.error("Create admin error:", error)
    return { success: false, error: "Failed to create admin" }
  }
}

