import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast(options: ToastOptions) {
  const { title, description, variant } = options
  if (variant === "destructive") {
    sonnerToast.error(title, { description })
  } else {
    sonnerToast(title, { description })
  }
}

export function useToast() {
  return { toast }
}
