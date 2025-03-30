import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as a currency string
 *
 * @param value - The number to format
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param currency - The currency code to use (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, locale = "en-US", currency = "USD"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

