import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/app/actions/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id

    // Verificar si el usuario es un administrador
    const { success } = await verifyAdminToken()

    // Determinar la URL de redirección basada en el rol del usuario
    const redirectUrl = success
      ? `/admin/orders/${orderId}` // Administrador: ir al panel de administración
      : `/checkout/confirmation?orderId=${orderId}` // Usuario normal: ir a la página de confirmación

    // Redireccionar al usuario
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  } catch (error) {
    console.error("Error en la redirección:", error)
    // En caso de error, redirigir a la página de confirmación por defecto
    return NextResponse.redirect(new URL(`/checkout/confirmation?orderId=${params.id}`, request.url))
  }
}

