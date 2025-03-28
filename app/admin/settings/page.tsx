"use client"
import Link from "next/link"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Megaphone, Mail } from "lucide-react"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Save, Store, Truck, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
import {
  saveStoreSettings,
  saveShippingSettings,
  saveNotificationSettings,
  getSettings,
  savePromoBannerSettings,
} from "@/app/actions/settings"
import ProtectedAdminRoute from "@/components/protected-admin-route"

// Form schemas
const storeFormSchema = z.object({
  storeName: z.string().min(2, { message: "Store name must be at least 2 characters." }),
  storeDescription: z.string().optional(),
  storeEmail: z.string().email({ message: "Please enter a valid email address." }),
  storePhone: z.string().optional(),
  storeAddress: z.string().optional(),
  storeCurrency: z.string().min(1, { message: "Currency is required" }),
  storeTimeZone: z.string().min(1, { message: "Time zone is required" }),
})

const shippingFormSchema = z.object({
  enableFreeShipping: z.boolean().default(false),
  freeShippingThreshold: z.number().optional(),
  enableFlatRate: z.boolean().default(true),
  flatRateAmount: z.number().optional(),
  enableLocalPickup: z.boolean().default(true),
})

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  orderConfirmation: z.boolean().default(true),
  orderStatusUpdate: z.boolean().default(true),
  lowStockAlert: z.boolean().default(true),
  lowStockThreshold: z.number().min(1).default(5),
  adminEmail: z.string().email({ message: "Please enter a valid email address." }),
  emailTemplate: z.string().optional(),
})

// Add promo banner form schema
const promoBannerFormSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.string().min(1, { message: "Banner text is required" }),
  bgColor: z.string().min(1, { message: "Background color is required" }),
  textColor: z.string().min(1, { message: "Text color is required" }),
  link: z.string().optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
})

// Default email template with alternative syntax that won't conflict with JSX
const DEFAULT_EMAIL_TEMPLATE = `<h1>Thank you for your order!</h1>
<p>Dear [customerName],</p>
<p>We're pleased to confirm your order #[orderId].</p>
<h2>Order Details:</h2>
<ul>
  [#each items]
  <li>[quantity]x [name] - $[price]</li>
  [/each]
</ul>
<p><strong>Total: $[total]</strong></p>
<p>We'll notify you when your order ships.</p>
<p>Thank you for shopping with us!</p>`

// Function to convert our custom syntax to handlebars syntax when saving
function convertToHandlebars(template) {
  return template
    .replace(/\[customerName\]/g, "{{customerName}}")
    .replace(/\[orderId\]/g, "{{orderId}}")
    .replace(/\[#each items\]/g, "{{#each items}}")
    .replace(/\[\/each\]/g, "{{/each}}")
    .replace(/\[quantity\]/g, "{{quantity}}")
    .replace(/\[name\]/g, "{{name}}")
    .replace(/\[price\]/g, "{{price}}")
    .replace(/\[total\]/g, "{{total}}")
}

// Function to convert from handlebars syntax to our custom syntax when loading
function convertFromHandlebars(template) {
  if (!template) return DEFAULT_EMAIL_TEMPLATE

  return template
    .replace(/\{\{customerName\}\}/g, "[customerName]")
    .replace(/\{\{orderId\}\}/g, "[orderId]")
    .replace(/\{\{#each items\}\}/g, "[#each items]")
    .replace(/\{\{\/each\}\}/g, "[/each]")
    .replace(/\{\{quantity\}\}/g, "[quantity]")
    .replace(/\{\{name\}\}/g, "[name]")
    .replace(/\{\{price\}\}/g, "[price]")
    .replace(/\{\{total\}\}/g, "[total]")
}

export default function AdminSettingsClientPage() {
  const [activeTab, setActiveTab] = useState("store")
  const [isLoading, setIsLoading] = useState(false)

  const storeForm = useForm<z.infer<typeof storeFormSchema>>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      storeName: "",
      storeDescription: "",
      storeEmail: "",
      storePhone: "",
      storeAddress: "",
      storeCurrency: "",
      storeTimeZone: "",
    },
  })

  const shippingForm = useForm<z.infer<typeof shippingFormSchema>>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      enableFreeShipping: false,
      freeShippingThreshold: 0,
      enableFlatRate: true,
      flatRateAmount: 0,
      enableLocalPickup: true,
    },
  })

  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      orderConfirmation: true,
      orderStatusUpdate: true,
      lowStockAlert: true,
      lowStockThreshold: 5,
      adminEmail: "",
      emailTemplate: DEFAULT_EMAIL_TEMPLATE,
    },
  })

  // Add promo banner form
  const promoBannerForm = useForm<z.infer<typeof promoBannerFormSchema>>({
    resolver: zodResolver(promoBannerFormSchema),
    defaultValues: {
      enabled: false,
      text: "Free shipping on orders over $75",
      bgColor: "#000000",
      textColor: "#FFFFFF",
      link: "",
      startDate: null,
      endDate: null,
    },
  })

  async function onStoreSubmit(values: z.infer<typeof storeFormSchema>) {
    setIsLoading(true)
    try {
      await saveStoreSettings(values)
      toast({
        title: "Success!",
        description: "Store settings saved.",
      })
    } catch (error) {
      toast({
        title: "Error!",
        description: "Failed to save store settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onShippingSubmit(values: z.infer<typeof shippingFormSchema>) {
    setIsLoading(true)
    try {
      await saveShippingSettings(values)
      toast({
        title: "Success!",
        description: "Shipping settings saved.",
      })
    } catch (error) {
      toast({
        title: "Error!",
        description: "Failed to save shipping settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onNotificationSubmit(values: z.infer<typeof notificationFormSchema>) {
    setIsLoading(true)
    try {
      // Convert to handlebars before saving
      const handlebarsTemplate = convertToHandlebars(values.emailTemplate || DEFAULT_EMAIL_TEMPLATE)
      await saveNotificationSettings({ ...values, emailTemplate: handlebarsTemplate })
      toast({
        title: "Success!",
        description: "Notification settings saved.",
      })
    } catch (error) {
      toast({
        title: "Error!",
        description: "Failed to save notification settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add promo banner submit handler
  async function onPromoBannerSubmit(values: z.infer<typeof promoBannerFormSchema>) {
    setIsLoading(true)
    try {
      await savePromoBannerSettings(values)
      toast({
        title: "Success!",
        description: "Promo banner settings saved.",
      })
    } catch (error) {
      toast({
        title: "Error!",
        description: "Failed to save promo banner settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true)
      try {
        const settings = await getSettings()

        if (settings) {
          // Convert email template from handlebars to custom syntax
          const storeSettings = settings.storeSettings || {}
          storeForm.reset(storeSettings)

          const shippingSettings = settings.shippingSettings || {}
          shippingForm.reset(shippingSettings)

          const notificationSettings = settings.notificationSettings || {}
          notificationForm.reset({
            ...notificationSettings,
            emailTemplate: convertFromHandlebars(notificationSettings.emailTemplate),
          })

          // Load promo banner settings if they exist
          if (settings.promoBanner) {
            promoBannerForm.reset({
              enabled: settings.promoBanner.enabled || false,
              text: settings.promoBanner.text || "Free shipping on orders over $75",
              bgColor: settings.promoBanner.bgColor || "#000000",
              textColor: settings.promoBanner.textColor || "#FFFFFF",
              link: settings.promoBanner.link || "",
              startDate: settings.promoBanner.startDate ? new Date(settings.promoBanner.startDate) : null,
              endDate: settings.promoBanner.endDate ? new Date(settings.promoBanner.endDate) : null,
            })
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
        toast({
          title: "Error!",
          description: "Failed to load settings.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  return (
    <ProtectedAdminRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin: Settings</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 flex w-full flex-wrap">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Store
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Shipping
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="promo-banner" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Promo Banner
            </TabsTrigger>
          </TabsList>

          {/* Store Settings Tab Content */}
          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle>Store Settings</CardTitle>
                <CardDescription>Manage your store information and preferences</CardDescription>
              </CardHeader>
              <Form {...storeForm}>
                <form onSubmit={storeForm.handleSubmit(onStoreSubmit)}>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : (
                      <>
                        <FormField
                          control={storeForm.control}
                          name="storeName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Store Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={storeForm.control}
                          name="storeDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Store Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={storeForm.control}
                            name="storeEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Store Email</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={storeForm.control}
                            name="storePhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Store Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={storeForm.control}
                          name="storeAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Store Address</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={storeForm.control}
                            name="storeCurrency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={storeForm.control}
                            name="storeTimeZone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time Zone</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="ml-auto" disabled={isLoading}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Store Settings
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>

          {/* Shipping Settings Tab Content */}
          <TabsContent value="shipping">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Settings</CardTitle>
                <CardDescription>Configure shipping methods for your store</CardDescription>
              </CardHeader>
              <Form {...shippingForm}>
                <form onSubmit={shippingForm.handleSubmit(onShippingSubmit)}>
                  <CardContent className="space-y-6">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <h3 className="font-medium">Free Shipping</h3>
                          <FormField
                            control={shippingForm.control}
                            name="enableFreeShipping"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Enable Free Shipping</FormLabel>
                                  <FormDescription>Offer free shipping to customers</FormDescription>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {shippingForm.watch("enableFreeShipping") && (
                            <FormField
                              control={shippingForm.control}
                              name="freeShippingThreshold"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Minimum Order Amount for Free Shipping</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Orders above this amount will qualify for free shipping
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-medium">Flat Rate Shipping</h3>
                          <FormField
                            control={shippingForm.control}
                            name="enableFlatRate"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Enable Flat Rate Shipping</FormLabel>
                                  <FormDescription>Charge a fixed amount for shipping</FormDescription>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {shippingForm.watch("enableFlatRate") && (
                            <FormField
                              control={shippingForm.control}
                              name="flatRateAmount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Flat Rate Amount</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-medium">Local Pickup</h3>
                          <FormField
                            control={shippingForm.control}
                            name="enableLocalPickup"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Enable Local Pickup</FormLabel>
                                  <FormDescription>
                                    Allow customers to pick up orders from your location
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="ml-auto" disabled={isLoading}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Shipping Settings
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>

          {/* Notification Settings Tab Content */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure email notifications and alerts</CardDescription>
              </CardHeader>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}>
                  <CardContent className="space-y-6">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <h3 className="font-medium flex items-center">
                            <Mail className="mr-2 h-4 w-4" />
                            Email Notifications
                          </h3>
                          <FormField
                            control={notificationForm.control}
                            name="emailNotifications"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Enable Email Notifications</FormLabel>
                                  <FormDescription>Send email notifications for store events</FormDescription>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {notificationForm.watch("emailNotifications") && (
                            <>
                              <FormField
                                control={notificationForm.control}
                                name="orderConfirmation"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">Order Confirmation</FormLabel>
                                      <FormDescription>Send email when a new order is placed</FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={notificationForm.control}
                                name="orderStatusUpdate"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">Order Status Updates</FormLabel>
                                      <FormDescription>Send email when an order status changes</FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-medium">Inventory Alerts</h3>
                          <FormField
                            control={notificationForm.control}
                            name="lowStockAlert"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Low Stock Alerts</FormLabel>
                                  <FormDescription>
                                    Receive notifications when product inventory is running low
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {notificationForm.watch("lowStockAlert") && (
                            <FormField
                              control={notificationForm.control}
                              name="lowStockThreshold"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Low Stock Threshold</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Send alerts when product quantity falls below this number
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        {/* Admin Email Field - Make sure this is visible and properly labeled */}
                        <FormField
                          control={notificationForm.control}
                          name="adminEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Admin Email for Notifications</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                <strong>All admin notifications will be sent to this email address</strong>. Make sure
                                to set this to receive order notifications.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="emailTemplate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Order Confirmation Email Template</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={10} className="font-mono text-sm h-[200px] sm:h-[300px]" />
                              </FormControl>
                              <FormDescription>
                                HTML template for order confirmation emails. Use variables like [customerName],
                                [orderId], [total] and [#each items]...[/each].
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="ml-auto" disabled={isLoading}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Notification Settings
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>

          {/* Promo Banner Settings Tab Content */}
          <TabsContent value="promo-banner">
            <Card>
              <CardHeader>
                <CardTitle>Promotional Banner</CardTitle>
                <CardDescription>
                  Configure the promotional banner that appears at the top of your store
                </CardDescription>
              </CardHeader>
              <Form {...promoBannerForm}>
                <form onSubmit={promoBannerForm.handleSubmit(onPromoBannerSubmit)}>
                  <CardContent className="space-y-6">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : (
                      <>
                        <FormField
                          control={promoBannerForm.control}
                          name="enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable Promotional Banner</FormLabel>
                                <FormDescription>Display a promotional banner at the top of your store</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {promoBannerForm.watch("enabled") && (
                          <>
                            <FormField
                              control={promoBannerForm.control}
                              name="text"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Banner Text</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Free shipping on orders over $75" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={promoBannerForm.control}
                                name="bgColor"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Background Color</FormLabel>
                                    <div className="flex items-center gap-2">
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <div
                                        className="h-8 w-8 rounded border"
                                        style={{ backgroundColor: field.value }}
                                      />
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={promoBannerForm.control}
                                name="textColor"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Text Color</FormLabel>
                                    <div className="flex items-center gap-2">
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <div
                                        className="h-8 w-8 rounded border"
                                        style={{ backgroundColor: field.value }}
                                      />
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={promoBannerForm.control}
                              name="link"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Banner Link (Optional)</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="/collections/sale" />
                                  </FormControl>
                                  <FormDescription>
                                    Add a link to direct customers when they click on the banner
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={promoBannerForm.control}
                                name="startDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Date (Optional)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="datetime-local"
                                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                                        onChange={(e) => {
                                          const date = e.target.value ? new Date(e.target.value) : null
                                          field.onChange(date)
                                        }}
                                      />
                                    </FormControl>
                                    <FormDescription>When the banner should start displaying</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={promoBannerForm.control}
                                name="endDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Date (Optional)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="datetime-local"
                                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                                        onChange={(e) => {
                                          const date = e.target.value ? new Date(e.target.value) : null
                                          field.onChange(date)
                                        }}
                                      />
                                    </FormControl>
                                    <FormDescription>When the banner should stop displaying</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Banner Preview */}
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium">Banner Preview</h3>
                              <div
                                className="p-3 rounded flex items-center justify-center"
                                style={{
                                  backgroundColor: promoBannerForm.watch("bgColor"),
                                  color: promoBannerForm.watch("textColor"),
                                }}
                              >
                                {promoBannerForm.watch("text") || "Free shipping on orders over $75"}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="ml-auto" disabled={isLoading}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Banner Settings
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedAdminRoute>
  )
}

interface SettingCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}

function SettingCard({ title, description, icon, href }: SettingCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Link href={href} className="w-full">
          <Button variant="outline" className="w-full">
            Manage
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

