import { Suspense } from "react"
import Link from "next/link"
import { Plus, FileDown, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getProducts } from "@/app/actions/inventory"

export const metadata = {
  title: "Inventory Management",
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Extract search parameters
  const tab = searchParams.tab || "products"
  const category = searchParams.category as string | undefined
  const search = searchParams.search as string | undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your product inventory, track stock levels, and update product information.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export your inventory data as CSV</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" asChild>
                  <Link href="/admin/products/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a new product in your inventory</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Getting Started with Inventory</AlertTitle>
        <AlertDescription>
          To add a product, click the "Add Product" button. Fill in the product details including name, price, and
          category. SKUs will be generated automatically based on the product name and category. After creating a
          product, it will appear in the table below.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue={tab as string} className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" asChild>
            <Link href="/admin/inventory?tab=products">Products</Link>
          </TabsTrigger>
          <TabsTrigger value="categories" asChild>
            <Link href="/admin/inventory?tab=categories">Categories</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Summary</CardTitle>
              <CardDescription>Overview of your product inventory status.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Total Products</span>
                      <span className="text-2xl font-bold">--</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The total number of products in your inventory</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">In Stock</span>
                      <span className="text-2xl font-bold">--</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Products with available inventory</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Low Stock</span>
                      <span className="text-2xl font-bold">--</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Products with inventory below the low stock threshold</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Out of Stock</span>
                      <span className="text-2xl font-bold">--</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Products with zero inventory</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Suspense fallback={<div>Loading products...</div>}>
            <ProductsContent category={category} search={search} />
          </Suspense>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>View and manage all product categories in one place.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>About Categories</AlertTitle>
                  <AlertDescription>
                    Categories are created when adding products. This view allows you to see all categories in use and
                    how many products are in each category. You can add new categories directly from the product form
                    when creating or editing products.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">No Categories Yet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Categories will appear here once you create products with categories.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/admin/products/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product with Category
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function ProductsContent({
  category,
  search,
}: {
  category?: string
  search?: string
}) {
  // Fetch products
  const products = await getProducts()

  // Apply filters
  let filteredProducts = [...products]

  if (category) {
    filteredProducts = filteredProducts.filter((product) => product.category === category)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower),
    )
  }

  const getInventoryStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            In Stock
          </Badge>
        )
      case "low_stock":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Low Stock
          </Badge>
        )
      case "out_of_stock":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Out of Stock
          </Badge>
        )
      case "discontinued":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Discontinued
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Info className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No products found</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                You haven't added any products to your inventory yet. Click the button below to add your first product.
              </p>
              <Button asChild>
                <Link href="/admin/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">{product.category}</div>
                  </TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.price)}
                  </TableCell>
                  <TableCell>{product.inventory.quantity}</TableCell>
                  <TableCell>{getInventoryStatusBadge(product.inventory.status)}</TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/products/${product.id}/edit`}>Edit</Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit this product's details and inventory</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}

