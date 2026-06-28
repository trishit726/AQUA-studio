"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: 0.1 + i * 0.08, duration: 0.9, ease: "easeInOut" as const },
      opacity: { delay: 0.1 + i * 0.08, duration: 0.2 },
    },
  }),
}

/**
 * Decorative blueprint construction lines — hairline guides, crosshairs,
 * dimension ticks and outlined construction circles, as if a logo were
 * being measured. Pure decoration; never interactive.
 */
export function ConstructionLines({ className }: { className?: string }) {
  const line = "var(--line)"
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      viewBox="0 0 1200 600"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <motion.g
        initial="hidden"
        animate="show"
        stroke={line}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      >
        {/* Long horizontal guides */}
        <motion.line x1="0" y1="200" x2="1200" y2="200" variants={draw} custom={0} />
        <motion.line x1="0" y1="400" x2="1200" y2="400" variants={draw} custom={1} />
        {/* Vertical guides */}
        <motion.line x1="360" y1="0" x2="360" y2="600" variants={draw} custom={2} />
        <motion.line x1="840" y1="0" x2="840" y2="600" variants={draw} custom={3} />
        {/* Diagonal armature */}
        <motion.line x1="360" y1="600" x2="600" y2="40" variants={draw} custom={4} />
        <motion.line x1="840" y1="600" x2="600" y2="40" variants={draw} custom={5} />

        {/* Outlined construction circles */}
        <motion.circle cx="600" cy="300" r="150" variants={draw} custom={4} />
        <motion.circle cx="600" cy="300" r="96" variants={draw} custom={5} />
        <motion.circle cx="840" cy="200" r="44" variants={draw} custom={6} />

        {/* Crosshair at the measured center */}
        <motion.line x1="560" y1="300" x2="640" y2="300" variants={draw} custom={6} />
        <motion.line x1="600" y1="260" x2="600" y2="340" variants={draw} custom={7} />

        {/* Dimension ticks along the top guide */}
        {Array.from({ length: 13 }).map((_, i) => (
          <motion.line
            key={i}
            x1={120 + i * 80}
            y1="194"
            x2={120 + i * 80}
            y2="206"
            variants={draw}
            custom={7 + i * 0.15}
          />
        ))}
      </motion.g>
    </svg>
  )
}
