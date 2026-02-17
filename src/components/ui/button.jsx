import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"

function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button"
  const variants = {
    default: "bg-terracotta-deep text-cream hover:bg-terracotta shadow-md shadow-terracotta/15",
    destructive: "bg-ruby/10 text-ruby hover:bg-ruby/20 border border-ruby/20",
    outline: "border border-sand bg-ivory hover:bg-cream-dark text-charcoal",
    secondary: "bg-sand/60 text-charcoal hover:bg-sand",
    success: "bg-forest/10 text-forest hover:bg-forest/20 border border-forest/20",
    ghost: "text-smoke hover:text-charcoal hover:bg-sand/40",
    link: "text-terracotta underline-offset-4 hover:underline",
  }
  const sizes = {
    default: "h-9 px-4 py-2 text-xs",
    sm: "h-8 rounded-lg px-3 text-[11px]",
    xs: "h-7 rounded-lg px-2 text-[10px]",
    lg: "h-10 rounded-lg px-6 text-sm",
    icon: "h-9 w-9",
    "icon-sm": "h-7 w-7",
  }
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}
export { Button }
