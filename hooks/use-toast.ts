"use client"

import { useState, useEffect } from "react"

export type ToastProps = {
  id: string
  title?: string
  description?: string
  duration?: number
  variant?: "default" | "destructive"
}

// Global state for toasts
let toasts: ToastProps[] = []
let listeners: ((toasts: ToastProps[]) => void)[] = []

// Function to notify all listeners of state changes
const notifyListeners = () => {
  listeners.forEach((listener) => listener([...toasts]))
}

// Generate a unique ID for each toast
const generateId = () => {
  return Math.random().toString(36).substring(2, 9)
}

export function toast({ title, description, duration = 5000, variant = "default" }: Omit<ToastProps, "id">) {
  const id = generateId()

  // Add the toast to the global state
  toasts = [...toasts, { id, title, description, duration, variant }]
  notifyListeners()

  // Set up auto-dismiss
  if (duration > 0) {
    setTimeout(() => {
      dismiss(id)
    }, duration)
  }

  return {
    id,
    dismiss: () => dismiss(id),
    update: (props: Partial<Omit<ToastProps, "id">>) => {
      toasts = toasts.map((t) => (t.id === id ? { ...t, ...props } : t))
      notifyListeners()
    },
  }
}

export function dismiss(id?: string) {
  if (id) {
    toasts = toasts.filter((t) => t.id !== id)
  } else {
    toasts = []
  }
  notifyListeners()
}

export function useToast() {
  const [state, setState] = useState<ToastProps[]>(toasts)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((listener) => listener !== setState)
    }
  }, [])

  return {
    toasts: state,
    toast,
    dismiss,
  }
}

