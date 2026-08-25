import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

/**
 * A styled native `<select>` wrapper. We deliberately use the native control
 * (rather than the Radix listbox) for the admin console: it is fully keyboard
 * and screen-reader accessible for free, plays well with native form
 * submission, and keeps the enum dropdowns (channel, movement reason, content
 * type, …) simple. Options are passed as children `<option>` elements.
 */
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "flex h-9 w-full appearance-none rounded-md border bg-background px-3 py-1 pr-8 text-sm shadow-xs transition-[color,box-shadow] outline-none",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { Select }
