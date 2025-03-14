import { type NextRequest, NextResponse } from "next/server"
import { adminLogin, adminLogout, verifyAdminToken } from "@/app/actions/auth"

// Replace the NextAuth route with our custom JWT auth endpoints
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const result = await adminLogin(username, password)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Authentication failed" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: result.admin,
    })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await adminLogout()

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await verifyAdminToken()

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: result.admin,
    })
  } catch (error) {
    console.error("Auth verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

