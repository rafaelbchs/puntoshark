import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Update cart item quantity
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const itemId = params.id
    const { quantity } = await request.json()

    if (quantity === undefined || quantity < 0) {
      return NextResponse.json({ error: "Valid quantity is required" }, { status: 400 })
    }

    // Get current cart
    const cartCookie = cookies().get("cart")
    let cartItems = []

    if (cartCookie?.value) {
      try {
        cartItems = JSON.parse(cartCookie.value)
      } catch (e) {
        console.error("Failed to parse cart cookie:", e)
        return NextResponse.json({ error: "Invalid cart data" }, { status: 400 })
      }
    }

    // Find item in cart
    const itemIndex = cartItems.findIndex((item) => item.id === itemId)

    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 })
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      cartItems.splice(itemIndex, 1)
    } else {
      // Update quantity
      cartItems[itemIndex].quantity = quantity
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
    console.error("Error updating cart item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Remove item from cart
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const itemId = params.id

    // Get current cart
    const cartCookie = cookies().get("cart")
    let cartItems = []

    if (cartCookie?.value) {
      try {
        cartItems = JSON.parse(cartCookie.value)
      } catch (e) {
        console.error("Failed to parse cart cookie:", e)
        return NextResponse.json({ error: "Invalid cart data" }, { status: 400 })
      }
    }

    // Remove item from cart
    const updatedCart = cartItems.filter((item) => item.id !== itemId)

    // Save cart to cookies
    cookies().set("cart", JSON.stringify(updatedCart), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })

    return NextResponse.json({
      success: true,
      items: updatedCart,
    })
  } catch (error) {
    console.error("Error removing cart item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

