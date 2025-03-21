import { PrismaClient } from "@prisma/client"
import { hash } from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      role: "admin",
    },
  })
  console.log({ admin })

  // Create customer user
  const customerPassword = await hash("customer123", 10)
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "Test Customer",
      password: customerPassword,
      role: "customer",
    },
  })
  console.log({ customer })

  // Create sample products
  const products = [
    {
      name: "Ergonomic Desk Chair",
      description: "Comfortable office chair with lumbar support",
      price: 199.99,
      image: "/placeholder.svg?height=300&width=300",
      inventory: 15,
      visible: true,
    },
    {
      name: "Wireless Keyboard",
      description: "Bluetooth keyboard with long battery life",
      price: 59.99,
      image: "/placeholder.svg?height=300&width=300",
      inventory: 30,
      visible: true,
    },
    {
      name: "Wireless Mouse",
      description: "Ergonomic mouse with adjustable DPI",
      price: 39.99,
      image: "/placeholder.svg?height=300&width=300",
      inventory: 25,
      visible: true,
    },
    {
      name: "Monitor Stand",
      description: "Adjustable height monitor stand",
      price: 49.99,
      image: "/placeholder.svg?height=300&width=300",
      inventory: 10,
      visible: true,
    },
  ]

  for (const product of products) {
    await prisma.product.create({
      data: product,
    })
  }
  console.log("Added sample products")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })