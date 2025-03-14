"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children)
}

const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
          className,
        )}
        {...props}
      />
    )
  },
)
ToastViewport.displayName = "ToastViewport"

const Toast = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        "animate-in slide-in-from-right-full",
        className,
      )}
      {...props}
    />
  )
})
Toast.displayName = "Toast"

const ToastTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("mb-1 text-sm font-semibold", className)} {...props} />
  },
)
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
  },
)
ToastDescription.displayName = "ToastDescription"

const ToastClose = React.forwardRef<HTMLButtonElement, React.HTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
          className,
        )}
        {...props}
      />
    )
  },
)
ToastClose.displayName = "ToastClose"

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose }

