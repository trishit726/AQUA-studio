"use client"

import { useState } from "react"
import { ChevronDown, Download, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useEditor } from "./editor-provider"
import { BarSlider, ColorSwatch, Field } from "./primitives"
import { MUSIC, PALETTE } from "./constants"
import { isStyleComp } from "./style-comps"
import { Shape } from "@/src/lib/patterngen/PatternField"
import { ANIM_TYPES } from "@/src/lib/patterngen/engine"

/** A chip-style toggle used for boolean feature switches. */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-secondary/40 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function SectionCard({
  title,
  hint,
  children,
  defaultOpen = true,
}: {
  title: string
  hint?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section
      data-open={open}
      className={cn(
        "group/section flex flex-col rounded-lg border border-border bg-card/40 transition-all duration-200",
        "hover:border-primary/30 hover:bg-card/60 hover:shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_18%,transparent)]",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-start gap-2 rounded-lg px-4 py-3 text-left transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-300",
            "group-hover/section:text-foreground",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-3 px-4 pb-4 pt-0">{children}</div>
        </div>
      </div>
    </section>
  )
}

export function RightPanel() {
  const e = useEditor()

  return (
    <aside className="accent-veil flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-sidebar">
      <ScrollArea className="min-h-0 flex-1 scroll-thin">
        <div className="flex flex-col gap-4 p-4">
          {e.isPattern ? <PatternControls /> : null}
          {isStyleComp(e.comp) ? <StyleControls /> : null}
          {e.comp === "Timeline" ? <TimelineControls /> : null}
          {e.comp === "Assembly" ? <AssemblyControls /> : null}
          {e.comp === "Intro" ? <IntroControls /> : null}
          {e.comp === "FourCardsGrid" ? <FourCardsControls /> : null}
          {e.videoUrl ? <LastRender /> : null}
        </div>
      </ScrollArea>
    </aside>
  )
}

// Generic controls for the Style-Engine compositions: edit each text prop and
// reseed the procedural layout/motifs.
function StyleControls() {
  const e = useEditor()
  const comp = e.comp
  const props = e.styleProps[comp] ?? {}

  return (
    <SectionCard title="Style" hint="Procedural — edit text, then reseed for a new arrangement">
      <div className="flex flex-col gap-4 px-4 pb-4">
        {Object.entries(props).map(([key, val]) => {
          if (key === "seed") return null

          // Boolean → on/off chip.
          if (typeof val === "boolean") {
            return (
              <Field key={key} label={key}>
                <Chip active={val} onClick={() => e.setStyleProp(comp, key, !val)}>
                  {val ? "On" : "Off"}
                </Chip>
              </Field>
            )
          }

          // Number → numeric input (keeps the value typed for the player).
          if (typeof val === "number") {
            return (
              <Field key={key} label={key} value={val}>
                <Input
                  type="number"
                  value={val}
                  onChange={(ev) => e.setStyleProp(comp, key, Number(ev.target.value))}
                  className="h-9 text-sm"
                />
              </Field>
            )
          }

          // String array (e.g. metaLines) → one item per line.
          if (Array.isArray(val)) {
            return (
              <Field key={key} label={key}>
                <Textarea
                  value={val.join("\n")}
                  rows={Math.min(5, Math.max(2, val.length))}
                  onChange={(ev) => e.setStyleProp(comp, key, ev.target.value.split("\n"))}
                  className="resize-none text-sm"
                />
              </Field>
            )
          }

          const str = String(val)

          // Colour (key ends in "Color", or value is a hex) → swatch + hex input.
          if (/Color$/.test(key) || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(str)) {
            return (
              <Field key={key} label={key}>
                <div className="flex items-center gap-2">
                  <ColorSwatch color={str} onChange={(v) => e.setStyleProp(comp, key, v)} />
                  <Input
                    value={str}
                    onChange={(ev) => e.setStyleProp(comp, key, ev.target.value)}
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </Field>
            )
          }

          // Plain string.
          return (
            <Field key={key} label={key}>
              {str.length > 38 ? (
                <Textarea
                  value={str}
                  rows={2}
                  onChange={(ev) => e.setStyleProp(comp, key, ev.target.value)}
                  className="resize-none text-sm"
                />
              ) : (
                <Input
                  value={str}
                  onChange={(ev) => e.setStyleProp(comp, key, ev.target.value)}
                  className="h-9 text-sm"
                />
              )}
            </Field>
          )
        })}
        <Button variant="outline" size="sm" className="w-fit" onClick={() => e.reseedStyle(comp)}>
          Reseed layout
        </Button>
      </div>
    </SectionCard>
  )
}

function PatternControls() {
  const e = useEditor()
  const { props, sel } = e

  return (
    <>
      {/* Titles */}
      <SectionCard title="Titles">
        <div className="flex flex-col gap-2">
          {props.titles.map((t) => (
            <div
              key={t.id}
              onClick={() => e.setSelectedId(t.id)}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-md border p-2 transition-colors",
                t.id === e.selectedId
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-muted-foreground/30",
              )}
            >
              <span className="w-9 shrink-0 pt-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                {t.kind}
              </span>
              <Textarea
                value={t.text}
                rows={t.kind === "block" ? 2 : 1}
                onClick={(ev) => ev.stopPropagation()}
                onChange={(ev) => e.setTitle(t.id, { text: ev.target.value })}
                className="min-h-0 flex-1 resize-none py-1.5 text-sm"
              />
              <div onClick={(ev) => ev.stopPropagation()}>
                <ColorSwatch
                  color={t.color ?? props.accent}
                  onChange={(v) => e.setTitle(t.id, { color: v })}
                  title="Box colour"
                  className="size-8"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={(ev) => {
                  ev.stopPropagation()
                  e.removeTitle(t.id)
                }}
                aria-label="Remove title"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => e.addTitle("block")}>
            <Plus data-icon="inline-start" />
            Block
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => e.addTitle("label")}>
            <Plus data-icon="inline-start" />
            Label
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => e.addTitle("jp")}>
            <Plus data-icon="inline-start" />
            JP
          </Button>
        </div>

        {sel ? (
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            <Field label="Size" value={sel.size}>
              <BarSlider value={Math.round(sel.size / 14)} min={1} max={16} onChange={(v) => e.setTitle(sel.id, { size: v * 14 })} />
            </Field>
            <Field label="Entrance">
              <ToggleGroup
                type="single"
                value={sel.dir ?? "left"}
                onValueChange={(v) => v && e.setTitle(sel.id, { dir: v as typeof sel.dir })}
                className="justify-start"
              >
                <ToggleGroupItem value="left" aria-label="From left">←</ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="From right">→</ToggleGroupItem>
                <ToggleGroupItem value="up" aria-label="From top">↑</ToggleGroupItem>
                <ToggleGroupItem value="down" aria-label="From bottom">↓</ToggleGroupItem>
              </ToggleGroup>
            </Field>
          </div>
        ) : null}
      </SectionCard>

      {/* Numeric sliders */}
      <SectionCard title="Composition">
        <Field label="Duration" value={`${Math.round(e.duration / 30)}s`}>
          <BarSlider value={Math.round(e.duration / 30)} min={2} max={12} onChange={(v) => e.setDuration(v * 30)} />
        </Field>
        <Field label="Density" value={props.density}>
          <BarSlider value={props.density} max={20} onChange={(v) => e.set("density", v)} />
        </Field>
        <Field label="Proximity" value={props.proximity}>
          <BarSlider value={props.proximity} max={20} onChange={(v) => e.set("proximity", v)} />
        </Field>
        <Field label="Stagger" value={props.stagger}>
          <BarSlider value={props.stagger} min={0} max={5} onChange={(v) => e.set("stagger", v)} />
        </Field>
      </SectionCard>

      {/* Camera */}
      <SectionCard title="Camera" hint="A virtual camera over the whole scene. Scrub the preview to see the move.">
        <ToggleGroup
          type="single"
          value={props.cameraMove ?? "none"}
          onValueChange={(v) => v && e.set("cameraMove", v as typeof props.cameraMove)}
          className="flex-wrap justify-start"
        >
          <ToggleGroupItem value="none">None</ToggleGroupItem>
          <ToggleGroupItem value="pushIn">Push In</ToggleGroupItem>
          <ToggleGroupItem value="pushOut">Push Out</ToggleGroupItem>
          <ToggleGroupItem value="pan">Pan</ToggleGroupItem>
          <ToggleGroupItem value="kenBurns">Ken Burns</ToggleGroupItem>
        </ToggleGroup>
        {props.cameraMove && props.cameraMove !== "none" ? (
          <>
            {props.cameraMove === "pan" || props.cameraMove === "kenBurns" ? (
              <ToggleGroup
                type="single"
                value={props.cameraDir ?? "right"}
                onValueChange={(v) => v && e.set("cameraDir", v as typeof props.cameraDir)}
                className="justify-start"
              >
                <ToggleGroupItem value="left" aria-label="Left">←</ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Right">→</ToggleGroupItem>
                <ToggleGroupItem value="up" aria-label="Up">↑</ToggleGroupItem>
                <ToggleGroupItem value="down" aria-label="Down">↓</ToggleGroupItem>
              </ToggleGroup>
            ) : null}
            <Field label="Amount" value={props.cameraAmount ?? 5}>
              <BarSlider value={props.cameraAmount ?? 5} min={1} max={10} onChange={(v) => e.set("cameraAmount", v)} />
            </Field>
          </>
        ) : null}
      </SectionCard>

      {/* Title motion */}
      <SectionCard title="Title Motion" hint="How titles enter the frame.">
        <ToggleGroup
          type="single"
          value={props.titleAnim ?? "wipe"}
          onValueChange={(v) => v && e.set("titleAnim", v as typeof props.titleAnim)}
          className="flex-wrap justify-start"
        >
          <ToggleGroupItem value="wipe">Wipe</ToggleGroupItem>
          <ToggleGroupItem value="perLetter">Per-Letter</ToggleGroupItem>
          <ToggleGroupItem value="rise">Rise</ToggleGroupItem>
          <ToggleGroupItem value="fade">Fade</ToggleGroupItem>
        </ToggleGroup>
        <Chip active={!!props.underline} onClick={() => e.set("underline", !props.underline)}>
          Underline sweep
        </Chip>
      </SectionCard>

      {/* Intro effect */}
      <SectionCard
        title="Intro Effect"
        hint="Flood = a full-screen colour grid fills in behind the title. Scrub to the start to see it."
      >
        <ToggleGroup
          type="single"
          value={props.intro ?? "none"}
          onValueChange={(v) => v && e.set("intro", v as typeof props.intro)}
          className="justify-start"
        >
          <ToggleGroupItem value="none">Scatter</ToggleGroupItem>
          <ToggleGroupItem value="flood">Flood</ToggleGroupItem>
        </ToggleGroup>

        {props.intro === "flood" ? (
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            <Field label="Flood Style">
              <ToggleGroup
                type="single"
                value={props.floodStyle ?? "random"}
                onValueChange={(v) => v && e.set("floodStyle", v as typeof props.floodStyle)}
                className="flex-wrap justify-start"
              >
                {(["random", "sweep", "radial", "rows", "columns", "edges"] as const).map((s) => (
                  <ToggleGroupItem key={s} value={s} className="capitalize">
                    {s}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Chip active={props.floodPersist ?? true} onClick={() => e.set("floodPersist", !(props.floodPersist ?? true))}>
                {(props.floodPersist ?? true) ? "Stays" : "Clears"}
              </Chip>
              <Chip active={!!props.floodSolid} onClick={() => e.set("floodSolid", !props.floodSolid)}>
                {props.floodSolid ? "Solid" : "Mixed"}
              </Chip>
            </div>
            <Field label="Flood Speed" value={props.floodSpeed ?? 5}>
              <BarSlider value={props.floodSpeed ?? 5} min={1} max={10} onChange={(v) => e.set("floodSpeed", v)} />
            </Field>
            <Field label="Tile Size" value={props.floodTile ?? 6}>
              <BarSlider value={props.floodTile ?? 6} min={1} max={10} onChange={(v) => e.set("floodTile", v)} />
            </Field>
            <Field label="Flood Shapes" value={props.floodShapes ?? 5}>
              <BarSlider value={props.floodShapes ?? 5} min={0} max={10} onChange={(v) => e.set("floodShapes", v)} />
            </Field>
          </div>
        ) : null}
      </SectionCard>

      {/* Shapes */}
      <SectionCard title="Shapes" hint="Scattered procedural shapes around the title.">
        <div className="flex items-center justify-between">
          <Chip active={props.scatter ?? true} onClick={() => e.set("scatter", !(props.scatter ?? true))}>
            {(props.scatter ?? true) ? "Scatter On" : "Scatter Off"}
          </Chip>
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={() => e.set("shapes", e.allShapes ? [] : [...ANIM_TYPES])}
          >
            {e.allShapes ? "Deselect all" : "Select all"}
          </button>
        </div>
        <div
          className={cn(
            "grid grid-cols-5 gap-2 transition-opacity",
            (props.scatter ?? true) ? "opacity-100" : "pointer-events-none opacity-40",
          )}
        >
          {ANIM_TYPES.map((a) => {
            const on = (props.shapes ?? []).includes(a)
            return (
              <button
                key={a}
                type="button"
                onClick={() => e.toggleShape(a)}
                title={a}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md p-2 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  on ? "bg-primary" : "bg-secondary hover:bg-secondary/70",
                )}
              >
                <Shape anim={a} fg={on ? "#0a0a0a" : "#8a8a8a"} />
              </button>
            )
          })}
        </div>
      </SectionCard>

      {/* Colors */}
      <SectionCard title="Color Set">
        <div className="flex flex-wrap items-center gap-2">
          {PALETTE.map((c) => {
            const on = e.has(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => e.toggleColor(c)}
                title={c}
                className={cn(
                  "flex size-10 items-center justify-center rounded-md border transition-transform hover:scale-105",
                  on ? "border-primary ring-2 ring-primary/40" : "border-border",
                )}
                style={{ background: c }}
              >
                {on ? (
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      c === "#000000" ? "bg-white" : "bg-black/70",
                    )}
                  />
                ) : null}
              </button>
            )
          })}
          {e.customs.map((c) => (
            <div key={c} className="relative">
              <ColorSwatch color={c} onChange={(v) => e.replaceColor(c, v)} className="size-10" />
              <button
                type="button"
                onClick={() => e.removeColor(c)}
                className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                aria-label="Remove colour"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
          {e.customs.length < 3 ? (
            <Button variant="outline" size="sm" onClick={e.addColor}>
              <Plus data-icon="inline-start" />
              Add
            </Button>
          ) : null}
        </div>
      </SectionCard>

      {/* Title / BG colors */}
      <SectionCard title="Title & Background">
        <div className="flex items-center gap-3">
          <ColorSwatch color={props.accent} onChange={(v) => e.set("accent", v)} title="Title colour" className="size-10" />
          <ColorSwatch color={props.bgColor} onChange={(v) => e.set("bgColor", v)} title="Background colour" className="size-10" />
          <span className="text-xs text-muted-foreground">Title · Background</span>
        </div>
      </SectionCard>

      {/* Background photo */}
      <SectionCard title="Background Photo">
        <Input
          type="file"
          accept="image/*"
          onChange={(ev) => e.onImage(ev.target.files?.[0] ?? null)}
          className="text-xs"
        />
        {props.bgImage ? (
          <div className="flex flex-col gap-2">
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => e.onImage(null)}>
              Clear photo
            </Button>
          </div>
        ) : null}
      </SectionCard>

      {/* Audio */}
      <SectionCard
        title="Audio"
        hint={
          props.audioReactive
            ? props.music
              ? "Shapes & dots pulse to the music."
              : "Turn on Music to drive the reactive pulse."
            : "Reactive = beat-synced shape & dot pulse."
        }
      >
        <div className="flex flex-wrap gap-2">
          <Chip active={!!props.music} onClick={() => e.set("music", props.music ? "" : MUSIC)}>
            Music
          </Chip>
          <Chip active={!!props.sfx} onClick={() => e.set("sfx", !props.sfx)}>
            SFX
          </Chip>
          <Chip active={!!props.audioReactive} onClick={e.toggleReactive}>
            Reactive
          </Chip>
        </div>
      </SectionCard>
    </>
  )
}

function TimelineControls() {
  const e = useEditor()
  const ls = e.liveScenes()
  const tr = ls[e.current]?.transition
  const type = tr?.type ?? "fade"
  const dur = tr?.durationInFrames ?? 15
  const showTransition = e.current < e.scenes.length - 1

  return (
    <>
      {showTransition ? (
        <SectionCard title="Transition → next">
          <ToggleGroup
            type="single"
            value={type}
            onValueChange={(v) => v && e.setTransition({ type: v as typeof type })}
            className="justify-start"
          >
            {(["cut", "fade", "slide", "wipe"] as const).map((t) => (
              <ToggleGroupItem key={t} value={t} className="capitalize">
                {t}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {type === "slide" || type === "wipe" ? (
            <ToggleGroup
              type="single"
              value={tr?.direction ?? "from-right"}
              onValueChange={(v) => v && e.setTransition({ direction: v as typeof tr.direction })}
              className="flex-wrap justify-start"
            >
              {(["from-left", "from-right", "from-top", "from-bottom"] as const).map((d) => (
                <ToggleGroupItem key={d} value={d} className="capitalize">
                  {d.replace("from-", "")}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ) : null}
          {type !== "cut" ? (
            <Field label="Length" value={`${dur}f`}>
              <BarSlider
                value={Math.max(1, Math.round(dur / 3))}
                min={1}
                max={20}
                onChange={(v) => e.setTransition({ durationInFrames: v * 3 })}
              />
            </Field>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard title="Reel Music" hint="One bed across the whole reel. Per-scene audio is muted in the timeline.">
        <Chip active={!!e.timelineMusic} onClick={() => e.setTimelineMusic(e.timelineMusic ? "" : MUSIC)}>
          Music Bed
        </Chip>
      </SectionCard>
    </>
  )
}

function AssemblyControls() {
  const e = useEditor()
  return (
    <SectionCard title="Assembly Film" hint="The full ~18.5s film. SFX hits are always on.">
      <Field label="Title">
        <Input value={e.assemblyProps.name} onChange={(ev) => e.setAssemblyProps((p) => ({ ...p, name: ev.target.value }))} />
      </Field>
      <Field label="Site">
        <Input value={e.assemblyProps.site} onChange={(ev) => e.setAssemblyProps((p) => ({ ...p, site: ev.target.value }))} />
      </Field>
      <Chip active={!!e.assemblyProps.music} onClick={() => e.setAssemblyProps((p) => ({ ...p, music: p.music ? "" : MUSIC }))}>
        Music Bed
      </Chip>
    </SectionCard>
  )
}

function IntroControls() {
  const e = useEditor()
  const p = e.introProps
  return (
    <>
      <SectionCard title="Intro Text">
        <Field label="Title">
          <Input value={p.title} onChange={(ev) => e.setIntroProps((s) => ({ ...s, title: ev.target.value }))} />
        </Field>
        <Field label="Byline">
          <Input value={p.byline} onChange={(ev) => e.setIntroProps((s) => ({ ...s, byline: ev.target.value }))} />
        </Field>
        <Field label="JP Accent">
          <Input value={p.jp} onChange={(ev) => e.setIntroProps((s) => ({ ...s, jp: ev.target.value }))} />
        </Field>
        <Field label="Awards (comma-separated · up to 6)">
          <Input
            value={p.awards.join(", ")}
            onChange={(ev) =>
              e.setIntroProps((s) => ({
                ...s,
                awards: ev.target.value.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean),
              }))
            }
          />
        </Field>
        <Field label="Runtime">
          <Input value={p.runtime} onChange={(ev) => e.setIntroProps((s) => ({ ...s, runtime: ev.target.value }))} />
        </Field>
      </SectionCard>

      <SectionCard title="Hero Photos" hint="Entrance shot, then a deeper shot the camera dollies into.">
        <Field label="Photo 1">
          <Input value={p.bgImage} onChange={(ev) => e.setIntroProps((s) => ({ ...s, bgImage: ev.target.value }))} placeholder="images/alley1.jpg" />
        </Field>
        <Field label="Photo 2">
          <Input value={p.bgImage2} onChange={(ev) => e.setIntroProps((s) => ({ ...s, bgImage2: ev.target.value }))} placeholder="blank = single photo" />
        </Field>
      </SectionCard>

      <SectionCard title="Audio">
        <div className="flex gap-2">
          <Chip active={!!p.music} onClick={() => e.setIntroProps((s) => ({ ...s, music: s.music ? "" : MUSIC }))}>
            Music
          </Chip>
          <Chip active={!!p.sfx} onClick={() => e.setIntroProps((s) => ({ ...s, sfx: !s.sfx }))}>
            SFX
          </Chip>
        </div>
      </SectionCard>
    </>
  )
}

function FourCardsControls() {
  const e = useEditor()
  const p = e.fourCardsProps
  return (
    <>
      <SectionCard title="Layout" hint="Background · Card border · Card background · Text">
        <div className="flex items-center gap-3">
          <ColorSwatch color={p.bgColor} onChange={(v) => e.setFourCardsProps((s) => ({ ...s, bgColor: v }))} className="size-9" />
          <ColorSwatch color={p.cardBorderColor} onChange={(v) => e.setFourCardsProps((s) => ({ ...s, cardBorderColor: v }))} className="size-9" />
          <ColorSwatch color={p.cardBgColor} onChange={(v) => e.setFourCardsProps((s) => ({ ...s, cardBgColor: v }))} className="size-9" />
          <ColorSwatch color={p.textColor} onChange={(v) => e.setFourCardsProps((s) => ({ ...s, textColor: v }))} className="size-9" />
        </div>
        <Field label="Card Width" value={`${p.cardWidth}px`}>
          <BarSlider value={Math.round((p.cardWidth - 200) / 25)} min={0} max={12} onChange={(v) => e.setFourCardsProps((s) => ({ ...s, cardWidth: 200 + v * 25 }))} />
        </Field>
        <Field label="Card Height" value={`${p.cardHeight}px`}>
          <BarSlider value={Math.round((p.cardHeight - 400) / 40)} min={0} max={10} onChange={(v) => e.setFourCardsProps((s) => ({ ...s, cardHeight: 400 + v * 40 }))} />
        </Field>
        <Field label="Stagger" value={`${p.stagger}f`}>
          <BarSlider value={p.stagger} min={0} max={20} onChange={(v) => e.setFourCardsProps((s) => ({ ...s, stagger: v }))} />
        </Field>
        <Field label="Film Grain" value={p.grain.toFixed(2)}>
          <BarSlider value={Math.round(p.grain * 20)} min={0} max={10} onChange={(v) => e.setFourCardsProps((s) => ({ ...s, grain: v * 0.05 }))} />
        </Field>
        <Chip active={!!p.sfx} onClick={() => e.setFourCardsProps((s) => ({ ...s, sfx: !s.sfx }))}>
          SFX
        </Chip>
      </SectionCard>

      <SectionCard title="Cards">
        <div className="flex flex-col gap-3">
          {p.cards.map((card, index) => (
            <div key={index} className="flex flex-col gap-2.5 rounded-md border border-border bg-card/40 p-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Card {index + 1}</span>
              <Field label="Caption">
                <Input value={card.title} onChange={(ev) => e.updateCard(index, { title: ev.target.value })} />
              </Field>
              <Field label="Video Path (public/)">
                <Input value={card.videoUrl} onChange={(ev) => e.updateCard(index, { videoUrl: ev.target.value })} />
              </Field>
              <Field label="Align X" value={`${card.alignX ?? 50}%`}>
                <BarSlider value={Math.round((card.alignX ?? 50) / 10)} min={0} max={10} onChange={(v) => e.updateCard(index, { alignX: v * 10 })} />
              </Field>
              <Field label="Align Y" value={`${card.alignY ?? 50}%`}>
                <BarSlider value={Math.round((card.alignY ?? 50) / 10)} min={0} max={10} onChange={(v) => e.updateCard(index, { alignY: v * 10 })} />
              </Field>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  )
}

function LastRender() {
  const e = useEditor()
  if (!e.videoUrl) return null
  return (
    <SectionCard title="Last Render">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video src={e.videoUrl} controls className="w-full rounded-md border border-border" />
      <Button asChild variant="secondary" size="sm" className="w-fit">
        <a href={e.videoUrl} download>
          <Download data-icon="inline-start" />
          Download MP4
        </a>
      </Button>
    </SectionCard>
  )
}
