import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's cart
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: true,
      },
    })

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "pending",
        total,
        orderItems: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
    })

    // Update inventory
    for (const item of cartItems) {
      await prisma.product.update({
        where: {
          id: item.productId,
        },
        data: {
          inventory: {
            decrement: item.quantity,
          },
        },
      })
    }

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: {
        userId: session.user.id,
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

