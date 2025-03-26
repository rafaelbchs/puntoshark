"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Save, Store, CreditCard, Truck, Bell, User, Key, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
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

const accountFormSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  name: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
})

const paymentFormSchema = z.object({
  enablePayPal: z.boolean().default(false),
  payPalEmail: z.string().email().optional(),
  enableStripe: z.boolean().default(false),
  stripeKey: z.string().optional(),
  enableCashOnDelivery: z.boolean().default(true),
  enableBankTransfer: z.boolean().default(false),
  bankDetails: z.string().optional(),
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
})

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("store")

  // Store form
  const storeForm = useForm<z.infer<typeof storeFormSchema>>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      storeName: "My Store",
      storeDescription: "Your one-stop shop for quality products",
      storeEmail: "contact@mystore.com",
      storePhone: "+1 (555) 123-4567",
      storeAddress: "123 Main St, City, Country",
      storeCurrency: "USD",
      storeTimeZone: "America/New_York",
    },
  })

  // Account form
  const accountForm = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      username: "admin",
      name: "Admin User",
      email: "admin@example.com",
    },
  })

  // Payment form
  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      enablePayPal: false,
      enableStripe: false,
      enableCashOnDelivery: true,
      enableBankTransfer: true,
      bankDetails: "Bank: Example Bank\nAccount: 1234567890\nName: My Store",
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
      adminEmail: "admin@example.com",
    },
  })

  // Form submission handlers
  const onStoreSubmit = (data: z.infer<typeof storeFormSchema>) => {
    console.log("Store settings:", data)
    toast({
      title: "Store settings updated",
      description: "Your store settings have been saved successfully.",
    })
  }

  const onAccountSubmit = (data: z.infer<typeof accountFormSchema>) => {
    console.log("Account settings:", data)
    toast({
      title: "Account settings updated",
      description: "Your account settings have been saved successfully.",
    })
  }

  const onPaymentSubmit = (data: z.infer<typeof paymentFormSchema>) => {
    console.log("Payment settings:", data)
    toast({
      title: "Payment settings updated",
      description: "Your payment settings have been saved successfully.",
    })
  }

  const onShippingSubmit = (data: z.infer<typeof shippingFormSchema>) => {
    console.log("Shipping settings:", data)
    toast({
      title: "Shipping settings updated",
      description: "Your shipping settings have been saved successfully.",
    })
  }

  const onNotificationSubmit = (data: z.infer<typeof notificationFormSchema>) => {
    console.log("Notification settings:", data)
    toast({
      title: "Notification settings updated",
      description: "Your notification settings have been saved successfully.",
    })
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
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
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
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="ml-auto">
                      <Save className="mr-2 h-4 w-4" />
                      Save Store Settings
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your admin account</CardDescription>
              </CardHeader>
              <Form {...accountForm}>
                <form onSubmit={accountForm.handleSubmit(onAccountSubmit)}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={accountForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={accountForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={accountForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-4 flex items-center">
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                      </h3>

                      <div className="space-y-4">
                        <FormField
                          control={accountForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={accountForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={accountForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="ml-auto">
                      <Save className="mr-2 h-4 w-4" />
                      Save Account Settings
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Configure payment methods for your store</CardDescription>
              </CardHeader>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">PayPal</h3>
                      <FormField
                        control={paymentForm.control}
                        name="enablePayPal"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable PayPal</FormLabel>
                              <FormDescription>Allow customers to pay with PayPal</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {paymentForm.watch("enablePayPal") && (
                        <FormField
                          control={paymentForm.control}
                          name="payPalEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PayPal Email</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Stripe</h3>
                      <FormField
                        control={paymentForm.control}
                        name="enableStripe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Stripe</FormLabel>
                              <FormDescription>Allow customers to pay with credit cards via Stripe</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {paymentForm.watch("enableStripe") && (
                        <FormField
                          control={paymentForm.control}
                          name="stripeKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stripe API Key</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Cash on Delivery</h3>
                      <FormField
                        control={paymentForm.control}
                        name="enableCashOnDelivery"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Cash on Delivery</FormLabel>
                              <FormDescription>Allow customers to pay when they receive their order</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Bank Transfer</h3>
                      <FormField
                        control={paymentForm.control}
                        name="enableBankTransfer"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Bank Transfer</FormLabel>
                              <FormDescription>Allow customers to pay via bank transfer</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {paymentForm.watch("enableBankTransfer") && (
                        <FormField
                          control={paymentForm.control}
                          name="bankDetails"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Details</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={4} />
                              </FormControl>
                              <FormDescription>
                                These details will be shown to customers who choose to pay by bank transfer
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="ml-auto">
                      <Save className="mr-2 h-4 w-4" />
                      Save Payment Settings
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
                              <FormDescription>Orders above this amount will qualify for free shipping</FormDescription>
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
                              <FormDescription>Allow customers to pick up orders from your location</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="ml-auto">
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

                    <FormField
                      control={notificationForm.control}
                      name="adminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Email for Notifications</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>All admin notifications will be sent to this email address</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="ml-auto">
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

