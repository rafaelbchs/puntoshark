"use server"

import { revalidatePath } from "next/cache"
import { getServiceSupabase } from "@/lib/supabase"

// Get Supabase admin client
const getSupabase = () => getServiceSupabase()

// Define types for settings
export type StoreSettings = {
  storeName: string
  storeDescription?: string
  storeEmail: string
  storePhone?: string
  storeAddress?: string
  storeCurrency: string
  storeTimeZone: string
}

export type ShippingSettings = {
  enableFreeShipping: boolean
  freeShippingThreshold?: number
  enableFlatRate: boolean
  flatRateAmount?: number
  enableLocalPickup: boolean
}

export type NotificationSettings = {
  emailNotifications: boolean
  orderConfirmation: boolean
  orderStatusUpdate: boolean
  lowStockAlert: boolean
  lowStockThreshold: number
  adminEmail: string
  emailTemplate?: string
}

export type AllSettings = {
  store?: StoreSettings
  shipping?: ShippingSettings
  notifications?: NotificationSettings
}

// Save store settings
export async function saveStoreSettings(settings: StoreSettings) {
  try {
    const supabase = getSupabase()

    // Check if settings table exists, create if not
    const { error: tableCheckError } = await supabase.from("settings").select("id").limit(1)

    if (tableCheckError && tableCheckError.code === "42P01") {
      // Table doesn't exist, create it
      await supabase.rpc("create_settings_table")
    }

    // Upsert settings
    const { error } = await supabase
      .from("settings")
      .upsert({ id: "store", value: settings, updated_at: new Date().toISOString() })

    if (error) throw error

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to save store settings:", error)
    throw error
  }
}

// Save shipping settings
export async function saveShippingSettings(settings: ShippingSettings) {
  try {
    const supabase = getSupabase()

    // Check if settings table exists, create if not
    const { error: tableCheckError } = await supabase.from("settings").select("id").limit(1)

    if (tableCheckError && tableCheckError.code === "42P01") {
      // Table doesn't exist, create it
      await supabase.rpc("create_settings_table")
    }

    // Upsert settings
    const { error } = await supabase
      .from("settings")
      .upsert({ id: "shipping", value: settings, updated_at: new Date().toISOString() })

    if (error) throw error

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to save shipping settings:", error)
    throw error
  }
}

// Save notification settings
export async function saveNotificationSettings(settings: NotificationSettings) {
  try {
    const supabase = getSupabase()

    // Check if settings table exists, create if not
    const { error: tableCheckError } = await supabase.from("settings").select("id").limit(1)

    if (tableCheckError && tableCheckError.code === "42P01") {
      // Table doesn't exist, create it
      await supabase.rpc("create_settings_table")
    }

    // Upsert settings
    const { error } = await supabase
      .from("settings")
      .upsert({ id: "notifications", value: settings, updated_at: new Date().toISOString() })

    if (error) throw error

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to save notification settings:", error)
    throw error
  }
}

// Get all settings
export async function getSettings(): Promise<AllSettings> {
  try {
    const supabase = getSupabase()

    // Check if settings table exists
    const { error: tableCheckError } = await supabase.from("settings").select("id").limit(1)

    if (tableCheckError && tableCheckError.code === "42P01") {
      // Table doesn't exist, return empty settings
      return {}
    }

    // Get all settings
    const { data, error } = await supabase.from("settings").select("id, value")

    if (error) throw error

    // Transform data into settings object
    const settings: AllSettings = {}

    for (const item of data) {
      if (item.id === "store") {
        settings.store = item.value as StoreSettings
      } else if (item.id === "shipping") {
        settings.shipping = item.value as ShippingSettings
      } else if (item.id === "notifications") {
        settings.notifications = item.value as NotificationSettings
      }
    }

    return settings
  } catch (error) {
    console.error("Failed to get settings:", error)
    throw error
  }
}

