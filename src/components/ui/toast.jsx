import { cn } from "@/lib/utils"
import { X, Check, AlertTriangle, Info } from "lucide-react"
import { useEffect, useState } from "react"

// Simple custom toast — no Radix dependency, guaranteed visibility
function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = requestAnimationFrame(() => setVisible(true))
    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onDismiss(toast.id), 300)
    }, toast.duration || 3000)
    return () => {
      cancelAnimationFrame(timer)
      clearTimeout(dismissTimer)
    }
  }, [toast.id, toast.duration, onDismiss])

  const variants = {
    default: "bg-ivory border-sand text-charcoal",
    success: "bg-forest/5 border-forest/30 text-forest",
    destructive: "bg-ruby/5 border-ruby/30 text-ruby",
  }

  const icons = {
    success: <Check className="w-4 h-4 text-forest shrink-0" />,
    destructive: <AlertTriangle className="w-4 h-4 text-ruby shrink-0" />,
    default: <Info className="w-4 h-4 text-brass shrink-0" />,
  }

  const variant = toast.variant || 'default'

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full max-w-[360px] items-center gap-3 overflow-hidden rounded-xl border px-4 py-3 shadow-xl shadow-charcoal/10 transition-all duration-300",
        variants[variant],
        visible && !exiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      {icons[variant] || icons.default}
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-xs font-semibold">{toast.title}</p>}
        {toast.description && <p className="text-[11px] opacity-80 mt-0.5">{toast.description}</p>}
      </div>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300) }}
        className="rounded-lg p-1 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, dismiss }) {
  if (!toasts || toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  )
}
