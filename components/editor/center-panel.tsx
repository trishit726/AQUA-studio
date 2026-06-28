"use client"

import {
  Copy,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Film,
  MonitorPlay,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { useEditor } from "./editor-provider"
import { SafePlayer } from "./safe-player"
import { calculateTimelineDuration } from "@/src/compositions/Timeline"

function statusText(e: ReturnType<typeof useEditor>) {
  if (e.status) return e.status
  switch (e.comp) {
    case "Assembly":
      return "Assembly — the full ~18.5s film. Edit title, site & music on the right."
    case "Intro":
      return "Intro — the animated opener (~16.7s). Edit text & audio on the right."
    case "FourCardsGrid":
      return "Workflow Grid — a 4-card horizontal sequence. Edit cards on the right."
    case "Timeline":
      return `Scene ${e.current + 1} of ${e.scenes.length} · ${
        e.previewMode === "reel" ? "full reel preview (drag disabled)" : "editing this scene — drag titles to reposition"
      }`
    default:
      return e.sel
        ? `Dragging "${e.sel.text.replace(/\n/g, " ")}" — pick another title to move it.`
        : "Add a title on the right to begin."
  }
}

export function CenterPanel() {
  const e = useEditor()

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-background">
      {/* Canvas */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6 lg:p-10">
        <div className="w-full max-w-4xl">
          <div className="relative overflow-hidden rounded-xl border border-border bg-black shadow-2xl shadow-black/50 ring-1 ring-white/5">
            <SafePlayer />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground text-pretty">{statusText(e)}</p>
        </div>
      </div>

      {/* Timeline track (only for multi-scene Timeline) */}
      {e.comp === "Timeline" ? <TimelineTrack /> : null}
    </div>
  )
}

function TimelineTrack() {
  const e = useEditor()
  const { FPS, pxPerSec } = e
  const ls = e.liveScenes()

  let acc = 0
  const clips = ls.map((s) => {
    const left = (acc / FPS) * pxPerSec
    const width = (s.durationInFrames / FPS) * pxPerSec
    acc += s.durationInFrames
    return { s, left, width }
  })
  const sumSec = acc / FPS
  const totalFrames = calculateTimelineDuration(ls)
  const factor = totalFrames > 0 ? acc / totalFrames : 1
  const ticks: number[] = []
  for (let t = 0; t <= Math.ceil(sumSec); t += 5) ticks.push(t)
  const trackW = Math.max(sumSec * pxPerSec + 40, 320)

  const seek = (clientX: number, el: HTMLDivElement) => {
    const r = el.getBoundingClientRect()
    const sec = (clientX + el.scrollLeft - r.left) / pxPerSec
    e.playerRef.current?.seekTo(Math.max(0, Math.round((sec / factor) * FPS)))
  }

  return (
    <div className="shrink-0 border-t border-border bg-sidebar/60">
      <div className="flex items-center gap-1.5 px-4 py-2.5">
        <Button variant="secondary" size="sm" className="h-7 gap-1.5 px-2.5" onClick={e.addScene}>
          <Plus className="size-3.5" />
          Scene
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2.5" onClick={e.duplicateScene}>
          <Copy className="size-3.5" />
          Duplicate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2.5 text-muted-foreground hover:text-destructive"
          onClick={() => e.deleteScene(e.current)}
        >
          <Trash2 className="size-3.5" />
          Delete
        </Button>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Button variant="ghost" size="icon" className="size-7" onClick={() => e.moveScene(-1)} aria-label="Move scene left">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => e.moveScene(1)} aria-label="Move scene right">
          <ChevronRight className="size-4" />
        </Button>

        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {e.fmtClock(totalFrames / FPS)}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Zoom</span>
          <Slider
            value={[pxPerSec]}
            min={15}
            max={160}
            step={1}
            onValueChange={([v]) => e.setPxPerSec(v)}
            className="w-28"
          />
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-background scroll-thin">
          <div className="relative" style={{ width: trackW }}>
            {/* Ruler */}
            <div
              className="relative h-6 cursor-text border-b border-border"
              onPointerDown={(ev) => seek(ev.clientX, ev.currentTarget)}
            >
              {ticks.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 h-full border-l border-border pl-1 text-[10px] text-muted-foreground"
                  style={{ left: t * pxPerSec }}
                >
                  {e.fmtClock(t)}
                </div>
              ))}
            </div>
            {/* Clips */}
            <div
              className="relative h-[72px]"
              onPointerDown={(ev) => seek(ev.clientX, ev.currentTarget)}
            >
              {clips.map(({ s, left, width }, i) => {
                const seld = i === e.current
                const title = (
                  (ls[i].props.titles.find((x) => x.kind === "block") ?? ls[i].props.titles[0])?.text ??
                  `Scene ${i + 1}`
                ).replace(/\n/g, " ")
                const tr = ls[i].transition
                return (
                  <div
                    key={s.id}
                    onPointerDown={(ev) => {
                      ev.stopPropagation()
                      e.selectScene(i)
                    }}
                    title={title}
                    className={cn(
                      "absolute top-2 h-[56px] cursor-pointer overflow-hidden rounded-md border-2 bg-card transition-colors",
                      seld ? "border-primary" : "border-border hover:border-muted-foreground/40",
                    )}
                    style={{ left: left + 1, width: Math.max(10, width - 2) }}
                  >
                    <div className="h-2" style={{ background: ls[i].props.accent }} />
                    <div className="truncate px-2 pt-1 text-xs text-foreground">
                      {i + 1}. {title}
                    </div>
                    <div className="px-2 text-[10px] text-muted-foreground">
                      {(s.durationInFrames / FPS).toFixed(1)}s
                      {tr && tr.type !== "cut" && i < clips.length - 1 ? ` · ${tr.type}→` : ""}
                    </div>
                    <div
                      onPointerDown={(ev) => e.onResizeDown(ev, i, s.durationInFrames)}
                      onPointerMove={e.onResizeMove}
                      onPointerUp={e.onResizeUp}
                      title="Drag to change length"
                      className={cn(
                        "absolute inset-y-0 right-0 w-2 cursor-ew-resize opacity-60",
                        seld ? "bg-primary" : "bg-border",
                      )}
                    />
                  </div>
                )
              })}
              {e.previewMode === "reel" ? (
                <div
                  className="pointer-events-none absolute inset-y-0 w-0.5 bg-primary"
                  style={{ left: (e.playhead / FPS) * pxPerSec * factor }}
                />
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => e.setPreviewMode("scene")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
              e.previewMode === "scene"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MonitorPlay className="size-3.5" />
            This scene
          </button>
          <button
            type="button"
            onClick={() => e.setPreviewMode("reel")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
              e.previewMode === "reel"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Film className="size-3.5" />
            Full reel
          </button>
          <span className="text-[11px] text-muted-foreground">
            Click a clip to edit · drag its right edge to resize · click the ruler to scrub.
          </span>
        </div>
      </div>
    </div>
  )
}
