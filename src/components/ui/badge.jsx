import { cn } from "@/lib/utils"

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-terracotta/10 text-terracotta border-terracotta/20",
    secondary: "bg-sand/60 text-charcoal border-sand",
    success: "bg-forest/10 text-forest border-forest/20",
    destructive: "bg-ruby/10 text-ruby border-ruby/20",
    outline: "bg-transparent text-smoke border-sand",
    admin: "bg-terracotta/10 text-terracotta border-terracotta/20",
    member: "bg-forest/10 text-forest border-forest/20",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
