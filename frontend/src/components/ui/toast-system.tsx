"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Simple toast system using a global event emitter pattern
type ToastVariant = "default" | "destructive"

interface ToastData {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

// Global toast state
let globalSetToasts: React.Dispatch<React.SetStateAction<ToastData[]>> | null = null

export const useToast = () => {
  const toast = React.useCallback(
    (props: { title: string; description?: string; variant?: ToastVariant }) => {
      const id = Math.random().toString(36).slice(2, 9)
      const newToast: ToastData = { id, ...props }

      if (globalSetToasts) {
        globalSetToasts((prev) => [...prev, newToast])
        // Auto-dismiss after 4 seconds
        setTimeout(() => {
          globalSetToasts?.((prev) => prev.filter((t) => t.id !== id))
        }, 4000)
      }
    },
    []
  )

  return { toast }
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastData[]>([])

  React.useEffect(() => {
    globalSetToasts = setToasts
    return () => {
      globalSetToasts = null
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5 bg-background",
            toast.variant === "destructive"
              ? "border-destructive/50 text-destructive"
              : "border-border"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
              )}
            </div>
            <button
              className="text-muted-foreground hover:text-foreground text-lg leading-none"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
