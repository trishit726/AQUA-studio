"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/**
 * Drives the metallic `--sheen` highlight across a `.metal` button.
 * Sweeps on hover-in and gives a quick flash on press.
 */
export function useSheen<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReduced()) return

    gsap.set(el, { "--sheen": "-160%" })

    const sweep = (duration = 0.7) => {
      gsap.fromTo(
        el,
        { "--sheen": "-160%" },
        { "--sheen": "180%", duration, ease: "power2.out" },
      )
    }

    const onEnter = () => sweep(0.7)
    const onDown = () => sweep(0.45)

    el.addEventListener("pointerenter", onEnter)
    el.addEventListener("pointerdown", onDown)
    return () => {
      el.removeEventListener("pointerenter", onEnter)
      el.removeEventListener("pointerdown", onDown)
      gsap.killTweensOf(el)
    }
  }, [])

  return ref
}

/**
 * Staggers the direct children of the container into view on mount.
 * Used for the toolbar and panels so the editor "assembles" itself.
 */
export function useStagger<T extends HTMLElement>(opts?: {
  y?: number
  x?: number
  duration?: number
  stagger?: number
  delay?: number
}) {
  const ref = useRef<T>(null)
  const {
    y = 8,
    x = 0,
    duration = 0.5,
    stagger = 0.05,
    delay = 0,
  } = opts ?? {}

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const targets = Array.from(el.children) as HTMLElement[]
    if (targets.length === 0) return

    if (prefersReduced()) {
      gsap.set(targets, { opacity: 1, x: 0, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y, x },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration,
          stagger,
          delay,
          ease: "power3.out",
          clearProps: "transform,opacity",
        },
      )
    }, el)

    return () => ctx.revert()
  }, [x, y, duration, stagger, delay])

  return ref
}
