import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative h-screen w-full">
        <div className="absolute inset-0">
          <Image
            src="/placeholder.svg?height=1080&width=1920"
            alt="Imagen de fondo"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative flex h-full items-center justify-start text-left px-4 sm:px-6 lg:px-8 lg:max-w-7xl lg:mx-auto">
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl uppercase">
              Colección
              <br />
              Performance
            </h1>
            <p className="mt-6 text-xl text-white">Diseñada para atletas, creada para todos.</p>
            <div className="mt-10">
              <Button
                asChild
                size="lg"
                className="text-base bg-white text-black hover:bg-white/90 rounded-none px-8 py-6"
              >
                <Link href="/collections/men">HOMBRES</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="text-base bg-white text-black hover:bg-white/90 rounded-none px-8 py-6 ml-4"
              >
                <Link href="/collections/women">MUJERES</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold tracking-tight text-black mb-12 uppercase">Comprar por Categoría</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Colección para Hombres",
                href: "/collections/men",
                image: "/placeholder.svg?height=600&width=400",
              },
              {
                name: "Colección para Mujeres",
                href: "/collections/women",
                image: "/placeholder.svg?height=600&width=400",
              },
              { name: "Accesorios", href: "/collections/accessories", image: "/placeholder.svg?height=600&width=400" },
            ].map((category) => (
              <Link key={category.name} href={category.href} className="group relative overflow-hidden">
                <div className="aspect-h-4 aspect-w-3 w-full overflow-hidden">
                  <Image
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    width={400}
                    height={600}
                    className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                  <h3 className="text-xl font-semibold text-white uppercase">{category.name}</h3>
                  <p className="mt-2 text-sm text-white flex items-center">
                    Comprar Ahora <ChevronRight className="h-4 w-4 ml-1" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-20 bg-[#f9f9f9]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-black uppercase">Nuevos Productos</h2>
            <Link href="/collections/new-arrivals" className="text-black hover:underline font-medium flex items-center">
              Ver Todo <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                id: 1,
                name: "Camiseta Performance",
                price: "$35",
                href: "/products/performance-tee",
                image: "/placeholder.svg?height=400&width=300",
              },
              {
                id: 2,
                name: "Shorts de Entrenamiento",
                price: "$45",
                href: "/products/training-shorts",
                image: "/placeholder.svg?height=400&width=300",
              },
              {
                id: 3,
                name: "Leggins Sin Costuras",
                price: "$65",
                href: "/products/seamless-leggings",
                image: "/placeholder.svg?height=400&width=300",
              },
              {
                id: 4,
                name: "Top Deportivo",
                price: "$40",
                href: "/products/training-sports-bra",
                image: "/placeholder.svg?height=400&width=300",
              },
            ].map((product) => (
              <div key={product.id} className="group relative">
                <div className="aspect-h-4 aspect-w-3 overflow-hidden bg-gray-100">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={300}
                    height={400}
                    className="h-full w-full object-cover object-center group-hover:opacity-90 transition-opacity"
                  />
                  <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center transition-opacity">
                    <Button className="bg-white text-black hover:bg-white/90 rounded-none">Añadir Rápido</Button>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-black">
                    <Link href={product.href}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm font-medium text-black">{product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collection Banner */}
      <section className="relative py-32">
        <div className="absolute inset-0">
          <Image src="/placeholder.svg?height=800&width=1920" alt="Colección destacada" fill className="object-cover" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-start justify-center">
          <div className="max-w-xl">
            <h2 className="text-4xl font-bold tracking-tight text-white uppercase">
              Colección
              <br />
              Entrenamiento
            </h2>
            <p className="mt-4 text-lg text-white">
              Diseñada para máximo rendimiento y comodidad durante tus entrenamientos más intensos.
            </p>
            <Button asChild className="mt-8 bg-white text-black hover:bg-white/90 rounded-none px-8 py-6">
              <Link href="/collections/training">COMPRAR LA COLECCIÓN</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Instagram Feed */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold tracking-tight text-black uppercase text-center mb-4">@PuntoShark</h2>
          <p className="text-base text-gray-600 text-center mb-12">
            Etiquétanos en Instagram para aparecer en nuestra galería
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Link key={i} href="https://instagram.com" className="group relative aspect-square overflow-hidden">
                <Image
                  src={`/placeholder.svg?height=300&width=300&text=Instagram+${i + 1}`}
                  alt={`Publicación de Instagram ${i + 1}`}
                  width={300}
                  height={300}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver Publicación
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold uppercase mb-4">Únete a la Comunidad PuntoShark</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Suscríbete a nuestro boletín para recibir ofertas exclusivas, acceso anticipado a nuevos lanzamientos y
            consejos de entrenamiento.
          </p>

          <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
            <input
              type="email"
              placeholder="Tu dirección de email"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white"
            />
            <Button type="submit" className="bg-white text-black hover:bg-white/90 rounded-none">
              SUSCRIBIRSE
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
