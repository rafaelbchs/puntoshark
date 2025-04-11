import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
