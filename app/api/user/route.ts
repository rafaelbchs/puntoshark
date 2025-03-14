import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/app/actions/auth"

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { success, admin, error } = await verifyAdminToken()

    if (!success || !admin) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Return user info
    return NextResponse.json({
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error("Error in user API:", error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}

