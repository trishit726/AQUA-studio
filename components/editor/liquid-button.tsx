"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useSheen } from "./use-motion"

const liquidVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:z-[3] [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>span]:z-[3]",
  {
    variants: {
      finish: {
        /* Brushed metallic aqua — for the primary action (Render). */
        metal: "metal",
        /* Frosted liquid glass — for secondary chrome actions. */
        glass: "glass-btn text-foreground",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      finish: "metal",
      size: "default",
    },
  },
)

export interface LiquidButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof liquidVariants> {}

export function LiquidButton({
  className,
  finish = "metal",
  size = "default",
  children,
  ...props
}: LiquidButtonProps) {
  const ref = useSheen<HTMLButtonElement>()
  return (
    <button
      ref={ref}
      data-slot="liquid-button"
      className={cn(liquidVariants({ finish, size, className }))}
      {...props}
    >
      {children}
    </button>
  )
}
