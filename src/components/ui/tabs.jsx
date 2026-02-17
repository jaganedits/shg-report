import { cn } from "@/lib/utils"
import * as TabsPrimitive from "@radix-ui/react-tabs"

const Tabs = TabsPrimitive.Root

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-0 overflow-x-auto",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs font-medium text-smoke transition-all duration-300 shrink-0 group",
        "hover:text-charcoal-light",
        "data-[state=active]:text-terracotta-deep",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/30",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/30 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
