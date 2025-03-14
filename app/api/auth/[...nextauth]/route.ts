// This file is being replaced by app/api/auth/route.ts
// We'll create a placeholder that redirects to the new auth endpoint

import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/api/auth", request.url))
}

export async function POST(request: NextRequest) {
  return NextResponse.redirect(new URL("/api/auth", request.url))
}

