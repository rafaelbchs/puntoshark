import { getServiceSupabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = getServiceSupabase()

    const { data, error } = await supabase.from("products").select("*")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products: data, count: data.length })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

