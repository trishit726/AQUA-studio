"use client"

import { useState } from "react"
import {
  Clapperboard,
  Cloud,
  FileVideo,
  FilmIcon,
  Grid2x2,
  History,
  LayoutTemplate,
  Layers,
  Plus,
  RefreshCw,
  Trash2,
  Sparkles,
  Palette,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { useEditor } from "./editor-provider"
import { COMP_LABELS, type CompId } from "./constants"

const COMP_ICONS: Record<CompId, React.ComponentType<{ className?: string }>> = {
  PatternTitle: LayoutTemplate,
  SwissPoster: Palette,
  Timeline: Layers,
  Intro: FilmIcon,
  Assembly: Clapperboard,
  FourCardsGrid: Grid2x2,
}

export function LeftPanel() {
  const {
    comp,
    switchComp,
    isSignedIn,
    cloudScenes,
    cloudLoading,
    cloudError,
    cloudSaveName,
    setCloudSaveName,
    saveSceneToCloud,
    loadSceneFromCloud,
    deleteSceneFromCloud,
    fetchCloudScenes,
    renders,
    fetchRenders,
  } = useEditor()

  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-3.5">
        <span className="flex size-7 items-center justify-center rounded-full border border-border text-aqua">
          <Sparkles className="size-3.5" />
        </span>
        <div className="flex flex-col">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">workspace</span>
          <span className="text-sm font-medium lowercase tracking-tight">motion editor</span>
        </div>
      </div>

      <Separator />

      {/* Compositions */}
      <div className="px-3 pt-4">
        <p className="px-1 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Compositions
        </p>
        <nav className="flex flex-col gap-0.5">
          {COMP_LABELS.map(({ id, label, hint }) => {
            const Icon = COMP_ICONS[id]
            const active = comp === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => switchComp(id)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  active
                    ? "aqua-underline text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-4 shrink-0", active ? "text-aqua" : "text-muted-foreground")}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium leading-tight">{label}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{hint}</span>
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      <Separator className="my-4" />

      {/* Cloud library — hairline-framed file manager */}
      <div className="mx-3 mb-3 flex min-h-0 flex-1 flex-col rounded-xl border border-border p-3">
        <div className="flex items-center justify-between px-1 pb-2">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <Cloud className="size-3.5" />
            Cloud Library
          </p>
          {isSignedIn ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={fetchCloudScenes}
              aria-label="Refresh cloud library"
            >
              <RefreshCw className={cn("size-3.5", cloudLoading && "animate-spin")} />
            </Button>
          ) : null}
        </div>

        {!isSignedIn ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center">
            <Cloud className="mx-auto mb-2 size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-pretty">
              Your saved scenes will appear here — hit Save to add one.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 pb-2">
              <Input
                value={cloudSaveName}
                onChange={(e) => setCloudSaveName(e.target.value)}
                placeholder="Name this scene…"
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveSceneToCloud(cloudSaveName)
                }}
              />
              <Button
                size="icon"
                className="size-8 shrink-0"
                disabled={cloudLoading || !cloudSaveName.trim()}
                onClick={() => saveSceneToCloud(cloudSaveName)}
                aria-label="Save current scene to cloud"
              >
                <Plus className="size-4" />
              </Button>
            </div>

            {cloudError ? (
              <p className="px-1 pb-2 text-xs text-destructive">{cloudError}</p>
            ) : null}

            <ScrollArea className="min-h-0 flex-1">
              {cloudScenes.length === 0 && !cloudLoading ? (
                <Empty className="py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileVideo />
                    </EmptyMedia>
                    <EmptyTitle className="text-sm">No saved scenes</EmptyTitle>
                    <EmptyDescription className="text-xs">
                      Save your current design to see it here.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="flex flex-col gap-0.5 pr-1">
                  {cloudScenes.map((item) => (
                    <li key={item.id}>
                      <div
                        className={cn(
                          "group flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors",
                          "hover:bg-secondary",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => loadSceneFromCloud(item)}
                          className="flex min-w-0 flex-1 items-center gap-2.5 text-left focus-visible:outline-none"
                        >
                          <FileVideo className="size-4 shrink-0 text-primary" />
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium leading-tight">{item.name}</span>
                            <span className="truncate text-[11px] text-muted-foreground">
                              {item.updatedAt
                                ? new Date(item.updatedAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "—"}
                            </span>
                          </span>
                        </button>
                        {pendingDelete === item.id ? (
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 px-2 text-[11px]"
                              onClick={() => {
                                deleteSceneFromCloud(item.id)
                                setPendingDelete(null)
                              }}
                            >
                              Delete
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[11px]"
                              onClick={() => setPendingDelete(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                            onClick={() => setPendingDelete(item.id)}
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>

            <Badge variant="secondary" className="mt-2 w-fit gap-1 text-[10px] font-normal">
              <Cloud className="size-3" />
              {cloudScenes.length} {cloudScenes.length === 1 ? "scene" : "scenes"} synced
            </Badge>
          </>
        )}
      </div>

      {/* Render history — the RENDER# items in this user's DynamoDB partition */}
      <div className="mx-3 mb-3 shrink-0 rounded-xl border border-border p-3">
        <div className="flex items-center justify-between px-1 pb-2">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <History className="size-3.5" />
            Render History
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={fetchRenders}
            aria-label="Refresh render history"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>

        {renders.length === 0 ? (
          <p className="px-1 py-3 text-center text-xs text-muted-foreground text-pretty">
            No renders yet — hit Render MP4 to log one to DynamoDB.
          </p>
        ) : (
          <ScrollArea className="max-h-44">
            <ul className="flex flex-col gap-0.5 pr-1">
              {renders.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary"
                >
                  <FileVideo
                    className={cn(
                      "size-3.5 shrink-0",
                      r.status === "success" ? "text-aqua" : "text-destructive",
                    )}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-xs font-medium leading-tight">
                      {r.composition}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground">
                      {r.durationSec}s ·{" "}
                      {new Date(r.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[9px] uppercase tracking-wide",
                      r.status === "success" ? "text-aqua" : "text-destructive",
                    )}
                  >
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>
    </aside>
  )
}
