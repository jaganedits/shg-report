import { cn } from "@/lib/utils"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger

function AlertDialogOverlay({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border border-sand bg-ivory p-6 shadow-xl animate-scale-in",
          className
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  )
}

function AlertDialogHeader({ className, ...props }) {
  return (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
  )
}

function AlertDialogFooter({ className, ...props }) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
  )
}

function AlertDialogTitle({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Title
      className={cn("font-display text-base font-semibold text-charcoal", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Description
      className={cn("text-xs text-smoke", className)}
      {...props}
    />
  )
}

function AlertDialogAction({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium bg-terracotta-deep text-cream hover:bg-terracotta shadow-md shadow-terracotta/15 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogCancel({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-medium text-smoke hover:text-charcoal hover:bg-sand/40 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40",
        className
      )}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
