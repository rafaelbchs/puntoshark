"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { X, Loader2, GripVertical, ImagePlus, PlusCircle, Trash2, Pencil } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import {
  createProduct,
  updateProduct,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from "@/app/actions/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { getOptimizedImageUrl } from "@/lib/image-utils"
import type { Product, ProductVariant, ProductType, ProductGender } from "@/types/inventory"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getProductById } from "@/app/actions/inventory"

type ProductFormProps = {
  product?: Product
  isEditing?: boolean
}

type SortableImageProps = {
  url: string
  index: number
  onRemove: (index: number) => void
}

// Sortable image component for drag and drop
function SortableImage({ url, index, onRemove }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: url })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative rounded-md overflow-hidden border h-40">
      <div className="absolute top-2 left-2 bg-black/50 rounded-md p-1 cursor-grab z-10" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-white" />
      </div>
      <Image
        src={getOptimizedImageUrl(url, 300, 300) || "/placeholder.svg"}
        alt={`Product image ${index + 1}`}
        fill
        className="object-cover"
      />
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 rounded-full"
        onClick={() => onRemove(index)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

export default function ProductForm({ product, isEditing = false }: ProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    compareAtPrice: product?.compareAtPrice || 0,
    sku: product?.sku || "",
    barcode: product?.barcode || "",
    category: product?.category || "",
    subcategory: product?.subcategory || "",
    productType: product?.productType || ("clothing" as ProductType),
    gender: product?.gender || ("unisex" as ProductGender),
    tags: product?.tags?.join(", ") || "",
    inventoryQuantity: product?.inventory?.quantity || 0,
    lowStockThreshold: product?.inventory?.lowStockThreshold || 5,
    manageInventory: product?.inventory?.managed || true,
    images: product?.images || [],
    hasVariants: product?.hasVariants || false,
    variantAttributes: product?.variantAttributes || [],
  })

  // Add state for variant management
  const [variantFormOpen, setVariantFormOpen] = useState(false)
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null)
  const [variantFormData, setVariantFormData] = useState({
    sku: "",
    price: 0,
    compareAtPrice: 0,
    inventoryQuantity: 0,
    attributes: {} as Record<string, string>,
  })
  const [availableAttributes, setAvailableAttributes] = useState<string[]>([])
  const [newAttribute, setNewAttribute] = useState("")

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Handle drag end event for image reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.images.findIndex((url) => url === active.id)
        const newIndex = prev.images.findIndex((url) => url === over.id)

        return {
          ...prev,
          images: arrayMove(prev.images, oldIndex, newIndex),
        }
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newUploadProgress = { ...uploadProgress }
    const uploadPromises = []

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: `${file.name} exceeds 5MB size limit`,
          variant: "destructive",
        })
        continue
      }

      // Create a unique ID for tracking this upload
      const uploadId = `${Date.now()}-${i}`
      newUploadProgress[uploadId] = 0

      // Create upload promise
      const uploadPromise = (async () => {
        try {
          // Upload to Supabase Storage
          const fileExt = file.name.split(".").pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
          const filePath = `products/${fileName}`

          // Upload with progress tracking
          const { data, error } = await supabase.storage.from("products").upload(filePath, file, {
            onUploadProgress: (progress) => {
              const percent = Math.round((progress.loaded / progress.total) * 100)
              setUploadProgress((prev) => ({
                ...prev,
                [uploadId]: percent,
              }))
            },
          })

          if (error) throw error

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("products").getPublicUrl(filePath)

          // Add to images array
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, publicUrl],
          }))

          return publicUrl
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          })
          return null
        }
      })()

      uploadPromises.push(uploadPromise)
    }

    // Update progress state
    setUploadProgress(newUploadProgress)

    // Wait for all uploads to complete
    await Promise.all(uploadPromises)

    // Reset upload state
    setIsUploading(false)
    setUploadProgress({})

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    toast({
      title: "Upload Complete",
      description: "All images have been uploaded successfully",
    })
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: Number.parseFloat(value) || 0 }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  // Add this function to handle variant attribute changes
  const handleVariantAttributeChange = () => {
    if (newAttribute && !formData.variantAttributes.includes(newAttribute)) {
      setFormData((prev) => ({
        ...prev,
        variantAttributes: [...prev.variantAttributes, newAttribute],
        hasVariants: true,
      }))
      setNewAttribute("")
    }
  }

  // Add this function to remove a variant attribute
  const removeVariantAttribute = (attribute: string) => {
    setFormData((prev) => ({
      ...prev,
      variantAttributes: prev.variantAttributes.filter((attr) => attr !== attribute),
    }))
  }

  // Add these functions to handle variant management
  const openVariantForm = (variant?: ProductVariant) => {
    if (variant) {
      setCurrentVariant(variant)
      setVariantFormData({
        sku: variant.sku,
        price: variant.price || formData.price,
        compareAtPrice: variant.compareAtPrice || 0,
        inventoryQuantity: variant.inventory.quantity,
        attributes: variant.attributes || {},
      })
    } else {
      setCurrentVariant(null)
      setVariantFormData({
        sku: `${formData.sku}-${product?.variants?.length || 0 + 1}`,
        price: formData.price,
        compareAtPrice: formData.compareAtPrice,
        inventoryQuantity: 0,
        attributes: formData.variantAttributes.reduce(
          (acc, attr) => {
            acc[attr] = ""
            return acc
          },
          {} as Record<string, string>,
        ),
      })
    }
    setVariantFormOpen(true)
  }

  const closeVariantForm = () => {
    setVariantFormOpen(false)
    setCurrentVariant(null)
  }

  const handleVariantFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setVariantFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleVariantAttributeValueChange = (attribute: string, value: string) => {
    setVariantFormData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attribute]: value,
      },
    }))
  }

  const handleVariantSubmit = async () => {
    if (!product?.id) return

    try {
      if (currentVariant) {
        // Update existing variant
        const result = await updateProductVariant(currentVariant.id, {
          sku: variantFormData.sku,
          price: variantFormData.price,
          compareAtPrice: variantFormData.compareAtPrice || undefined,
          inventory: {
            quantity: variantFormData.inventoryQuantity,
            lowStockThreshold: product.inventory.lowStockThreshold,
            status: determineStatus(variantFormData.inventoryQuantity, product.inventory.lowStockThreshold),
            managed: product.inventory.managed,
          },
          attributes: variantFormData.attributes,
        })

        if (result.success) {
          toast({
            title: "Success",
            description: "Variant updated successfully",
          })
          closeVariantForm()
          // Refresh the product data
          const updatedProduct = await getProductById(product.id)
          if (updatedProduct) {
            setFormData((prev) => ({
              ...prev,
              hasVariants: true,
            }))
          }
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update variant",
            variant: "destructive",
          })
        }
      } else {
        // Create new variant
        const result = await createProductVariant(product.id, {
          sku: variantFormData.sku,
          price: variantFormData.price,
          compareAtPrice: variantFormData.compareAtPrice || undefined,
          inventory: {
            quantity: variantFormData.inventoryQuantity,
            lowStockThreshold: product.inventory.lowStockThreshold,
            status: determineStatus(variantFormData.inventoryQuantity, product.inventory.lowStockThreshold),
            managed: product.inventory.managed,
          },
          attributes: variantFormData.attributes,
          barcode: undefined,
          images: [],
        })

        if (result.success) {
          toast({
            title: "Success",
            description: "Variant created successfully",
          })
          closeVariantForm()
          // Refresh the product data
          const updatedProduct = await getProductById(product.id)
          if (updatedProduct) {
            setFormData((prev) => ({
              ...prev,
              hasVariants: true,
            }))
          }
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create variant",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Failed to save variant:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!product?.id) return

    try {
      const result = await deleteProductVariant(variantId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Variant deleted successfully",
        })
        // Refresh the product data
        const updatedProduct = await getProductById(product.id)
        if (updatedProduct) {
          setFormData((prev) => ({
            ...prev,
            hasVariants: updatedProduct.hasVariants || false,
          }))
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete variant",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete variant:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        compareAtPrice: formData.compareAtPrice || undefined,
        images: formData.images, // This now includes the uploaded image URLs
        category: formData.category,
        subcategory: formData.subcategory,
        productType: formData.productType,
        gender: formData.gender,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        sku: formData.sku,
        barcode: formData.barcode || undefined,
        inventory: {
          quantity: formData.inventoryQuantity,
          lowStockThreshold: formData.lowStockThreshold,
          status: determineStatus(formData.inventoryQuantity, formData.lowStockThreshold),
          managed: formData.manageInventory,
        },
        attributes: product?.attributes || {},
        hasVariants: formData.hasVariants,
        variantAttributes: formData.variantAttributes,
      }

      let result
      if (isEditing && product) {
        result = await updateProduct(product.id, productData)
      } else {
        result = await createProduct(productData as any)
      }

      if (result.success) {
        toast({
          title: "Success",
          description: isEditing ? "Product updated successfully" : "Product created successfully",
        })
        router.push("/admin/products")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save product",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to save product:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const determineStatus = (quantity: number, threshold: number) => {
    if (quantity <= 0) return "out_of_stock"
    if (quantity <= threshold) return "low_stock"
    return "in_stock"
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="basic">
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5">$</span>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleNumberChange}
                      className="pl-7"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Compare at Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5">$</span>
                    <Input
                      id="compareAtPrice"
                      name="compareAtPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.compareAtPrice}
                      onChange={handleNumberChange}
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-4">
                  <Label htmlFor="images">Product Images</Label>
                  <div className="text-sm text-muted-foreground">
                    {formData.images.length} {formData.images.length === 1 ? "image" : "images"}
                  </div>
                </div>

                {formData.images.length > 0 && (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={formData.images} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                        {formData.images.map((image, index) => (
                          <SortableImage key={image} url={image} index={index} onRemove={removeImage} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {/* Upload progress indicators */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-2 mb-4">
                    {Object.entries(uploadProgress).map(([id, progress]) => (
                      <div key={id} className="space-y-1">
                        <div className="text-xs text-muted-foreground">Uploading image...</div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <div className="text-center">
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    ) : (
                      <ImagePlus className="h-8 w-8 mx-auto mb-2" />
                    )}
                    <p className="text-sm font-medium">{isUploading ? "Uploading..." : "Click to upload images"}</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG or WEBP (max 5MB per image)</p>
                    <p className="text-xs text-muted-foreground mt-1">You can select multiple images</p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground mt-4">
                  <p>Drag and drop images to reorder them. The first image will be used as the product thumbnail.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="manageInventory">Track inventory</Label>
                <Switch
                  id="manageInventory"
                  checked={formData.manageInventory}
                  onCheckedChange={(checked) => handleSwitchChange("manageInventory", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode (ISBN, UPC, GTIN, etc.)</Label>
                <Input id="barcode" name="barcode" value={formData.barcode} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inventoryQuantity">Quantity</Label>
                  <Input
                    id="inventoryQuantity"
                    name="inventoryQuantity"
                    type="number"
                    min="0"
                    value={formData.inventoryQuantity}
                    onChange={handleNumberChange}
                    disabled={!formData.manageInventory}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    name="lowStockThreshold"
                    type="number"
                    min="1"
                    value={formData.lowStockThreshold}
                    onChange={handleNumberChange}
                    disabled={!formData.manageInventory}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" value={formData.category} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input id="subcategory" name="subcategory" value={formData.subcategory} onChange={handleChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type</Label>
                  <Select
                    value={formData.productType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, productType: value as ProductType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="footwear">Footwear</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value as ProductGender }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="men">Men</SelectItem>
                      <SelectItem value="women">Women</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                      <SelectItem value="kids">Kids</SelectItem>
                      <SelectItem value="baby">Baby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="e.g. summer, sale, new"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Product Variants</Label>
                  <Switch
                    checked={formData.hasVariants}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({ ...prev, hasVariants: checked }))
                    }}
                  />
                </div>

                {formData.hasVariants && (
                  <>
                    <div className="space-y-2">
                      <Label>Variant Attributes</Label>
                      <p className="text-sm text-muted-foreground">
                        Define the attributes that will create variants (e.g., Size, Color)
                      </p>

                      <div className="flex flex-wrap gap-2 my-2">
                        {formData.variantAttributes.map((attr) => (
                          <Badge key={attr} variant="secondary" className="px-2 py-1">
                            {attr}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1"
                              onClick={() => removeVariantAttribute(attr)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Add attribute (e.g., Size, Color)"
                          value={newAttribute}
                          onChange={(e) => setNewAttribute(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" onClick={handleVariantAttributeChange}>
                          Add
                        </Button>
                      </div>
                    </div>

                    {isEditing && product && product.id && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Manage Variants</Label>
                          <Button
                            type="button"
                            onClick={() => openVariantForm()}
                            disabled={formData.variantAttributes.length === 0}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Variant
                          </Button>
                        </div>

                        {product.variants && product.variants.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>SKU</TableHead>
                                {formData.variantAttributes.map((attr) => (
                                  <TableHead key={attr}>{attr}</TableHead>
                                ))}
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {product.variants.map((variant) => (
                                <TableRow key={variant.id}>
                                  <TableCell>{variant.sku}</TableCell>
                                  {formData.variantAttributes.map((attr) => (
                                    <TableCell key={attr}>{variant.attributes[attr] || "-"}</TableCell>
                                  ))}
                                  <TableCell>${variant.price || product.price}</TableCell>
                                  <TableCell>{variant.inventory.quantity}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openVariantForm(variant)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteVariant(variant.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center p-4 border rounded-md bg-muted/50">
                            <p className="text-sm text-muted-foreground">No variants created yet.</p>
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-2"
                              onClick={() => openVariantForm()}
                              disabled={formData.variantAttributes.length === 0}
                            >
                              Create your first variant
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {!isEditing && (
                      <div className="text-center p-4 border rounded-md bg-muted/50">
                        <p className="text-sm text-muted-foreground">You can add variants after saving the product.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
        </Button>
      </div>

      {/* Variant Form Dialog */}
      <Dialog open={variantFormOpen} onOpenChange={setVariantFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentVariant ? "Edit Variant" : "Add Variant"}</DialogTitle>
            <DialogDescription>
              {currentVariant
                ? "Update the details for this product variant."
                : "Create a new variant with specific attributes."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="variant-sku">SKU</Label>
              <Input
                id="variant-sku"
                name="sku"
                value={variantFormData.sku}
                onChange={handleVariantFormChange}
                required
              />
            </div>

            {formData.variantAttributes.map((attr) => (
              <div key={attr} className="space-y-2">
                <Label htmlFor={`variant-attr-${attr}`}>{attr}</Label>
                <Input
                  id={`variant-attr-${attr}`}
                  value={variantFormData.attributes[attr] || ""}
                  onChange={(e) => handleVariantAttributeValueChange(attr, e.target.value)}
                  placeholder={`Enter ${attr.toLowerCase()}`}
                  required
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variant-price">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    id="variant-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={variantFormData.price}
                    onChange={(e) =>
                      setVariantFormData((prev) => ({
                        ...prev,
                        price: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="pl-7"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant-compareAtPrice">Compare at Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    id="variant-compareAtPrice"
                    name="compareAtPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={variantFormData.compareAtPrice}
                    onChange={(e) =>
                      setVariantFormData((prev) => ({
                        ...prev,
                        compareAtPrice: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variant-quantity">Inventory Quantity</Label>
              <Input
                id="variant-quantity"
                name="inventoryQuantity"
                type="number"
                min="0"
                value={variantFormData.inventoryQuantity}
                onChange={(e) =>
                  setVariantFormData((prev) => ({
                    ...prev,
                    inventoryQuantity: Number.parseInt(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeVariantForm}>
              Cancel
            </Button>
            <Button type="button" onClick={handleVariantSubmit}>
              {currentVariant ? "Update Variant" : "Add Variant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}

