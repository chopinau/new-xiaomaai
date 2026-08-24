"use client"

import * as React from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-xl border p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
  {
    variants: {
      variant: {
        default: "border-ink-200 bg-white text-ink-900",
        success: "border-emerald-200 bg-emerald-50 text-emerald-900",
        destructive: "border-red-200 bg-red-50 text-red-900",
        warning: "border-amber-200 bg-amber-50 text-amber-900",
        info: "border-brand-purple/20 bg-white text-ink-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const icons = {
  default: Info,
  success: CheckCircle,
  destructive: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  title?: string
  description?: string
  onClose?: () => void
}

export function Toast({ className, variant = "default", title, description, onClose, children, ...props }: ToastProps) {
  const Icon = icons[variant || "default"]

  return (
    <div className={cn(toastVariants({ variant }), className)} {...props}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", {
          "text-emerald-600": variant === "success",
          "text-red-600": variant === "destructive",
          "text-amber-600": variant === "warning",
          "text-brand-purple": variant === "info" || variant === "default",
        })} />
        <div className="flex-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && <div className="text-xs opacity-90 mt-0.5">{description}</div>}
          {children}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-600"
          aria-label="关闭通知"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// 全局 Toast 状态管理
export type ToastItem = {
  id: string
  variant: "default" | "success" | "destructive" | "warning" | "info"
  title?: string
  description?: string
  duration?: number
}

const ToastContext = React.createContext<{
  toasts: ToastItem[]
  toast: (item: Omit<ToastItem, "id">) => string
  dismiss: (id: string) => void
}>({
  toasts: [],
  toast: () => "",
  dismiss: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const toast = React.useCallback((item: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { id, ...item }])
    if (item.duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, item.duration || 4000)
    }
    return id
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]">
        {toasts.map((item, index) => (
          <div
            key={item.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Toast
              variant={item.variant}
              title={item.title}
              description={item.description}
              onClose={() => dismiss(item.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => React.useContext(ToastContext)
