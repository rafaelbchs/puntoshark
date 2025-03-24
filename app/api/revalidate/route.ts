import { type NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { PRODUCTS_CACHE_TAG } from "@/lib/constants"
import { verifyAdminToken } from "@/app/actions/auth"

// This endpoint allows for on-demand revalidation
export async function POST(request: NextRequest) {
  try {
    // Verify that the request is authenticated
    const { success } = await verifyAdminToken()

    if (!success) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get the tag to revalidate from the request
    const { tag = PRODUCTS_CACHE_TAG } = await request.json()

    // Revalidate the tag
    revalidateTag(tag)

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      cache: tag,
    })
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json({ success: false, message: "Error revalidating" }, { status: 500 })
  }
}

