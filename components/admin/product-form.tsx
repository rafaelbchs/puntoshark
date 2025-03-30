"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Trash2, Plus, X, Loader2, Pencil } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { createProduct, updateProduct, getCategories, deleteProductVariant } from "@/app/actions/inventory"
import { checkSkuExists } from "@/app/actions/check-sku"
import type { Product, ProductVariant } from "@/types/inventory"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import ProductVariantForm from "@/components/admin/product-variant-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Define the form schema
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  compareAtPrice: z.coerce.number().min(0, "Compare at price must be a positive number").optional(),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  productType: z.string().optional(),
  gender: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  inventory_quantity: z.coerce.number().min(0, "Quantity must be a positive number"),
  low_stock_threshold: z.coerce.number().min(0, "Low stock threshold must be a positive number"),
  inventory_status: z.string(),
  inventory_managed: z.boolean(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.string()).optional(),
  has_variants: z.boolean().optional(),
  variant_attributes: z.array(z.string()).optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  initialData?: Product | null
  isEdit?: boolean
}

export default function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const router = useRouter()
  const [images, setImages] = useState<string[]>(initialData?.images || [])
  const [uploading, setUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [newTag, setNewTag] = useState("")
  const [categories, setCategories] = useState<{ name: string; subcategories: string[] }[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.category || "")
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [skuExists, setSkuExists] = useState(false)
  const [skuChecking, setSkuChecking] = useState(false)

  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isAddingNewSubcategory, setIsAddingNewSubcategory] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  // Variant management states
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [deletingVariant, setDeletingVariant] = useState<ProductVariant | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingVariants, setIsLoadingVariants] = useState(false)

  // New state for custom variant attributes
  const [newCustomAttribute, setNewCustomAttribute] = useState("")
  const [isAddingCustomAttribute, setIsAddingCustomAttribute] = useState(false)

  // Initialize the form with default values or existing product data
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      compareAtPrice: initialData?.compareAtPrice || 0,
      category: initialData?.category || "",
      subcategory: initialData?.subcategory || "",
      productType: initialData?.productType || "",
      gender: initialData?.gender || "unisex",
      sku: initialData?.sku || "",
      barcode: initialData?.barcode || "",
      inventory_quantity: initialData?.inventory_quantity || 0,
      low_stock_threshold: initialData?.inventory?.lowStockThreshold || 5,
      inventory_status: initialData?.inventory_status || "in_stock",
      inventory_managed: initialData?.inventory_managed !== undefined ? initialData.inventory_managed : true,
      tags: initialData?.tags || [],
      attributes: initialData?.attributes || {},
      has_variants: initialData?.hasVariants || false,
      variant_attributes: initialData?.variantAttributes || [],
    },
  })

  // Watch for changes to the SKU field
  const watchedSku = form.watch("sku")
  const watchedCategory = form.watch("category")
  const hasVariants = form.watch("has_variants")
  const variantAttributes = form.watch("variant_attributes")

  // Fetch categories on component mount
  useEffect(() => {
    async function fetchCategories() {
      const fetchedCategories = await getCategories()
      setCategories(fetchedCategories)
    }
    fetchCategories()
  }, [])

  // Fetch variants if this is an edit and the product has variants
  useEffect(() => {
    if (isEdit && initialData?.id && initialData?.hasVariants) {
      fetchVariants(initialData.id)
    }
  }, [isEdit, initialData?.id, initialData?.hasVariants])

  // Update subcategories when category changes
  useEffect(() => {
    if (watchedCategory) {
      const category = categories.find((cat) => cat.name === watchedCategory)
      if (category) {
        setSubcategories(category.subcategories || [])
      } else {
        setSubcategories([])
      }
      setSelectedCategory(watchedCategory)
    }
  }, [watchedCategory, categories])

  // Check if SKU exists when it changes
  useEffect(() => {
    const checkSku = async () => {
      if (watchedSku && watchedSku.length > 0) {
        setSkuChecking(true)
        const exists = await checkSkuExists(watchedSku, initialData?.id)
        setSkuExists(exists)
        setSkuChecking(false)
      } else {
        setSkuExists(false)
      }
    }

    const timeoutId = setTimeout(checkSku, 500)
    return () => clearTimeout(timeoutId)
  }, [watchedSku, initialData?.id])

  // Fetch variants
  const fetchVariants = async (productId: string) => {
    setIsLoadingVariants(true)
    try {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

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
        createdAt: variant.created_at,
        updatedAt: variant.updated_at,
      }))

      setVariants(transformedVariants)
    } catch (error) {
      console.error("Error fetching variants:", error)
      toast({
        title: "Error",
        description: "Failed to load product variants",
        variant: "destructive",
      })
    } finally {
      setIsLoadingVariants(false)
    }
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    setUploading(true)
    try {
      const files = Array.from(e.target.files)
      setUploadedFiles((prev) => [...prev, ...files])

      // Create temporary URLs for preview
      const newImagePreviews = files.map((file) => URL.createObjectURL(file))
      setImages([...images, ...newImagePreviews])

      toast({
        title: "Images added",
        description: "Your images have been added for upload. They will be processed when you save the product.",
      })
    } catch (error) {
      console.error("Error adding image:", error)
      toast({
        title: "Error adding image",
        description: "There was an error adding your image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ""
    }
  }

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)

    // Also remove from uploadedFiles if it's a new file
    if (index >= (initialData?.images?.length || 0)) {
      const newUploadedFiles = [...uploadedFiles]
      newUploadedFiles.splice(index - (initialData?.images?.length || 0), 1)
      setUploadedFiles(newUploadedFiles)
    }
  }

  // Handle tag addition
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  // Handle tag removal
  const handleRemoveTag = (index: number) => {
    const newTags = [...tags]
    newTags.splice(index, 1)
    setTags(newTags)
  }

  // Handle adding custom variant attribute
  const handleAddCustomAttribute = () => {
    if (newCustomAttribute.trim() && !variantAttributes?.includes(newCustomAttribute.trim())) {
      const currentAttributes = form.getValues("variant_attributes") || []
      form.setValue("variant_attributes", [...currentAttributes, newCustomAttribute.trim()])
      setNewCustomAttribute("")
      setIsAddingCustomAttribute(false)
    }
  }

  // Handle removing variant attribute
  const handleRemoveVariantAttribute = (attribute: string) => {
    const currentAttributes = form.getValues("variant_attributes") || []
    form.setValue(
      "variant_attributes",
      currentAttributes.filter((attr) => attr !== attribute),
    )
  }

  // Upload images to Supabase storage
  const uploadImagesToStorage = async (): Promise<string[]> => {
    if (uploadedFiles.length === 0) {
      return initialData?.images || []
    }

    const uploadedImageUrls: string[] = [...(initialData?.images || [])]

    for (const file of uploadedFiles) {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { data, error } = await supabase.storage.from("products").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })

      if (error) {
        console.error("Error uploading image:", error)
        throw new Error(`Failed to upload image: ${error.message}`)
      }

      // Get the public URL
      const { data: urlData } = supabase.storage.from("products").getPublicUrl(filePath)

      uploadedImageUrls.push(urlData.publicUrl)
    }

    return uploadedImageUrls
  }

  // Handle variant deletion
  const handleDeleteVariant = async () => {
    if (!deletingVariant) return

    setIsDeleting(true)
    try {
      const result = await deleteProductVariant(deletingVariant.id)

      if (result.success) {
        setVariants(variants.filter((v) => v.id !== deletingVariant.id))
        toast({
          title: "Variant deleted",
          description: "The variant has been deleted successfully",
        })
      } else {
        throw new Error(result.error || "Failed to delete variant")
      }
    } catch (error) {
      console.error("Error deleting variant:", error)
      toast({
        title: "Error",
        description: "Failed to delete variant",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeletingVariant(null)
    }
  }

  // Handle variant form success
  const handleVariantFormSuccess = () => {
    // Refresh variants
    if (initialData?.id) {
      fetchVariants(initialData.id)
    }
  }

  // Format variant attributes for display
  const formatAttributes = (attributes: Record<string, string>) => {
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")
  }

  // Get inventory status badge color
  const getInventoryStatusColor = (status: string) => {
    switch (status) {
      case "in_stock":
        return "bg-green-500"
      case "low_stock":
        return "bg-yellow-500"
      case "out_of_stock":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Handle form submission
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true)

    try {
      // Upload images to storage
      const uploadedImageUrls = await uploadImagesToStorage()

      // Include images, tags, and variant_attributes in the data
      const productData = {
        ...data,
        images: uploadedImageUrls,
        tags,
        variant_attributes: form.getValues("variant_attributes") || [],
      }

      let result
      if (isEdit && initialData) {
        // Update existing product
        result = await updateProduct(initialData.id, productData)
      } else {
        // Create new product
        result = await createProduct(productData)
      }

      if (result.success) {
        toast({
          title: isEdit ? "Product updated" : "Product created",
          description: isEdit
            ? "Your product has been updated successfully."
            : "Your product has been created successfully.",
        })
        router.push("/admin/products")
      } else {
        toast({
          title: "Error",
          description: result.error || "There was an error processing your request.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "There was an unexpected error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="attributes">Attributes</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the basic details of your product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter product name"
                      {...form.register("name")}
                      className={form.formState.errors.name ? "border-red-500" : ""}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productType">Product Type</Label>
                    <Select
                      onValueChange={(value) => form.setValue("productType", value)}
                      defaultValue={form.getValues("productType") || ""}
                    >
                      <SelectTrigger id="productType">
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="shoes">Shoes</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="beauty">Beauty</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter product description"
                    rows={5}
                    {...form.register("description")}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-8"
                        {...form.register("price")}
                      />
                    </div>
                    {form.formState.errors.price && (
                      <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compareAtPrice">Compare at Price</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                      <Input
                        id="compareAtPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-8"
                        {...form.register("compareAtPrice")}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    {!isAddingNewCategory ? (
                      <Select
                        value={form.getValues("category")}
                        onValueChange={(value) => {
                          if (value === "new") {
                            setIsAddingNewCategory(true)
                          } else {
                            form.setValue("category", value)
                            form.setValue("subcategory", "") // Reset subcategory when category changes
                          }
                        }}
                      >
                        <SelectTrigger id="category" className={form.formState.errors.category ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.name} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="new">+ Add New Category</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter new category"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (newCategoryName.trim()) {
                                const categoryValue = newCategoryName.trim()
                                form.setValue("category", categoryValue)

                                // Add the new category to the categories list if it doesn't exist
                                if (!categories.some((cat) => cat.name === categoryValue)) {
                                  setCategories([...categories, { name: categoryValue, subcategories: [] }])
                                }

                                setIsAddingNewCategory(false)
                                setNewCategoryName("")
                              }
                            }}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsAddingNewCategory(false)
                              setNewCategoryName("")
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    {form.formState.errors.category && (
                      <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory</Label>
                    {!isAddingNewSubcategory ? (
                      <Select
                        value={form.getValues("subcategory")}
                        onValueChange={(value) => {
                          if (value === "new") {
                            setIsAddingNewSubcategory(true)
                          } else {
                            form.setValue("subcategory", value)
                          }
                        }}
                      >
                        <SelectTrigger id="subcategory">
                          <SelectValue placeholder="Select a subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategories.map((subcategory) => (
                            <SelectItem key={subcategory} value={subcategory}>
                              {subcategory}
                            </SelectItem>
                          ))}
                          <SelectItem value="new">+ Add New Subcategory</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter new subcategory"
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (newSubcategoryName.trim()) {
                                const subcategoryValue = newSubcategoryName.trim()
                                form.setValue("subcategory", subcategoryValue)

                                // Add the new subcategory to the current category's subcategories list
                                const currentCategory = form.getValues("category")
                                const updatedCategories = categories.map((cat) => {
                                  if (cat.name === currentCategory && !cat.subcategories.includes(subcategoryValue)) {
                                    return {
                                      ...cat,
                                      subcategories: [...cat.subcategories, subcategoryValue],
                                    }
                                  }
                                  return cat
                                })

                                setCategories(updatedCategories)
                                setSubcategories([...subcategories, subcategoryValue])
                                setIsAddingNewSubcategory(false)
                                setNewSubcategoryName("")
                              }
                            }}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsAddingNewSubcategory(false)
                              setNewSubcategoryName("")
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      onValueChange={(value) => form.setValue("gender", value)}
                      defaultValue={form.getValues("gender") || "unisex"}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="men">Men</SelectItem>
                        <SelectItem value="women">Women</SelectItem>
                        <SelectItem value="unisex">Unisex</SelectItem>
                        <SelectItem value="kids">Kids</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, index) => (
                      <div key={index} className="flex items-center bg-muted px-3 py-1 rounded-full text-sm">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(index)}
                          className="ml-2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>Upload images of your product.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Product ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-70"
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ))}
                    <label className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed cursor-pointer hover:bg-muted/50">
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <Plus className="h-8 w-8 mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Upload Image</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG or WEBP</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  {uploading && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Information</CardTitle>
                <CardDescription>Manage your product inventory and SKU details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                    <div className="relative">
                      <Input
                        id="sku"
                        placeholder="Enter SKU"
                        {...form.register("sku")}
                        className={skuExists ? "border-red-500 pr-10" : ""}
                      />
                      {skuChecking && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {skuExists && <p className="text-sm text-red-500">This SKU already exists</p>}
                    <p className="text-xs text-muted-foreground">
                      Leave blank to auto-generate. SKUs are unique identifiers for your products.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode (ISBN, UPC, GTIN, etc.)</Label>
                    <Input id="barcode" placeholder="Enter barcode" {...form.register("barcode")} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inventory_managed" className="text-base font-medium">
                      Track inventory
                    </Label>
                    <Switch
                      id="inventory_managed"
                      checked={form.watch("inventory_managed")}
                      onCheckedChange={(checked) => form.setValue("inventory_managed", checked)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    When enabled, inventory levels will be tracked and product availability will be managed
                    automatically.
                  </p>
                </div>

                {form.watch("inventory_managed") && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="inventory_quantity">Quantity</Label>
                        <Input
                          id="inventory_quantity"
                          type="number"
                          min="0"
                          placeholder="0"
                          {...form.register("inventory_quantity")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                        <Input
                          id="low_stock_threshold"
                          type="number"
                          min="0"
                          placeholder="5"
                          {...form.register("low_stock_threshold")}
                        />
                        <p className="text-xs text-muted-foreground">
                          You&apos;ll be alerted when inventory falls below this number.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inventory_status">Inventory Status</Label>
                      <Select
                        onValueChange={(value) => form.setValue("inventory_status", value)}
                        defaultValue={form.getValues("inventory_status")}
                      >
                        <SelectTrigger id="inventory_status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_stock">In Stock</SelectItem>
                          <SelectItem value="low_stock">Low Stock</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                          <SelectItem value="backorder">Backorder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attributes Tab */}
          <TabsContent value="attributes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Attributes</CardTitle>
                <CardDescription>Add additional attributes to your product.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="has_variants" className="text-base font-medium">
                      This product has multiple variants
                    </Label>
                    <Switch
                      id="has_variants"
                      checked={form.watch("has_variants")}
                      onCheckedChange={(checked) => form.setValue("has_variants", checked)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enable this if your product comes in different options like sizes or colors.
                  </p>

                  {form.watch("has_variants") && (
                    <div className="space-y-4 mt-4">
                      <div className="p-4 border rounded-md bg-muted/50">
                        <h4 className="text-sm font-medium mb-2">Variant Attributes</h4>

                        {/* Selected variant attributes */}
                        {variantAttributes && variantAttributes.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {variantAttributes.map((attr) => (
                              <div
                                key={attr}
                                className="flex items-center bg-primary/10 px-3 py-1 rounded-full text-sm"
                              >
                                {attr}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariantAttribute(attr)}
                                  className="ml-2 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Common variant attributes */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="attr-size"
                              checked={form.watch("variant_attributes")?.includes("size")}
                              onCheckedChange={(checked) => {
                                const current = form.watch("variant_attributes") || []
                                if (checked) {
                                  form.setValue("variant_attributes", [...current, "size"])
                                } else {
                                  form.setValue(
                                    "variant_attributes",
                                    current.filter((attr) => attr !== "size"),
                                  )
                                }
                              }}
                            />
                            <Label htmlFor="attr-size">Size</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="attr-color"
                              checked={form.watch("variant_attributes")?.includes("color")}
                              onCheckedChange={(checked) => {
                                const current = form.watch("variant_attributes") || []
                                if (checked) {
                                  form.setValue("variant_attributes", [...current, "color"])
                                } else {
                                  form.setValue(
                                    "variant_attributes",
                                    current.filter((attr) => attr !== "color"),
                                  )
                                }
                              }}
                            />
                            <Label htmlFor="attr-color">Color</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="attr-material"
                              checked={form.watch("variant_attributes")?.includes("material")}
                              onCheckedChange={(checked) => {
                                const current = form.watch("variant_attributes") || []
                                if (checked) {
                                  form.setValue("variant_attributes", [...current, "material"])
                                } else {
                                  form.setValue(
                                    "variant_attributes",
                                    current.filter((attr) => attr !== "material"),
                                  )
                                }
                              }}
                            />
                            <Label htmlFor="attr-material">Material</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="attr-style"
                              checked={form.watch("variant_attributes")?.includes("style")}
                              onCheckedChange={(checked) => {
                                const current = form.watch("variant_attributes") || []
                                if (checked) {
                                  form.setValue("variant_attributes", [...current, "style"])
                                } else {
                                  form.setValue(
                                    "variant_attributes",
                                    current.filter((attr) => attr !== "style"),
                                  )
                                }
                              }}
                            />
                            <Label htmlFor="attr-style">Style</Label>
                          </div>
                        </div>

                        {/* Custom attribute input */}
                        {isAddingCustomAttribute ? (
                          <div className="space-y-2">
                            <Input
                              placeholder="Enter custom attribute (e.g. 'pattern', 'weight')"
                              value={newCustomAttribute}
                              onChange={(e) => setNewCustomAttribute(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleAddCustomAttribute()
                                }
                              }}
                            />
                            <div className="flex gap-2">
                              <Button type="button" size="sm" onClick={handleAddCustomAttribute}>
                                Save
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsAddingCustomAttribute(false)
                                  setNewCustomAttribute("")
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddingCustomAttribute(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Custom Attribute
                          </Button>
                        )}
                      </div>

                      {/* Variant Management Section */}
                      {isEdit && hasVariants && variantAttributes && variantAttributes.length > 0 && (
                        <div className="mt-6 space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">Product Variants</h3>
                            <Button type="button" onClick={() => setIsAddVariantOpen(true)} size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Variant
                            </Button>
                          </div>

                          {isLoadingVariants ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[1, 2].map((i) => (
                                <div key={i} className="h-24 rounded-md bg-muted animate-pulse" />
                              ))}
                            </div>
                          ) : variants.length === 0 ? (
                            <div className="p-4 border rounded-md bg-muted/30 text-center">
                              <p className="text-muted-foreground">No variants added yet. Add your first variant.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {variants.map((variant) => (
                                <Card key={variant.id} className="overflow-hidden">
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-medium">{formatAttributes(variant.attributes)}</h4>
                                        <p className="text-sm text-muted-foreground">SKU: {variant.sku}</p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setEditingVariant(variant)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="text-red-500 hover:text-red-600"
                                          onClick={() => setDeletingVariant(variant)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="mt-2 flex justify-between items-center">
                                      <span className="font-medium">${variant.price.toFixed(2)}</span>
                                      <Badge
                                        className={`${getInventoryStatusColor(variant.inventory.status)} text-white`}
                                      >
                                        {variant.inventory.quantity} in stock
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {!isEdit && (
                        <p className="text-sm text-muted-foreground">
                          You'll be able to add specific variants after creating the product.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || skuExists}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>

      {/* Variant Form Dialog */}
      <ProductVariantForm
        product={initialData as Product}
        variant={editingVariant}
        open={isAddVariantOpen || !!editingVariant}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddVariantOpen(false)
            setEditingVariant(null)
          }
        }}
        onSuccess={handleVariantFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingVariant} onOpenChange={(open) => !open && setDeletingVariant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this variant. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteVariant()
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

