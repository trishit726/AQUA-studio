"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "motion/react"
import { ArrowUpRight, Play } from "lucide-react"
import { Wordmark } from "@/components/blueprint/wordmark"
import { Bubbles } from "@/components/blueprint/bubbles"
import { ConstructionLines } from "@/components/blueprint/construction-lines"
import { PillButton } from "@/components/blueprint/pill-button"

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

const SPECS = [
  { k: "01", label: "procedural pattern engine", note: "seed-driven swiss grids" },
  { k: "02", label: "live remotion preview", note: "frame-accurate scrubbing" },
  { k: "03", label: "ai brand generation", note: "palette · motion · type" },
]

export function Hero() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Decoration */}
      <div className="blueprint-grid pointer-events-none absolute inset-0" />
      <ConstructionLines className="opacity-70" />
      <Bubbles />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Wordmark className="text-xl" />
        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-[11px] uppercase tracking-widest text-muted-foreground sm:block">
            v1.0 — motion studio
          </span>
          <PillButton asChild size="sm">
            <Link href="/editor">
              open editor
              <ArrowUpRight className="size-3.5" />
            </Link>
          </PillButton>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <motion.p
          variants={rise}
          custom={0}
          initial="hidden"
          animate="show"
          className="mb-6 font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground"
        >
          swiss · blueprint · motion graphics
        </motion.p>

        <motion.div
          variants={rise}
          custom={1}
          initial="hidden"
          animate="show"
          className="relative w-full max-w-3xl"
        >
          <Image
            src="/images/aqua-studio-logo.png"
            alt="aqua studio — logotype on a blueprint construction grid"
            width={1680}
            height={945}
            priority
            className="h-auto w-full mix-blend-multiply select-none"
          />
        </motion.div>

        <motion.p
          variants={rise}
          custom={2}
          initial="hidden"
          animate="show"
          className="mt-8 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          A measured studio for animated title cards and multi-scene reels — drawn on a grid,
          rendered in real time.
        </motion.p>

        <motion.div
          variants={rise}
          custom={3}
          initial="hidden"
          animate="show"
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <PillButton asChild variant="solid" size="lg">
            <Link href="/editor">
              <Play className="size-4" />
              open editor
            </Link>
          </PillButton>
          <PillButton asChild size="lg">
            <Link href="/editor">view compositions</Link>
          </PillButton>
        </motion.div>
      </section>

      {/* Spec strip */}
      <motion.footer
        variants={rise}
        custom={4}
        initial="hidden"
        animate="show"
        className="relative z-10 grid grid-cols-1 border-t border-border sm:grid-cols-3"
      >
        {SPECS.map((s, i) => (
          <div
            key={s.k}
            className={
              "flex items-baseline gap-3 px-6 py-5 md:px-10" +
              (i > 0 ? " border-t border-border sm:border-l sm:border-t-0" : "")
            }
          >
            <span className="font-mono text-[11px] text-aqua">{s.k}</span>
            <div className="flex flex-col">
              <span className="text-sm font-medium lowercase tracking-tight">{s.label}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{s.note}</span>
            </div>
          </div>
        ))}
      </motion.footer>
    </main>
  )
}
