import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { quantity } = await request.json()

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!cartItem || cartItem.userId !== session.user.id) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 })
    }

    // Update quantity
    const updatedCartItem = await prisma.cartItem.update({
      where: {
        id: params.id,
      },
      data: {
        quantity,
      },
    })

    return NextResponse.json(updatedCartItem)
  } catch (error) {
    console.error("Error updating cart item:", error)
    return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!cartItem || cartItem.userId !== session.user.id) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 })
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing cart item:", error)
    return NextResponse.json({ error: "Failed to remove cart item" }, { status: 500 })
  }
}

