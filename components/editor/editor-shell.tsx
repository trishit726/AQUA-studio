"use client"

import Link from "next/link"
import { Download, Grid3x3, Loader2, Save, Shuffle, Upload, Waves, Droplets } from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PillButton } from "@/components/blueprint/pill-button"
import { Wordmark } from "@/components/blueprint/wordmark"
import { useEditor } from "./editor-provider"
import { LeftPanel } from "./left-panel"
import { CenterPanel } from "./center-panel"
import { RightPanel } from "./right-panel"
import { RATIOS } from "./constants"

function QuickToggle({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          active
            ? "border-aqua text-foreground ring-1 ring-aqua"
            : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
        )}
        aria-label={label}
        aria-pressed={active}
      >
        <Icon className="size-4" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function Toolbar() {
  const e = useEditor()
  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <Link href="/" className="mr-1 shrink-0" aria-label="Back to aqua studio home">
        <Wordmark className="text-base" />
      </Link>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="flex items-center gap-1.5">
        <PillButton variant="glass" size="sm" className="gap-1.5" onClick={e.saveCurrent} disabled={e.cloudLoading}>
          <Save className="size-4" />
          Save
        </PillButton>
        <PillButton variant="glass" size="sm" className="gap-1.5" onClick={e.load}>
          <Upload className="size-4" />
          Load
        </PillButton>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {e.isPattern ? (
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <PillButton
                variant="glass"
                size="sm"
                className="gap-1.5"
                onClick={() => e.set("seed", Math.floor(Math.random() * 1e9))}
              >
                <Shuffle className="size-4" />
                Generate
              </PillButton>
            </TooltipTrigger>
            <TooltipContent>Reroll the pattern seed</TooltipContent>
          </Tooltip>
          <QuickToggle active={e.props.scatter ?? true} onClick={() => e.set("scatter", !(e.props.scatter ?? true))} label="Scatter shapes" icon={Shuffle} />
          <QuickToggle active={!!e.props.showGrid} onClick={() => e.set("showGrid", !e.props.showGrid)} label="Show grid" icon={Grid3x3} />
          <QuickToggle active={e.props.intro === "flood"} onClick={() => e.set("intro", e.props.intro === "flood" ? "none" : "flood")} label="Flood intro" icon={Droplets} />
          <QuickToggle active={!!e.props.audioReactive} onClick={e.toggleReactive} label="Audio reactive" icon={Waves} />
        </div>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <Select value={e.ratio} onValueChange={e.setRatio}>
          <SelectTrigger size="sm" className="w-[88px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {RATIOS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <PillButton variant="metal" size="sm" disabled={e.rendering} onClick={e.render} className="gap-1.5">
          {e.rendering ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          <span>{e.rendering ? "Rendering…" : "Render MP4"}</span>
        </PillButton>
      </div>
    </header>
  )
}

export function EditorShell() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <LeftPanel />
        <CenterPanel />
        <RightPanel />
      </div>
    </div>
  )
}
