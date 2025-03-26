"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Save, Store, Truck, Bell, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
import { saveStoreSettings, saveShippingSettings, saveNotificationSettings, getSettings } from "@/app/actions/settings"
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

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("store")
  const [isLoading, setIsLoading] = useState(true)

  // Store form
  const storeForm = useForm<z.infer<typeof storeFormSchema>>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      storeName: "",
      storeDescription: "",
      storeEmail: "",
      storePhone: "",
      storeAddress: "",
      storeCurrency: "USD",
      storeTimeZone: "America/New_York",
    },
  })

  // Shipping form
  const shippingForm = useForm<z.infer<typeof shippingFormSchema>>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      enableFreeShipping: false,
      freeShippingThreshold: 100,
      enableFlatRate: true,
      flatRateAmount: 10,
      enableLocalPickup: true,
    },
  })

  // Notification form
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

  // Load settings on page load
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        const settings = await getSettings()

        // Update store form
        if (settings.store) {
          storeForm.reset(settings.store)
        }

        // Update shipping form
        if (settings.shipping) {
          shippingForm.reset(settings.shipping)
        }

        // Update notification form
        if (settings.notifications) {
          // Convert handlebars syntax to our custom syntax for display
          const convertedTemplate = settings.notifications.emailTemplate
            ? convertFromHandlebars(settings.notifications.emailTemplate)
            : DEFAULT_EMAIL_TEMPLATE

          notificationForm.reset({
            ...settings.notifications,
            emailTemplate: convertedTemplate,
          })
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
        toast({
          title: "Error loading settings",
          description: "Could not load your settings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [storeForm, shippingForm, notificationForm])

  // Form submission handlers
  const onStoreSubmit = async (data: z.infer<typeof storeFormSchema>) => {
    try {
      await saveStoreSettings(data)
      toast({
        title: "Store settings updated",
        description: "Your store settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Failed to save store settings:", error)
      toast({
        title: "Error saving settings",
        description: "Could not save your store settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const onShippingSubmit = async (data: z.infer<typeof shippingFormSchema>) => {
    try {
      await saveShippingSettings(data)
      toast({
        title: "Shipping settings updated",
        description: "Your shipping settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Failed to save shipping settings:", error)
      toast({
        title: "Error saving settings",
        description: "Could not save your shipping settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const onNotificationSubmit = async (data: z.infer<typeof notificationFormSchema>) => {
    try {
      // Convert our custom syntax back to handlebars before saving
      const convertedData = {
        ...data,
        emailTemplate: convertToHandlebars(data.emailTemplate),
      }

      await saveNotificationSettings(convertedData)
      toast({
        title: "Notification settings updated",
        description: "Your notification settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Failed to save notification settings:", error)
      toast({
        title: "Error saving settings",
        description: "Could not save your notification settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <ProtectedAdminRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin: Settings</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
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
          </TabsList>

          {/* Store Settings */}
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

          {/* Shipping Settings */}
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

          {/* Notification Settings */}
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
                                <Textarea {...field} rows={10} className="font-mono text-sm" />
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
        </Tabs>
      </div>
    </ProtectedAdminRoute>
  )
}

