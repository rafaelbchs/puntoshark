"use server"

import { revalidatePath } from "next/cache"
import { getServiceSupabase } from "@/lib/supabase"
import type { PromoBanner } from "@/types/promo-banner"

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
  promoBanner?: PromoBanner
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

    // Get current settings
    const { data: currentSettings, error: getError } = await supabase
      .from("settings")
      .select("value")
      .eq("id", "store")
      .single()

    // Upsert settings
    const { error } = await supabase.from("settings").upsert({
      id: "store",
      value: settings,
      updated_at: new Date().toISOString(),
    })

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
    const { error } = await supabase.from("settings").upsert({
      id: "shipping",
      value: settings,
      updated_at: new Date().toISOString(),
    })

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
    const { error } = await supabase.from("settings").upsert({
      id: "notifications",
      value: settings,
      updated_at: new Date().toISOString(),
    })

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
      } else if (item.id === "promoBanner") {
        settings.promoBanner = item.value as PromoBanner
      }
    }

    return settings
  } catch (error) {
    console.error("Failed to get settings:", error)
    throw error
  }
}

// Add this function to get promo banner settings
export async function getPromoBannerSettings(): Promise<PromoBanner | null> {
  try {
    const supabase = getSupabase()

    // Get promo banner settings
    const { data, error } = await supabase.from("settings").select("value").eq("id", "promoBanner").single()

    if (error) {
      if (error.code === "PGRST116") {
        // No settings found
        return null
      }
      throw error
    }

    if (!data || !data.value) {
      return null
    }

    const banner = data.value as PromoBanner

    // Check if the banner should be active based on dates
    if (!banner.enabled) {
      return null
    }

    const now = new Date()
    const startDate = banner.startDate ? new Date(banner.startDate) : null
    const endDate = banner.endDate ? new Date(banner.endDate) : null

    const isWithinDateRange = (!startDate || now >= startDate) && (!endDate || now <= endDate)

    // Only return the banner if it's enabled and within date range
    if (!isWithinDateRange) {
      return null
    }

    return banner
  } catch (error) {
    console.error("Error fetching promo banner settings:", error)
    return null
  }
}

// Add this function to update promo banner settings
export async function savePromoBannerSettings(banner: PromoBanner): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabase()

    // Upsert promo banner settings
    const { error } = await supabase.from("settings").upsert({
      id: "promoBanner",
      value: banner,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error

    // Revalidate paths to update the banner everywhere
    revalidatePath("/")
    revalidatePath("/admin/settings")

    return { success: true }
  } catch (error) {
    console.error("Error saving promo banner settings:", error)
    return { success: false, error: error.message }
  }
}

