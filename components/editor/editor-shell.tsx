"use client"

import { Download, Grid3x3, Loader2, RefreshCw, Save, Shuffle, Upload, Waves, Droplets } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { useEditor } from "./editor-provider"
import { LeftPanel } from "./left-panel"
import { CenterPanel } from "./center-panel"
import { RightPanel } from "./right-panel"
import { LiquidButton } from "./liquid-button"
import { useStagger } from "./use-motion"
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
          "inline-flex size-8 items-center justify-center rounded-md border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          active
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
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
  const ref = useStagger<HTMLElement>({ y: -6, stagger: 0.04, duration: 0.45 })
  return (
    <header
      ref={ref}
      className="relative flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4"
    >
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={e.save}>
          <Save className="size-4" />
          Save
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={e.load}>
          <Upload className="size-4" />
          Load
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {e.isPattern ? (
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <LiquidButton
                finish="glass"
                size="sm"
                className="gap-1.5"
                onClick={() => e.set("seed", Math.floor(Math.random() * 1e9))}
              >
                <Shuffle className="size-4" />
                Generate
              </LiquidButton>
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
          <SelectTrigger size="sm" className="w-[88px]">
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

        <LiquidButton finish="metal" disabled={e.rendering} onClick={e.render} className="gap-1.5">
          {e.rendering ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          <span>{e.rendering ? "Rendering…" : "Render MP4"}</span>
        </LiquidButton>
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
