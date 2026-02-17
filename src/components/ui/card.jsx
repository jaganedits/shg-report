import { cn } from "@/lib/utils"

function Card({ className, ...props }) {
  return <div className={cn("rounded-xl border border-sand bg-ivory shadow-sm overflow-hidden relative", className)} {...props} />
}
function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1 px-4 pt-3 pb-2 border-b border-sand/60", className)} {...props} />
}
function CardTitle({ className, ...props }) {
  return <h3 className={cn("font-display text-sm font-semibold text-charcoal", className)} {...props} />
}
function CardDescription({ className, ...props }) {
  return <p className={cn("text-[10px] text-smoke", className)} {...props} />
}
function CardContent({ className, ...props }) {
  return <div className={cn("p-4", className)} {...props} />
}
function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center px-4 pb-4 pt-0", className)} {...props} />
}
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
