"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { toast } from "@/hooks/use-toast"
import type { Product, ProductVariant } from "@/types/inventory"

interface ProductVariantSelectorProps {
  product: Product
}

export function ProductVariantSelector({ product }: ProductVariantSelectorProps) {
  const router = useRouter()
  const { addItem } = useCart()
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Fetch variants
  useEffect(() => {
    async function fetchVariants() {
      if (!product.id || !product.hasVariants) return

      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", product.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        // Transform the data to match the frontend model
        const transformedVariants = data.map((variant: any) => ({
          id: variant.id,
          productId: variant.product_id,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compare_at_price,
          inventory: {
            quantity: variant.inventory_quantity,
            lowStockThreshold: variant.low_stock_threshold,
            status: variant.inventory_status,
            managed: variant.inventory_managed,
          },
          attributes: variant.attributes || {},
          images: variant.images || [],
          createdAt: variant.created_at,
          updatedAt: variant.updated_at,
        }))

        setVariants(transformedVariants)

        // Initialize with first variant if available
        if (transformedVariants.length > 0) {
          setSelectedVariant(transformedVariants[0])
          setSelectedAttributes(transformedVariants[0].attributes)
        }
      } catch (error) {
        console.error("Error fetching variants:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVariants()
  }, [product.id, product.hasVariants])

  // Get unique attribute values for each attribute
  const getAttributeValues = (attribute: string) => {
    const values = new Set<string>()
    variants.forEach((variant) => {
      if (variant.attributes[attribute]) {
        values.add(variant.attributes[attribute])
      }
    })
    return Array.from(values)
  }

  // Handle attribute selection
  const handleAttributeChange = (attribute: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [attribute]: value }
    setSelectedAttributes(newAttributes)

    // Find matching variant
    const matchingVariant = findMatchingVariant(newAttributes)
    setSelectedVariant(matchingVariant)
  }

  // Find variant that matches selected attributes
  const findMatchingVariant = (attributes: Record<string, string>) => {
    return (
      variants.find((variant) => {
        // Check if all selected attributes match this variant
        return Object.entries(attributes).every(([key, value]) => variant.attributes[key] === value)
      }) || null
    )
  }

  // Handle add to cart
  const handleAddToCart = () => {
    if (!selectedVariant) return

    setIsAddingToCart(true)

    try {
      addItem({
        id: selectedVariant.id,
        name: `${product.name} - ${formatVariantName(selectedVariant.attributes)}`,
        price: selectedVariant.price,
        image: product.images?.[0] || "",
      })

      toast({
        title: "Added to cart",
        description: `${product.name} (${formatVariantName(selectedVariant.attributes)}) has been added to your cart`,
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Format variant name for display
  const formatVariantName = (attributes: Record<string, string>) => {
    return Object.entries(attributes)
      .map(([key, value]) => `${value}`)
      .join(", ")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading variants...</span>
      </div>
    )
  }

  if (variants.length === 0) {
    return (
      <div className="py-4">
        <Button
          size="lg"
          className="w-full"
          disabled={product.inventory.status === "out_of_stock"}
          onClick={() => {
            setIsAddingToCart(true)
            try {
              addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0] || "",
              })
              toast({
                title: "Added to cart",
                description: `${product.name} has been added to your cart`,
              })
            } catch (error) {
              console.error("Error adding to cart:", error)
              toast({
                title: "Error",
                description: "Failed to add item to cart",
                variant: "destructive",
              })
            } finally {
              setIsAddingToCart(false)
            }
          }}
        >
          {isAddingToCart ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
            </>
          ) : product.inventory.status === "out_of_stock" ? (
            "Out of Stock"
          ) : (
            "Add to Cart"
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {product.variantAttributes?.map((attribute) => (
        <div key={attribute} className="space-y-3">
          <Label className="text-base font-medium">{attribute.charAt(0).toUpperCase() + attribute.slice(1)}</Label>
          <RadioGroup
            value={selectedAttributes[attribute] || ""}
            onValueChange={(value) => handleAttributeChange(attribute, value)}
            className="flex flex-wrap gap-2"
          >
            {getAttributeValues(attribute).map((value) => {
              // Determine if this option would lead to a valid variant
              const wouldBeValid = variants.some((variant) => {
                const testAttributes = { ...selectedAttributes, [attribute]: value }
                return Object.entries(testAttributes).every(
                  ([key, val]) => variant.attributes[key] === val || !testAttributes[key],
                )
              })

              return (
                <div key={value} className="flex items-center">
                  <RadioGroupItem
                    value={value}
                    id={`${attribute}-${value}`}
                    className="peer sr-only"
                    disabled={!wouldBeValid}
                  />
                  <Label
                    htmlFor={`${attribute}-${value}`}
                    className={`px-3 py-2 rounded-md border cursor-pointer peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
                      ${
                        selectedAttributes[attribute] === value
                          ? "bg-primary text-primary-foreground"
                          : "bg-background hover:bg-muted"
                      }`}
                  >
                    {value}
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </div>
      ))}

      {selectedVariant && (
        <div className="pt-4">
          <Button
            size="lg"
            className="w-full"
            disabled={selectedVariant.inventory.status === "out_of_stock" || isAddingToCart}
            onClick={handleAddToCart}
          >
            {isAddingToCart ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
              </>
            ) : selectedVariant.inventory.status === "out_of_stock" ? (
              "Out of Stock"
            ) : (
              "Add to Cart"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

