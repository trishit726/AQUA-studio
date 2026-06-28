// Timeline — chains several PatternTitle scenes into ONE video with transitions.
// Data-driven version of the hardcoded pattern in Promo.tsx: scenes come in as
// props (each its own PatternTitle + duration + outgoing transition), so the web
// editor can build/edit a whole reel. Duration is derived from the scenes via
// calculateMetadata, so the render server needs no special-casing.
import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { z } from "zod";
import { TransitionSeries, springTiming, type TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { PatternTitle, patternTitleSchema, patternTitleDefaults, type PatternTitleProps } from "./PatternTitle";

const resolveSrc = (s: string) => (/^(https?:|blob:|data:)/.test(s) ? s : staticFile(s));

const transitionSchema = z.object({
  // "cut" = hard cut (no transition element, no overlap).
  type: z.enum(["cut", "fade", "slide", "wipe"]),
  direction: z.enum(["from-left", "from-right", "from-top", "from-bottom"]).optional(),
  durationInFrames: z.number().int().min(1).max(120),
});
export type SceneTransition = z.infer<typeof transitionSchema>;

const sceneSchema = z.object({
  id: z.string(),
  props: patternTitleSchema,
  durationInFrames: z.number().int().min(1).max(3000),
  transition: transitionSchema.optional(), // transition TO the next scene
});
export type TimelineScene = z.infer<typeof sceneSchema>;

export const timelineSchema = z.object({
  scenes: z.array(sceneSchema),
  music: z.string().optional(), // one global bed for the whole reel
});
export type TimelineProps = z.infer<typeof timelineSchema>;

// Total length = Σ scene durations − Σ transition overlaps (cuts don't overlap).
export const calculateTimelineDuration = (scenes: TimelineScene[]): number => {
  if (!scenes.length) return 1;
  let total = 0;
  scenes.forEach((s, i) => {
    total += s.durationInFrames;
    const tr = s.transition;
    if (i < scenes.length - 1 && tr && tr.type !== "cut") total -= tr.durationInFrames;
  });
  return Math.max(1, total);
};

// Remotion calculateMetadata: lets <Composition>/selectComposition derive the
// real duration from inputProps (no manual duration plumbing on the server).
export const calculateTimelineMetadata = ({ props }: { props: TimelineProps }) => ({
  durationInFrames: calculateTimelineDuration(props.scenes ?? []),
});

// All three presets return differently-typed presentations; widen to a common
// type so they can share one <TransitionSeries.Transition presentation=...>.
const presentationFor = (tr: SceneTransition): TransitionPresentation<Record<string, unknown>> => {
  if (tr.type === "slide") return slide({ direction: tr.direction ?? "from-right" }) as TransitionPresentation<Record<string, unknown>>;
  if (tr.type === "wipe") return wipe({ direction: tr.direction ?? "from-left" }) as TransitionPresentation<Record<string, unknown>>;
  return fade() as TransitionPresentation<Record<string, unknown>>;
};

const FALLBACK: TimelineScene[] = [{ id: "empty", props: patternTitleDefaults, durationInFrames: 120 }];

export const timelineDefaults: TimelineProps = {
  scenes: [
    {
      id: "sc1",
      durationInFrames: 120,
      transition: { type: "fade", durationInFrames: 15 },
      props: { ...patternTitleDefaults, music: "", sfx: false },
    },
    {
      id: "sc2",
      durationInFrames: 120,
      props: {
        ...patternTitleDefaults,
        music: "",
        sfx: false,
        titles: [
          { id: "a", kind: "block", text: "SCENE\nTWO", x: 0.37, y: 0.46, size: 130 },
          { id: "b", kind: "label", text: "EDIT EVERYTHING", x: 0.37, y: 0.61, size: 30 },
        ],
        accent: "#3fd6c2",
        bgColor: "#0e1117",
        colors: ["#3fd6c2", "#5b8def", "#9b6dff", "#ffffff"],
        seed: 21,
      },
    },
  ],
  music: "",
};

export const Timeline: React.FC<TimelineProps> = ({ scenes, music }) => {
  const list = scenes && scenes.length ? scenes : FALLBACK;
  const children: React.ReactNode[] = [];
  list.forEach((s, i) => {
    children.push(
      <TransitionSeries.Sequence key={`s-${s.id}`} durationInFrames={s.durationInFrames}>
        {/* per-scene audio is silenced — one global bed plays at the reel level */}
        <PatternTitle {...(s.props as PatternTitleProps)} music="" sfx={false} />
      </TransitionSeries.Sequence>,
    );
    const tr = s.transition;
    if (i < list.length - 1 && tr && tr.type !== "cut") {
      children.push(
        <TransitionSeries.Transition
          key={`t-${s.id}`}
          presentation={presentationFor(tr)}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: tr.durationInFrames })}
        />,
      );
    }
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      {music ? <Audio src={resolveSrc(music)} volume={0.4} /> : null}
      <TransitionSeries>{children}</TransitionSeries>
    </AbsoluteFill>
  );
};
