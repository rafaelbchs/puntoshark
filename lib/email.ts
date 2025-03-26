import { Resend } from "resend"
import { getSettings } from "@/app/actions/settings"
import type { Order } from "@/types/checkout"

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

// Function to send emails using Resend
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Get store settings for the from address
    const settings = await getSettings()
    const storeSettings = settings.store
    const storeName = storeSettings?.storeName || "Our Store"

    // You can customize this with your own domain once you set it up in Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: `${storeName} <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: html,
    })

    if (error) {
      console.error("Resend API error:", error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log("Email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { success: false, error }
  }
}

// Function to render email template with variables
export function renderEmailTemplate(template: string, data: Record<string, any>): string {
  let rendered = template

  // Replace simple variables
  for (const key in data) {
    if (typeof data[key] !== "object") {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g")
      rendered = rendered.replace(regex, String(data[key]))
    }
  }

  // Handle each loops
  const eachRegex = /{{#each\s+(\w+)\s*}}([\s\S]*?){{\/each}}/g
  let match

  while ((match = eachRegex.exec(template)) !== null) {
    const arrayName = match[1]
    const itemTemplate = match[2]
    const fullMatch = match[0]

    if (data[arrayName] && Array.isArray(data[arrayName])) {
      const renderedItems = data[arrayName]
        .map((item: any) => {
          let itemRendered = itemTemplate
          for (const key in item) {
            if (typeof item[key] !== "object") {
              const itemRegex = new RegExp(`{{\\s*${key}\\s*}}`, "g")
              itemRendered = itemRendered.replace(itemRegex, String(item[key]))
            }
          }
          return itemRendered
        })
        .join("")

      rendered = rendered.replace(fullMatch, renderedItems)
    }
  }

  return rendered
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(order: Order): Promise<{ success: boolean; error?: any }> {
  try {
    // Get notification settings
    const settings = await getSettings()
    const notificationSettings = settings.notifications

    // Check if email notifications are enabled
    if (!notificationSettings?.emailNotifications || !notificationSettings.orderConfirmation) {
      console.log("Order confirmation emails are disabled in settings")
      return { success: false, error: "Email notifications are disabled" }
    }

    // Get email template
    const emailTemplate =
      notificationSettings.emailTemplate ||
      `
      <h1>Thank you for your order!</h1>
      <p>Dear {{customerName}},</p>
      <p>We're pleased to confirm your order #{{orderId}}.</p>
      <h2>Order Details:</h2>
      <ul>
        {{#each items}}
        <li>{{quantity}}x {{name}} - ${{ price }}</li>
        {{/each}}
      </ul>
      <p><strong>Total: ${{ total }}</strong></p>
      <p>We'll notify you when your order ships.</p>
      <p>Thank you for shopping with us!</p>
    `

    // Prepare data for template
    const templateData = {
      customerName: order.customerInfo.name,
      orderId: order.id,
      items: order.items.map((item) => ({
        name: item.name,
        price: item.price.toFixed(2),
        quantity: item.quantity,
      })),
      total: order.total.toFixed(2),
    }

    // Render email template
    const html = renderEmailTemplate(emailTemplate, templateData)

    // Get store settings for the email subject
    const storeSettings = settings.store
    const storeName = storeSettings?.storeName || "Our Store"

    // Send email
    return await sendEmail(order.customerInfo.email, `Order Confirmation #${order.id} - ${storeName}`, html)
  } catch (error) {
    console.error("Failed to send order confirmation email:", error)
    return { success: false, error }
  }
}

// Send order status update email
export async function sendOrderStatusUpdateEmail(order: Order): Promise<{ success: boolean; error?: any }> {
  try {
    // Get notification settings
    const settings = await getSettings()
    const notificationSettings = settings.notifications

    // Check if email notifications and status updates are enabled
    if (!notificationSettings?.emailNotifications || !notificationSettings.orderStatusUpdate) {
      console.log("Order status update emails are disabled in settings")
      return { success: false, error: "Status update emails are disabled" }
    }

    // Get store settings
    const storeSettings = settings.store
    const storeName = storeSettings?.storeName || "Our Store"

    // Create status-specific content
    let statusTitle = ""
    let statusMessage = ""

    switch (order.status) {
      case "processing":
        statusTitle = "Your Order is Being Processed"
        statusMessage = "We're currently processing your order and will prepare it for shipping soon."
        break
      case "shipped":
        statusTitle = "Your Order Has Been Shipped"
        statusMessage = "Great news! Your order is on its way to you."
        break
      case "completed":
        statusTitle = "Your Order Has Been Completed"
        statusMessage = "Your order has been successfully completed. We hope you enjoy your purchase!"
        break
      case "cancelled":
        statusTitle = "Your Order Has Been Cancelled"
        statusMessage = "Your order has been cancelled. If you have any questions, please contact us."
        break
      default:
        statusTitle = "Order Status Update"
        statusMessage = `Your order status has been updated to: ${order.status}`
    }

    // Create email HTML
    const html = `
      <h1>${statusTitle}</h1>
      <p>Dear ${order.customerInfo.name},</p>
      <p>${statusMessage}</p>
      <p>Order #${order.id}</p>
      <h2>Order Details:</h2>
      <ul>
        ${order.items.map((item) => `<li>${item.quantity}x ${item.name} - $${item.price.toFixed(2)}</li>`).join("")}
      </ul>
      <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
      <p>Thank you for shopping with us!</p>
      <p>The ${storeName} Team</p>
    `

    // Send email
    return await sendEmail(order.customerInfo.email, `Order Status Update: ${statusTitle} - ${storeName}`, html)
  } catch (error) {
    console.error("Failed to send order status update email:", error)
    return { success: false, error }
  }
}

// Add this new function after the sendOrderStatusUpdateEmail function

// Send admin notification for new orders
export async function sendAdminOrderNotification(order: Order): Promise<{ success: boolean; error?: any }> {
  try {
    // Get notification settings
    const settings = await getSettings()
    const notificationSettings = settings.notifications

    // Check if email notifications are enabled and admin email is set
    if (!notificationSettings?.emailNotifications || !notificationSettings.adminEmail) {
      console.log("Admin notifications are disabled or admin email not set")
      return { success: false, error: "Admin notifications are disabled or admin email not set" }
    }

    // Get store settings
    const storeSettings = settings.store
    const storeName = storeSettings?.storeName || "Our Store"

    // Create email HTML
    const html = `
      <h1>New Order Received</h1>
      <p>A new order has been placed on your store.</p>
      <h2>Order Details:</h2>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      <p><strong>Customer:</strong> ${order.customerInfo.name}</p>
      <p><strong>Email:</strong> ${order.customerInfo.email}</p>
      <p><strong>Phone:</strong> ${order.customerInfo.phone || "Not provided"}</p>
      
      <h3>Delivery Information:</h3>
      <p><strong>Method:</strong> ${getDeliveryMethodText(order.customerInfo.deliveryMethod)}</p>
      ${
        order.customerInfo.deliveryMethod === "delivery"
          ? `<p><strong>Address:</strong> ${order.customerInfo.address}</p>`
          : order.customerInfo.deliveryMethod === "mrw"
            ? `<p><strong>MRW Office:</strong> ${order.customerInfo.mrwOffice}</p>`
            : ""
      }
      
      <h3>Payment Method:</h3>
      <p>${getPaymentMethodText(order.customerInfo.paymentMethod)}</p>
      
      <h3>Items:</h3>
      <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
        <tr>
          <th>Product</th>
          <th>Price</th>
          <th>Quantity</th>
          <th>Total</th>
        </tr>
        ${order.items
          .map(
            (item) => `
          <tr>
            <td>${item.name}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `,
          )
          .join("")}
      </table>
      
      <p><strong>Total Amount: $${order.total.toFixed(2)}</strong></p>
      
      <p>Please log in to your admin dashboard to process this order.</p>
    `

    // Send email to admin
    return await sendEmail(notificationSettings.adminEmail, `New Order #${order.id} - ${storeName}`, html)
  } catch (error) {
    console.error("Failed to send admin order notification:", error)
    return { success: false, error }
  }
}

// Helper functions for formatting
function getDeliveryMethodText(method?: string): string {
  switch (method) {
    case "mrw":
      return "Envío Nacional (MRW)"
    case "delivery":
      return "Delivery (Maracaibo)"
    case "pickup":
      return "Pick-Up"
    default:
      return method || "Not specified"
  }
}

function getPaymentMethodText(method?: string): string {
  switch (method) {
    case "pagoMovil":
      return "Pago Móvil"
    case "zelle":
      return "Zelle"
    case "binance":
      return "Binance"
    case "efectivo":
      return "Efectivo"
    default:
      return method || "Not specified"
  }
}

