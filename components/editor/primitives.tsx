"use client"

import type React from "react"
import { cn } from "@/lib/utils"

/** A labelled control group used throughout the right control rail. */
export const Field: React.FC<{
  label: string
  value?: number | string
  children: React.ReactNode
  className?: string
}> = ({ label, value, children, className }) => (
  <div className={cn("flex flex-col gap-2.5", className)}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {value !== undefined ? (
        <span className="font-mono text-xs tabular-nums text-foreground/80">{value}</span>
      ) : null}
    </div>
    {children}
  </div>
)

/**
 * Premium segmented "bar" slider — click any segment to set the value.
 * Filled segments use the brand accent; hover lifts the segment slightly.
 */
export const BarSlider: React.FC<{
  value: number
  max: number
  min?: number
  onChange: (v: number) => void
}> = ({ value, max, min = 1, onChange }) => (
  <div className="flex w-full items-end gap-1">
    {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((v) => {
      const on = v <= value
      return (
        <button
          key={v}
          type="button"
          aria-label={`Set value ${v}`}
          onClick={() => onChange(v)}
          className={cn(
            "h-5 flex-1 cursor-pointer rounded-[3px] transition-all duration-150",
            "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
            on ? "bg-primary" : "bg-secondary hover:bg-secondary/70",
          )}
        />
      )
    })}
  </div>
)

/** A reusable color swatch backed by a hidden native color input. */
export const ColorSwatch: React.FC<{
  color: string
  onChange: (v: string) => void
  title?: string
  className?: string
}> = ({ color, onChange, title, className }) => (
  <label
    title={title}
    className={cn(
      "relative size-9 cursor-pointer overflow-hidden rounded-md border border-border/80 shadow-sm transition-transform hover:scale-105",
      className,
    )}
    style={{ background: color }}
  >
    <input
      type="color"
      value={color}
      onChange={(e) => onChange(e.target.value)}
      className="absolute inset-0 size-full cursor-pointer opacity-0"
    />
  </label>
)
