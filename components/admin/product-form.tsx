"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { X, Loader2, GripVertical, ImagePlus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { createProduct, updateProduct } from "@/app/actions/inventory"
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
import type { Product } from "@/types/inventory"

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
    tags: product?.tags?.join(", ") || "",
    inventoryQuantity: product?.inventory?.quantity || 0,
    lowStockThreshold: product?.inventory?.lowStockThreshold || 5,
    manageInventory: product?.inventory?.managed || true,
    images: product?.images || [],
  })

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
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" value={formData.category} onChange={handleChange} />
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
      </Tabs>

      <div className="mt-6 flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  )
}

