"use client"

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { PlayerRef } from "@remotion/player"
import { toast } from "sonner"
import { useAppAuth } from "@/lib/auth"
import {
  patternTitleDefaults,
  type PatternTitleProps,
  type TitleItem,
} from "@/src/compositions/PatternTitle"
import { assemblyDefaults, type AssemblyProps } from "@/src/compositions/Assembly"
import { introDefaults, type IntroProps } from "@/src/compositions/Intro"
import {
  timelineDefaults,
  calculateTimelineDuration,
  type TimelineScene,
  type SceneTransition,
} from "@/src/compositions/Timeline"
import { fourCardsDefaults, type FourCardsProps } from "@/src/compositions/FourCardsGrid"
import { STYLE_COMPS, isStyleComp } from "./style-comps"
import { ANIM_TYPES } from "@/src/lib/patterngen/engine"
import {
  MUSIC,
  SERVER,
  PALETTE,
  type CompId,
  clamp01,
  fileToDataURL,
  newTitle,
} from "./constants"

export interface CloudScene {
  id: string
  name: string
  props?: PatternTitleProps
  duration?: number
  updatedAt: string
}

interface EditorContextValue {
  // auth
  isSignedIn: boolean
  userId: string | null
  userName: string | null
  AuthUI: React.ReactNode
  // composition
  comp: CompId
  switchComp: (next: CompId) => void
  isPattern: boolean
  // pattern props
  props: PatternTitleProps
  set: <K extends keyof PatternTitleProps>(k: K, v: PatternTitleProps[K]) => void
  setProps: React.Dispatch<React.SetStateAction<PatternTitleProps>>
  toggleReactive: () => void
  inputProps: PatternTitleProps
  // other comps
  assemblyProps: AssemblyProps
  setAssemblyProps: React.Dispatch<React.SetStateAction<AssemblyProps>>
  introProps: IntroProps
  setIntroProps: React.Dispatch<React.SetStateAction<IntroProps>>
  fourCardsProps: FourCardsProps
  setFourCardsProps: React.Dispatch<React.SetStateAction<FourCardsProps>>
  updateCard: (idx: number, patch: Partial<FourCardsProps["cards"][number]>) => void
  // Style-Engine compositions (one prop bag per comp id)
  styleProps: Record<string, Record<string, any>>
  setStyleProp: (compId: string, key: string, value: unknown) => void
  reseedStyle: (compId: string) => void
  // duration / selection
  duration: number
  setDuration: React.Dispatch<React.SetStateAction<number>>
  selectedId: string
  setSelectedId: React.Dispatch<React.SetStateAction<string>>
  sel: TitleItem | undefined
  // titles
  setTitle: (id: string, patch: Partial<TitleItem>) => void
  addTitle: (kind: TitleItem["kind"]) => void
  removeTitle: (id: string) => void
  // drag
  dragRef: React.RefObject<HTMLDivElement | null>
  draggingRef: React.RefObject<boolean>
  moveSel: (e: React.PointerEvent) => void
  // shapes
  toggleShape: (a: string) => void
  allShapes: boolean
  // colors
  has: (c: string) => boolean
  toggleColor: (c: string) => void
  customs: string[]
  replaceColor: (oldC: string, newC: string) => void
  removeColor: (c: string) => void
  addColor: () => void
  // background
  onImage: (f: File | null) => void
  // timeline
  scenes: TimelineScene[]
  current: number
  previewMode: "scene" | "reel"
  setPreviewMode: React.Dispatch<React.SetStateAction<"scene" | "reel">>
  timelineMusic: string
  setTimelineMusic: React.Dispatch<React.SetStateAction<string>>
  liveScenes: () => TimelineScene[]
  selectScene: (i: number) => void
  addScene: () => void
  duplicateScene: () => void
  deleteScene: (i: number) => void
  moveScene: (dir: -1 | 1) => void
  setTransition: (patch: Partial<SceneTransition>) => void
  // timeline track
  FPS: number
  pxPerSec: number
  setPxPerSec: React.Dispatch<React.SetStateAction<number>>
  playhead: number
  playerRef: React.RefObject<PlayerRef | null>
  setSceneDuration: (i: number, frames: number) => void
  onResizeDown: (e: React.PointerEvent, i: number, durFrames: number) => void
  onResizeMove: (e: React.PointerEvent) => void
  onResizeUp: (e: React.PointerEvent) => void
  fmtClock: (sec: number) => string
  // render / status
  ratio: string
  setRatio: React.Dispatch<React.SetStateAction<string>>
  rendering: boolean
  videoUrl: string | null
  status: string
  render: () => Promise<void>
  // local IO
  save: () => void
  load: () => void
  // AI
  aiPrompt: string
  setAiPrompt: React.Dispatch<React.SetStateAction<string>>
  aiBusy: boolean
  generateAI: () => Promise<void>
  script: string
  scriptBusy: boolean
  writeScript: () => Promise<void>
  // cloud
  cloudScenes: CloudScene[]
  cloudLoading: boolean
  cloudError: string
  cloudSaveName: string
  setCloudSaveName: React.Dispatch<React.SetStateAction<string>>
  fetchCloudScenes: () => Promise<void>
  saveSceneToCloud: (name: string) => Promise<void>
  loadSceneFromCloud: (item: CloudScene) => void
  deleteSceneFromCloud: (id: string) => Promise<void>
  // presets
  applyTemplate: (props: Partial<PatternTitleProps>) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export const useEditor = () => {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error("useEditor must be used within an EditorProvider")
  return ctx
}

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, userId, userName, AuthUI } = useAppAuth()

  const [cloudScenes, setCloudScenes] = useState<CloudScene[]>([])
  const [cloudLoading, setCloudLoading] = useState(false)
  const [cloudError, setCloudError] = useState("")
  const [cloudSaveName, setCloudSaveName] = useState("")

  const [comp, setComp] = useState<CompId>("PatternTitle")
  const [props, setProps] = useState<PatternTitleProps>(patternTitleDefaults)
  const [assemblyProps, setAssemblyProps] = useState<AssemblyProps>(assemblyDefaults)
  const [introProps, setIntroProps] = useState<IntroProps>(introDefaults)
  const [fourCardsProps, setFourCardsProps] = useState<FourCardsProps>(fourCardsDefaults)

  // Style-Engine compositions: one editable prop bag per comp id.
  const [styleProps, setStyleProps] = useState<Record<string, Record<string, any>>>(() =>
    Object.fromEntries(Object.entries(STYLE_COMPS).map(([id, e]) => [id, { ...e.defaults }])),
  )
  const setStyleProp = (compId: string, key: string, value: unknown) =>
    setStyleProps((p) => ({ ...p, [compId]: { ...p[compId], [key]: value } }))
  const reseedStyle = (compId: string) =>
    setStyleProps((p) => ({ ...p, [compId]: { ...p[compId], seed: Math.floor(Math.random() * 1e9) } }))

  const updateCard = (idx: number, patch: Partial<FourCardsProps["cards"][number]>) => {
    setFourCardsProps((p) => ({
      ...p,
      cards: p.cards.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }))
  }

  const [duration, setDuration] = useState(150)
  const [selectedId, setSelectedId] = useState(props.titles[0]?.id ?? "")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [rendering, setRendering] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [ratio, setRatio] = useState("16:9")
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiBusy, setAiBusy] = useState(false)
  const [script, setScript] = useState("")
  const [scriptBusy, setScriptBusy] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  // Timeline (multi-scene) state
  const [scenes, setScenes] = useState<TimelineScene[]>(timelineDefaults.scenes)
  const [current, setCurrent] = useState(0)
  const [previewMode, setPreviewMode] = useState<"scene" | "reel">("scene")
  const [timelineMusic, setTimelineMusic] = useState("")

  const set = <K extends keyof PatternTitleProps>(k: K, v: PatternTitleProps[K]) =>
    setProps((p) => ({ ...p, [k]: v }))

  const toggleReactive = () =>
    setProps((p) => {
      const on = !p.audioReactive
      return { ...p, audioReactive: on, music: on ? p.music || MUSIC : p.music }
    })

  const inputProps = useMemo(() => props, [props])
  const sel = props.titles.find((t) => t.id === selectedId)

  // titles
  const setTitle = (id: string, patch: Partial<TitleItem>) =>
    setProps((p) => ({ ...p, titles: p.titles.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
  const addTitle = (kind: TitleItem["kind"]) => {
    const t = newTitle(kind)
    setProps((p) => ({ ...p, titles: [...p.titles, t] }))
    setSelectedId(t.id)
  }
  const removeTitle = (id: string) =>
    setProps((p) => ({ ...p, titles: p.titles.filter((t) => t.id !== id) }))
  const moveSel = (e: React.PointerEvent) => {
    const el = dragRef.current
    if (!el || !selectedId) return
    const r = el.getBoundingClientRect()
    setTitle(selectedId, {
      x: clamp01((e.clientX - r.left) / r.width),
      y: clamp01((e.clientY - r.top) / r.height),
    })
  }

  // shapes
  const toggleShape = (a: string) => {
    const shapes = props.shapes ?? []
    set("shapes", shapes.includes(a) ? shapes.filter((s) => s !== a) : [...shapes, a])
  }
  const allShapes = props.shapes ? ANIM_TYPES.every((a) => props.shapes.includes(a)) : false

  // pattern colors
  const has = (c: string) => (props.colors ?? []).some((x) => x.toLowerCase() === c.toLowerCase())
  const toggleColor = (c: string) => {
    const colors = props.colors ?? []
    set("colors", has(c) ? colors.filter((x) => x.toLowerCase() !== c.toLowerCase()) : [...colors, c])
  }
  const customs = (props.colors ?? []).filter((c) => !PALETTE.includes(c.toLowerCase()))
  const replaceColor = (oldC: string, newC: string) =>
    set("colors", (props.colors ?? []).map((x) => (x === oldC ? newC : x)))
  const removeColor = (c: string) => set("colors", (props.colors ?? []).filter((x) => x !== c))
  const addColor = () => {
    if (customs.length < 3) set("colors", [...(props.colors ?? []), "#808080"])
  }

  // background
  const onImage = (f: File | null) => {
    setImageFile(f)
    set("bgImage", f ? URL.createObjectURL(f) : "")
  }

  // Timeline scene management
  const liveScenes = (): TimelineScene[] =>
    scenes.map((s, i) => (i === current ? { ...s, props, durationInFrames: duration } : s))
  const loadScene = (ls: TimelineScene[], i: number) => {
    const sc = ls[i]
    if (!sc) return
    setProps(sc.props)
    setDuration(sc.durationInFrames)
    setSelectedId(sc.props.titles[0]?.id ?? "")
    setCurrent(i)
  }
  const selectScene = (i: number) => {
    const ls = liveScenes()
    setScenes(ls)
    loadScene(ls, i)
  }
  const addScene = () => {
    const ls = liveScenes()
    const ns: TimelineScene = {
      id: `sc${Date.now()}`,
      durationInFrames: 120,
      transition: { type: "fade", durationInFrames: 15 },
      props: { ...patternTitleDefaults, music: "", sfx: false },
    }
    const next = [...ls, ns]
    setScenes(next)
    loadScene(next, next.length - 1)
  }
  const duplicateScene = () => {
    const ls = liveScenes()
    const src = ls[current]
    if (!src) return
    const copy: TimelineScene = {
      ...src,
      id: `sc${Date.now()}`,
      props: { ...src.props, titles: src.props.titles.map((t) => ({ ...t })) },
    }
    const next = [...ls.slice(0, current + 1), copy, ...ls.slice(current + 1)]
    setScenes(next)
    loadScene(next, current + 1)
  }
  const deleteScene = (i: number) => {
    const ls = liveScenes()
    if (ls.length <= 1) return
    const next = ls.filter((_, idx) => idx !== i)
    setScenes(next)
    loadScene(next, Math.max(0, Math.min(i, next.length - 1)))
  }
  const moveScene = (dir: -1 | 1) => {
    const ls = liveScenes()
    const j = current + dir
    if (j < 0 || j >= ls.length) return
    const next = [...ls]
    ;[next[current], next[j]] = [next[j], next[current]]
    setScenes(next)
    setCurrent(j)
  }
  const setTransition = (patch: Partial<SceneTransition>) => {
    const ls = liveScenes()
    const base = ls[current]?.transition ?? { type: "fade" as const, durationInFrames: 15 }
    setScenes(ls.map((s, idx) => (idx === current ? { ...s, transition: { ...base, ...patch } } : s)))
  }

  // Visual timeline track
  const FPS = 30
  const [pxPerSec, setPxPerSec] = useState(40)
  const [playhead, setPlayhead] = useState(0)
  const playerRef = useRef<PlayerRef>(null)
  const resizeRef = useRef<{ i: number; startX: number; startDur: number } | null>(null)
  const setSceneDuration = (i: number, frames: number) => {
    const f = Math.max(15, Math.min(900, Math.round(frames)))
    if (i === current) setDuration(f)
    else setScenes((ss) => ss.map((s, idx) => (idx === i ? { ...s, durationInFrames: f } : s)))
  }
  const onResizeDown = (e: React.PointerEvent, i: number, durFrames: number) => {
    e.stopPropagation()
    resizeRef.current = { i, startX: e.clientX, startDur: durFrames }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onResizeMove = (e: React.PointerEvent) => {
    const r = resizeRef.current
    if (!r) return
    setSceneDuration(r.i, r.startDur + ((e.clientX - r.startX) / pxPerSec) * FPS)
  }
  const onResizeUp = (e: React.PointerEvent) => {
    if (resizeRef.current) {
      resizeRef.current = null
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }
  const fmtClock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`

  // Mirror the reel Player's playhead onto the timeline.
  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    const on = (e: { detail: { frame: number } }) => setPlayhead(e.detail.frame)
    p.addEventListener("frameupdate", on as never)
    return () => p.removeEventListener("frameupdate", on as never)
  }, [comp, previewMode])

  const switchComp = (next: CompId) => {
    if (next === comp) return
    if (comp === "Timeline") setScenes(liveScenes())
    if (next === "Timeline") {
      const sc = scenes[current] ?? scenes[0]
      if (sc) {
        setProps(sc.props)
        setDuration(sc.durationInFrames)
        setSelectedId(sc.props.titles[0]?.id ?? "")
      }
    }
    setComp(next)
  }
  const isPattern = comp === "PatternTitle" || comp === "Timeline"

  // Cloud library
  const fetchCloudScenes = async () => {
    if (!userId) return
    setCloudLoading(true)
    setCloudError("")
    try {
      const res = await fetch(`/api/list?userId=${encodeURIComponent(userId)}`)
      if (!res.ok) throw new Error(await res.text())
      setCloudScenes(await res.json())
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load cloud library"
      console.error("[v0] cloud list error", e)
      setCloudError(msg)
    } finally {
      setCloudLoading(false)
    }
  }

  const saveSceneToCloud = async (name: string) => {
    if (!userId) {
      toast.error("Please sign in to save scenes to the cloud.")
      return
    }
    const cleanName = name.trim()
    if (!cleanName) return
    setCloudLoading(true)
    try {
      const payload = { id: `scene-${Date.now()}`, userId, name: cleanName, props, duration }
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success(`Saved "${cleanName}" to your cloud library.`)
      fetchCloudScenes()
      setCloudSaveName("")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      console.error("[v0] cloud save error", e)
      toast.error(`Failed to save scene: ${msg}`)
    } finally {
      setCloudLoading(false)
    }
  }

  const loadSceneFromCloud = (item: CloudScene) => {
    if (!item.props) return
    setProps(item.props)
    if (item.duration) setDuration(item.duration)
    setSelectedId(item.props.titles?.[0]?.id ?? "")
    setComp("PatternTitle")
    toast.success(`Loaded "${item.name}".`)
  }

  const deleteSceneFromCloud = async (id: string) => {
    if (!userId) return
    setCloudLoading(true)
    try {
      const res = await fetch(
        `/api/delete?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" },
      )
      if (!res.ok) throw new Error(await res.text())
      toast.success("Deleted scene from cloud library.")
      fetchCloudScenes()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      console.error("[v0] cloud delete error", e)
      toast.error(`Failed to delete scene: ${msg}`)
    } finally {
      setCloudLoading(false)
    }
  }

  useEffect(() => {
    if (isSignedIn && userId) fetchCloudScenes()
    else setCloudScenes([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, userId])

  // Local save / load
  const save = () => {
    const data =
      comp === "Timeline"
        ? { version: 2, scenes: liveScenes(), music: timelineMusic }
        : { props, duration }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = comp === "Timeline" ? "pattern-timeline.json" : "pattern-scene.json"
    a.click()
  }
  const load = () => {
    const inp = document.createElement("input")
    inp.type = "file"
    inp.accept = ".json"
    inp.onchange = async () => {
      const f = inp.files?.[0]
      if (!f) return
      try {
        const d = JSON.parse(await f.text())
        if (d.version === 2 && Array.isArray(d.scenes) && d.scenes.length) {
          setScenes(d.scenes)
          setTimelineMusic(d.music ?? "")
          setComp("Timeline")
          loadScene(d.scenes, 0)
        } else if (d.props) {
          setProps(d.props)
          setSelectedId(d.props.titles?.[0]?.id ?? "")
          if (d.duration) setDuration(d.duration)
          setComp("PatternTitle")
        }
        toast.success("Loaded scene from file.")
      } catch (e) {
        console.error("[v0] local load error", e)
        toast.error("Could not read that file.")
      }
    }
    inp.click()
  }

  // AI generate
  const generateAI = async () => {
    if (!aiPrompt.trim() || aiBusy) return
    setAiBusy(true)
    setVideoUrl(null)
    setStatus("Designing your scene with AI…")
    try {
      const res = await fetch(`/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      if (!res.ok) throw new Error(await res.text())
      const s = await res.json()
      const titles: TitleItem[] = (s.titles ?? []).map((t: TitleItem, i: number) => ({
        id: `ai${Date.now()}_${i}`,
        kind: t.kind,
        text: String(t.text),
        x: t.x,
        y: t.y,
        size: t.size,
      }))
      setProps((p) => ({
        ...p,
        titles: titles.length ? titles : p.titles,
        accent: s.accent ?? p.accent,
        bgColor: s.bgColor ?? p.bgColor,
        colors: Array.isArray(s.colors) && s.colors.length ? s.colors : p.colors,
        density: s.density ?? p.density,
        proximity: s.proximity ?? p.proximity,
        seed: s.seed ?? p.seed,
        shapes: Array.isArray(s.shapes) && s.shapes.length ? s.shapes : p.shapes,
      }))
      setSelectedId(titles[0]?.id ?? "")
      setStatus("AI scene ready — drag, tweak, or render to MP4.")
      toast.success("AI scene generated.")
    } catch (e) {
      setStatus("AI unavailable — check that GEMINI_API_KEY is configured.")
      console.error("[v0] generateAI error", e)
      toast.error("AI generation failed. Check your API key.")
    } finally {
      setAiBusy(false)
    }
  }

  const writeScript = async () => {
    if (scriptBusy) return
    const topic = aiPrompt.trim() || props.titles.map((t) => t.text).join(" ")
    if (!topic) {
      setStatus("Type a brand/topic first.")
      return
    }
    setScriptBusy(true)
    try {
      const res = await fetch(`/api/script`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: topic }),
      })
      if (!res.ok) throw new Error(await res.text())
      const j = await res.json()
      setScript(j.script ?? "")
    } catch (e) {
      setScript("Script writer unavailable — check that GEMINI_API_KEY is configured.")
      console.error("[v0] writeScript error", e)
    } finally {
      setScriptBusy(false)
    }
  }

  const render = async () => {
    setRendering(true)
    setVideoUrl(null)
    setStatus("Rendering… (first run bundles, ~30–60s)")
    try {
      let body: Record<string, unknown>
      if (comp === "Assembly") {
        body = { composition: "Assembly", props: assemblyProps }
      } else if (comp === "Intro") {
        body = { composition: "Intro", props: introProps }
      } else if (comp === "Timeline") {
        const clean = liveScenes().map((s) => ({
          ...s,
          props: { ...s.props, bgImage: /^(blob:|data:)/.test(s.props.bgImage) ? "" : s.props.bgImage },
        }))
        body = { composition: "Timeline", props: { scenes: clean, music: timelineMusic } }
      } else if (comp === "FourCardsGrid") {
        body = { composition: "FourCardsGrid", props: fourCardsProps }
      } else if (isStyleComp(comp)) {
        body = { composition: comp, props: styleProps[comp], duration: STYLE_COMPS[comp].durationInFrames }
      } else {
        let imageData: string | undefined, imageExt: string | undefined
        if (imageFile) {
          imageData = await fileToDataURL(imageFile)
          imageExt = imageFile.name.split(".").pop() || "jpg"
        }
        const sendProps = {
          ...props,
          bgImage: imageData || props.bgImage.startsWith("blob:") ? "" : props.bgImage,
        }
        body = { composition: "PatternTitle", props: sendProps, imageData, imageExt, duration }
      }
      body.ratio = ratio
      const res = await fetch(`${SERVER}/render`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setVideoUrl(`${SERVER}${json.url}`)
      setStatus("Done — your MP4 is ready below.")
      toast.success("Render complete.")
      if (userId) {
        fetch("/api/log-render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            composition: comp,
            durationSec: Math.round(
              (comp === "Timeline" ? calculateTimelineDuration(liveScenes()) : duration) / 30,
            ),
            status: "success",
          }),
        }).catch((err) => console.error("[v0] log-render error", err))
      }
    } catch (e) {
      setStatus("Error — is the render server up? (npm run server)")
      console.error("[v0] render error", e)
      toast.error("Render failed — is the render server running?")
      if (userId) {
        fetch("/api/log-render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            composition: comp,
            durationSec: Math.round(
              (comp === "Timeline" ? calculateTimelineDuration(liveScenes()) : duration) / 30,
            ),
            status: "failed",
          }),
        }).catch((err) => console.error("[v0] log-render error", err))
      }
    } finally {
      setRendering(false)
    }
  }

  const applyTemplate = (tprops: Partial<PatternTitleProps>) => {
    setProps({ ...patternTitleDefaults, ...tprops })
    setDuration(180)
    setSelectedId(tprops.titles?.[0]?.id ?? "")
  }

  const value: EditorContextValue = {
    isSignedIn,
    userId,
    userName,
    AuthUI,
    comp,
    switchComp,
    isPattern,
    props,
    set,
    setProps,
    toggleReactive,
    inputProps,
    assemblyProps,
    setAssemblyProps,
    introProps,
    setIntroProps,
    fourCardsProps,
    setFourCardsProps,
    updateCard,
    styleProps,
    setStyleProp,
    reseedStyle,
    duration,
    setDuration,
    selectedId,
    setSelectedId,
    sel,
    setTitle,
    addTitle,
    removeTitle,
    dragRef,
    draggingRef,
    moveSel,
    toggleShape,
    allShapes,
    has,
    toggleColor,
    customs,
    replaceColor,
    removeColor,
    addColor,
    onImage,
    scenes,
    current,
    previewMode,
    setPreviewMode,
    timelineMusic,
    setTimelineMusic,
    liveScenes,
    selectScene,
    addScene,
    duplicateScene,
    deleteScene,
    moveScene,
    setTransition,
    FPS,
    pxPerSec,
    setPxPerSec,
    playhead,
    playerRef,
    setSceneDuration,
    onResizeDown,
    onResizeMove,
    onResizeUp,
    fmtClock,
    ratio,
    setRatio,
    rendering,
    videoUrl,
    status,
    render,
    save,
    load,
    aiPrompt,
    setAiPrompt,
    aiBusy,
    generateAI,
    script,
    scriptBusy,
    writeScript,
    cloudScenes,
    cloudLoading,
    cloudError,
    cloudSaveName,
    setCloudSaveName,
    fetchCloudScenes,
    saveSceneToCloud,
    loadSceneFromCloud,
    deleteSceneFromCloud,
    applyTemplate,
  }

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}
