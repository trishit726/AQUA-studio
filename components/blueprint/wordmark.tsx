import { cn } from "@/lib/utils"

/**
 * The "aqua studio" logotype — rounded geometric, always lowercase, tight
 * tracking. `stack` renders it on two lines (hero); inline otherwise.
 * A single aqua dot is the only accent.
 */
export function Wordmark({
  className,
  stack = false,
  dot = true,
}: {
  className?: string
  stack?: boolean
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        "wordmark inline-flex items-baseline leading-[0.9] text-foreground",
        stack ? "flex-col items-start gap-0 leading-[0.82]" : "gap-[0.28em]",
        className,
      )}
    >
      <span>aqua</span>
      <span>
        studi
        <span className="relative">
          o
          {dot ? (
            <span
              aria-hidden
              className="absolute -top-[0.12em] right-[0.04em] inline-block size-[0.12em] rounded-full bg-aqua align-top"
            />
          ) : null}
        </span>
      </span>
    </span>
  )
}
