import { cn } from "@/lib/utils"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

function Avatar({ className, ...props }) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }) {
  return (
    <AvatarPrimitive.Image
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-brass/60 to-terracotta-light/60 text-cream font-bold shadow-inner",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
