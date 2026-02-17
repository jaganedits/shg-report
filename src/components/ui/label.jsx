import { cn } from "@/lib/utils"
import * as LabelPrimitive from "@radix-ui/react-label"

function Label({ className, ...props }) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "block text-[10px] font-semibold text-smoke uppercase tracking-wider mb-1",
        className
      )}
      {...props}
    />
  )
}

export { Label }
