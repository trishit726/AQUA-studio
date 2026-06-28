"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { useEditor } from "./editor-provider"
import { PatternTitle } from "@/src/compositions/PatternTitle"
import { Assembly, ASSEMBLY_DURATION } from "@/src/compositions/Assembly"
import { Intro, INTRO_DURATION } from "@/src/compositions/Intro"
import { Timeline, calculateTimelineDuration } from "@/src/compositions/Timeline"
import { FourCardsGrid } from "@/src/compositions/FourCardsGrid"
import { STYLE_COMPS, isStyleComp } from "./style-comps"

/**
 * Remotion's <Player /> touches browser-only APIs and crashes during SSR.
 * Importing it with `ssr: false` guarantees it only ever loads in the browser.
 */
const Player = dynamic(() => import("@remotion/player").then((mod) => mod.Player), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-video w-full items-center justify-center bg-black">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  ),
})

const playerStyle = { width: "100%", aspectRatio: "16 / 9" } as const

export function SafePlayer() {
  const {
    comp,
    assemblyProps,
    introProps,
    fourCardsProps,
    styleProps,
    inputProps,
    duration,
    previewMode,
    liveScenes,
    timelineMusic,
    playerRef,
    dragRef,
    draggingRef,
    moveSel,
  } = useEditor()

  if (comp === "Assembly") {
    return (
      <Player
        acknowledgeRemotionLicense
        component={Assembly}
        inputProps={assemblyProps}
        durationInFrames={ASSEMBLY_DURATION}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={playerStyle}
        initialFrame={Math.min(40, ASSEMBLY_DURATION - 1)}
        controls
        loop
      />
    )
  }

  if (comp === "Intro") {
    return (
      <Player
        acknowledgeRemotionLicense
        component={Intro}
        inputProps={introProps}
        durationInFrames={INTRO_DURATION}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={playerStyle}
        initialFrame={Math.min(40, INTRO_DURATION - 1)}
        controls
        loop
      />
    )
  }

  if (comp === "Timeline" && previewMode === "reel") {
    const scenes = liveScenes()
    return (
      <Player
        ref={playerRef}
        acknowledgeRemotionLicense
        component={Timeline}
        inputProps={{ scenes, music: timelineMusic }}
        durationInFrames={calculateTimelineDuration(scenes)}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={playerStyle}
        controls
        loop
      />
    )
  }

  if (comp === "FourCardsGrid") {
    return (
      <Player
        acknowledgeRemotionLicense
        component={FourCardsGrid}
        inputProps={fourCardsProps}
        durationInFrames={240}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={playerStyle}
        initialFrame={40}
        controls
        loop
      />
    )
  }

  // Style-Engine compositions (Swiss Editorial / Swiss Poster).
  if (isStyleComp(comp)) {
    const sc = STYLE_COMPS[comp]
    return (
      <Player
        acknowledgeRemotionLicense
        component={sc.component}
        inputProps={styleProps[comp]}
        durationInFrames={sc.durationInFrames}
        fps={30}
        compositionWidth={sc.width}
        compositionHeight={sc.height}
        style={playerStyle}
        initialFrame={Math.min(100, sc.durationInFrames - 1)}
        controls
        loop
      />
    )
  }

  // PatternTitle (single scene) + drag overlay for repositioning titles.
  return (
    <>
      <Player
        acknowledgeRemotionLicense
        component={PatternTitle}
        inputProps={inputProps}
        durationInFrames={duration}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={playerStyle}
        initialFrame={Math.min(90, duration - 1)}
        controls
        loop
      />
      <div
        ref={dragRef}
        className="absolute inset-x-0 top-0 bottom-[46px] cursor-move"
        onPointerDown={(e) => {
          draggingRef.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          moveSel(e)
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) moveSel(e)
        }}
        onPointerUp={(e) => {
          draggingRef.current = false
          e.currentTarget.releasePointerCapture(e.pointerId)
        }}
      />
    </>
  )
}
