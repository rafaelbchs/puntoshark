import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Get cart from cookies
export async function GET(request: NextRequest) {
  try {
    const cartCookie = cookies().get("cart")

    if (!cartCookie?.value) {
      return NextResponse.json({ items: [] })
    }

    let cartItems = []
    try {
      cartItems = JSON.parse(cartCookie.value)
    } catch (e) {
      console.error("Failed to parse cart cookie:", e)
      return NextResponse.json({ items: [] })
    }

    return NextResponse.json({ items: cartItems })
  } catch (error) {
    console.error("Error getting cart:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Add item to cart
export async function POST(request: NextRequest) {
  try {
    const { id, name, price, image, quantity = 1 } = await request.json()

    if (!id || !name || !price) {
      return NextResponse.json({ error: "Product ID, name, and price are required" }, { status: 400 })
    }

    // Get current cart
    const cartCookie = cookies().get("cart")
    let cartItems = []

    if (cartCookie?.value) {
      try {
        cartItems = JSON.parse(cartCookie.value)
      } catch (e) {
        console.error("Failed to parse cart cookie:", e)
      }
    }

    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex((item) => item.id === id)

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      cartItems[existingItemIndex].quantity += quantity
    } else {
      // Add new item
      cartItems.push({
        id,
        name,
        price,
        image,
        quantity,
      })
    }

    // Save cart to cookies
    cookies().set("cart", JSON.stringify(cartItems), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })

    return NextResponse.json({
      success: true,
      items: cartItems,
    })
  } catch (error) {
    console.error("Error adding to cart:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Clear cart
export async function DELETE(request: NextRequest) {
  try {
    cookies().set("cart", "[]", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })

    return NextResponse.json({
      success: true,
      message: "Cart cleared successfully",
    })
  } catch (error) {
    console.error("Error clearing cart:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

