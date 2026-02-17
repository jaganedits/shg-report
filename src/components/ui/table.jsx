import { cn } from "@/lib/utils"
import { forwardRef } from "react"

const Table = forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
))
Table.displayName = "Table"

const TableHeader = forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("bg-cream-dark/50", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
))
TableBody.displayName = "TableBody"

const TableFooter = forwardRef(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={cn("bg-terracotta-deep/5 font-bold", className)} {...props} />
))
TableFooter.displayName = "TableFooter"

const TableRow = forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b border-sand/40 transition-colors hover:bg-cream-dark/30", className)} {...props} />
))
TableRow.displayName = "TableRow"

const TableHead = forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("py-2 px-3 text-right text-[10px] font-semibold text-smoke uppercase tracking-wider font-body", className)} {...props} />
))
TableHead.displayName = "TableHead"

const TableCell = forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("py-2 px-3 text-right text-xs", className)} {...props} />
))
TableCell.displayName = "TableCell"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
}
