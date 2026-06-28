"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
} as const

type PillButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * "outline" = ink hairline pill (default).
   * "solid"   = flat aqua fill.
   * "metal"   = metallic aqua with specular + sheen (primary action).
   * "glass"   = frosted liquid-glass (secondary action).
   */
  variant?: "outline" | "solid" | "metal" | "glass"
  size?: keyof typeof sizes
  asChild?: boolean
}

const variants = {
  outline: "",
  solid: "pill-solid",
  metal: "pill-metal",
  glass: "pill-glass",
} as const

/**
 * Outlined-pill button for the aqua-studio blueprint identity.
 * Transparent fill + ink hairline; hover reveals an aqua ring. Subtle
 * press/hover physics via Framer Motion, disabled under reduced motion.
 */
export const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ className, variant = "outline", size = "md", asChild, children, ...props }, ref) => {
    const Comp: any = asChild ? Slot : motion.button
    const motionProps = asChild
      ? {}
      : {
          whileHover: { y: -1 },
          whileTap: { scale: 0.97 },
          transition: { type: "spring", stiffness: 500, damping: 30 },
        }

    return (
      <Comp
        ref={ref}
        className={cn(
          "pill font-sans font-medium tracking-tight select-none",
          variants[variant],
          sizes[size],
          className,
        )}
        {...motionProps}
        {...props}
      >
        {children}
      </Comp>
    )
  },
)
PillButton.displayName = "PillButton"
