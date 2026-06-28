import { cn } from "@/lib/utils"

type Bubble = {
  left: number // %
  size: number // px
  duration: number // s
  delay: number // s
  drift: number // px
  opacity: number
}

// Deterministic specs so SSR and client markup match (no hydration mismatch).
const BUBBLES: Bubble[] = [
  { left: 8, size: 14, duration: 22, delay: 0, drift: 18, opacity: 0.35 },
  { left: 17, size: 28, duration: 28, delay: 6, drift: -22, opacity: 0.28 },
  { left: 26, size: 9, duration: 17, delay: 3, drift: 14, opacity: 0.4 },
  { left: 38, size: 40, duration: 34, delay: 10, drift: 26, opacity: 0.2 },
  { left: 47, size: 12, duration: 20, delay: 1.5, drift: -12, opacity: 0.36 },
  { left: 56, size: 22, duration: 26, delay: 8, drift: 20, opacity: 0.26 },
  { left: 64, size: 7, duration: 15, delay: 4.5, drift: 10, opacity: 0.42 },
  { left: 73, size: 33, duration: 31, delay: 12, drift: -24, opacity: 0.22 },
  { left: 82, size: 16, duration: 23, delay: 2.5, drift: 16, opacity: 0.32 },
  { left: 91, size: 11, duration: 19, delay: 7, drift: -14, opacity: 0.38 },
]

/**
 * Rising bubbles — outlined (not filled) circles drifting slowly upward in
 * the background. Subtle, low opacity, purely decorative.
 */
export function Bubbles({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="animate-bubble absolute bottom-[-12vh] rounded-full border border-ink/40"
          style={
            {
              left: `${b.left}%`,
              width: b.size,
              height: b.size,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
              "--bubble-drift": `${b.drift}px`,
              "--bubble-duration": `${b.duration}s`,
              "--bubble-opacity": b.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
