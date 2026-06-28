// ────────────────────────────────────────────────────────────────────────────
// Composition registry. Every graphic you want to preview / render lives here.
//
// To add a new graphic:
//   1. Build it in src/compositions/MyGraphic.tsx
//      (export the component, a `mySchema`, and `myDefaults`).
//   2. Import it below and add a <Composition /> entry.
//   3. Give it a unique `id` — that's the name you pass to `remotion render`.
//
// Width / height / fps come from src/config.ts so the whole project changes
// resolution or frame rate from one file.
// ────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Composition } from "remotion";
import { CANVAS, FPS, seconds } from "./config";

import { Assembly, assemblySchema, ASSEMBLY_DURATION } from "./compositions/Assembly";
import { Intro, introSchema, introDefaults, INTRO_DURATION } from "./compositions/Intro";
import { PatternTitle, patternTitleSchema } from "./compositions/PatternTitle";
import { SwissPoster, swissPosterSchema, SWISS_POSTER_DURATION } from "./compositions/SwissPoster";
import { Editorial, editorialSchema, editorialDefaults, EDITORIAL_DURATION, calculateEditorialMetadata } from "./compositions/editorial/Editorial";
import { Promo, promoSchema, promoDefaults, PROMO_DURATION } from "./compositions/Promo";
import { Architecture, architectureSchema, architectureDefaults, ARCH_DURATION } from "./compositions/Architecture";
import { ProblemStatement, problemSchema, problemDefaults, PROBLEM_DURATION } from "./compositions/ProblemStatement";
import { Examples, examplesSchema, examplesDefaults, EXAMPLES_DURATION } from "./compositions/Examples";
import { Timeline, timelineSchema, timelineDefaults, calculateTimelineMetadata } from "./compositions/Timeline";
import { NameReveal, nameRevealSchema } from "./compositions/NameReveal";
import { StyledNameReveal, styledNameRevealSchema } from "./compositions/StyledNameReveal";
import { DesignerInJapan, designerInJapanSchema } from "./compositions/DesignerInJapan";
import { ScriptingApp, scriptingAppSchema } from "./compositions/ScriptingApp";
import { Backdrops, backdropsSchema } from "./compositions/Backdrops";
import { PaintedDemo, paintedDemoSchema } from "./compositions/PaintedDemo";
import { Transitions, transitionsSchema, TRANSITIONS_DURATION } from "./compositions/Transitions";
import { TitleCard, titleCardSchema } from "./compositions/TitleCard";
import { LowerThird, lowerThirdSchema } from "./compositions/LowerThird";
import { KineticText, kineticTextSchema } from "./compositions/KineticText";
import { TransparentOverlay, transparentOverlaySchema } from "./compositions/TransparentOverlay";
import { FourCardsGrid, fourCardsSchema, fourCardsDefaults } from "./compositions/FourCardsGrid";
import { SoundShowcase, soundShowcaseSchema } from "./compositions/SoundShowcase";

import { SolutionArchitecture, solutionArchitectureSchema, SA_DURATION } from "./compositions/SolutionArchitecture";

// Default props are written as inline literals (not imported variables) so that
// Remotion Studio can save your live edits back into this file. The exported
// *Defaults objects in each composition file remain handy for reuse in code.

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="EditorialMotion"
        component={Editorial}
        durationInFrames={EDITORIAL_DURATION}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={editorialSchema}
        defaultProps={editorialDefaults}
        calculateMetadata={calculateEditorialMetadata}
      />

      <Composition
        id="SolutionArchitecture"
        component={SolutionArchitecture}
        durationInFrames={SA_DURATION}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={solutionArchitectureSchema}
        defaultProps={{}}
      />

      <Composition
        id="Assembly"
        component={Assembly}
        durationInFrames={ASSEMBLY_DURATION}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={assemblySchema}
        defaultProps={{
          name: "PATTERN STUDIO",
          site: "yourname.com",
          music: "",
        }}
      />

      <Composition
        id="Promo"
        component={Promo}
        durationInFrames={PROMO_DURATION}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={promoSchema}
        defaultProps={promoDefaults}
      />

      <Composition
        id="Architecture"
        component={Architecture}
        durationInFrames={ARCH_DURATION}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={architectureSchema}
        defaultProps={architectureDefaults}
      />

      <Composition
        id="ProblemStatement"
        component={ProblemStatement}
        durationInFrames={PROBLEM_DURATION}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={problemSchema}
        defaultProps={problemDefaults}
      />

      <Composition
        id="Examples"
        component={Examples}
        durationInFrames={EXAMPLES_DURATION}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={examplesSchema}
        defaultProps={examplesDefaults}
      />

      <Composition
        id="Timeline"
        component={Timeline}
        durationInFrames={seconds(8)}
        calculateMetadata={calculateTimelineMetadata}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={timelineSchema}
        defaultProps={timelineDefaults}
      />

      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={INTRO_DURATION}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={introSchema}
        defaultProps={introDefaults}
      />

      <Composition
        id="PatternTitle"
        component={PatternTitle}
        durationInFrames={seconds(5)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={patternTitleSchema}
        defaultProps={{
          titles: [
            { id: "t1", kind: "block" as const, text: "PATTERN\nSTUDIO", x: 0.36, y: 0.46, size: 130 },
            { id: "t2", kind: "label" as const, text: "MOTION, FROM A PROMPT", x: 0.36, y: 0.61, size: 30 },
          ],
          seed: 7,
          density: 10,
          proximity: 2,
          accent: "#f74026",
          bgColor: "#2b2b2b",
          bgImage: "",
          stagger: 3,
          shapes: ["arrowUp", "capsuleDiag", "capsuleH", "plug", "hBars", "barsII", "circle", "target", "squares4", "xCross", "dotGrid", "dots3", "dice5", "dice2", "nested", "stripes"],
          paint: 50,
          colors: ["#6fa5a9", "#93ab5a", "#cf9f4a", "#e0573a", "#000000", "#ffffff"],
          scatter: true,
          showGrid: false,
          music: "",
          sfx: false,
          audioReactive: false,
          intro: "none",
          floodStyle: "random",
          floodSpeed: 5,
          floodTile: 6,
          floodShapes: 5,
          floodPersist: true,
          floodSolid: false,
          cameraMove: "none",
          cameraDir: "right",
          cameraAmount: 5,
          titleAnim: "wipe",
          underline: false,
        }}
      />

      {/* SwissPoster — standalone hand-built Swiss poster (not on the Style Engine). */}
      <Composition
        id="SwissPoster"
        component={SwissPoster}
        durationInFrames={SWISS_POSTER_DURATION}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={swissPosterSchema}
        defaultProps={{
          kicker: "INTERNATIONAL TYPOGRAPHIC STYLE",
          year: "1957",
          headlineTop: "FONT",
          headlineBottom: "HEADING",
          metaLines: [
            "Order, white space, precision.",
            "Form follows function.",
            "The grid is structure, not decoration.",
          ],
          footer: "DESIGNER WITH IMPACT",
          seed: 7,
          angle: -52,
          counterAxis: true,
          nodeX: 50,
          nodeY: 48,
          barCount: 10,
          elbow: true,
          headlineSize: 230,
          paperColor: "#0e0e10",
          inkColor: "#f2efe6",
          accentColor: "#e2231a",
        }}
      />

      <Composition
        id="NameReveal"
        component={NameReveal}
        durationInFrames={seconds(6)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={nameRevealSchema}
        defaultProps={{
          name: "Fable",
          tagline: "once upon a time",
          backgroundColor: "#0b0d12",
          textColor: "#f3efe6",
          accentColor: "#c9a86a",
          staggerFrames: 5,
        }}
      />

      <Composition
        id="DesignerInJapan"
        component={DesignerInJapan}
        durationInFrames={seconds(5)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={designerInJapanSchema}
        defaultProps={{"lines":["MAKE","IT MOVE"],"byline":"BRANDED MOTION","blockColor":"#ea431d","textColor":"#111111"}}
      />

      <Composition
        id="FourCardsGrid"
        component={FourCardsGrid}
        durationInFrames={seconds(8)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={fourCardsSchema}
        defaultProps={fourCardsDefaults}
      />

      <Composition
        id="Backdrops"
        component={Backdrops}
        durationInFrames={seconds(4)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={backdropsSchema}
        defaultProps={{}}
      />

      <Composition
        id="Transitions"
        component={Transitions}
        durationInFrames={TRANSITIONS_DURATION}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={transitionsSchema}
        defaultProps={{}}
      />

      <Composition
        id="PaintedDemo"
        component={PaintedDemo}
        durationInFrames={seconds(5)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={paintedDemoSchema}
        defaultProps={{ src: "images/scene.jpg", strength: 75 }}
      />

      <Composition
        id="SoundShowcase"
        component={SoundShowcase}
        durationInFrames={seconds(6)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={soundShowcaseSchema}
        defaultProps={{
          bgColor: "#dbd7c7",
          titleColor: "#111111",
          grain: 0.1,
        }}
      />

      <Composition
        id="ScriptingApp"
        component={ScriptingApp}
        durationInFrames={seconds(9)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={scriptingAppSchema}
        defaultProps={{
          appName: "script engine",
          accent: "#f74026",
        }}
      />

      <Composition
        id="Fable-Japanese"
        component={StyledNameReveal}
        durationInFrames={seconds(7)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={styledNameRevealSchema}
        defaultProps={{
          name: "Fable",
          tagline: "monogatari   ·   a tale",
          style: "japanese" as const,
        }}
      />

      <Composition
        id="Fable-Anthropic"
        component={StyledNameReveal}
        durationInFrames={seconds(6)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={styledNameRevealSchema}
        defaultProps={{
          name: "Fable",
          tagline: "once upon a time",
          style: "anthropic" as const,
        }}
      />

      <Composition
        id="TitleCard"
        component={TitleCard}
        durationInFrames={seconds(5)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={titleCardSchema}
        defaultProps={{
          title: "Your Title Here",
          subtitle: "A neutral starting point you can restyle",
          backgroundColor: "#0f1115",
          textColor: "#f5f6f8",
          accentColor: "#5b8def",
        }}
      />

      <Composition
        id="LowerThird"
        component={LowerThird}
        durationInFrames={seconds(5)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={lowerThirdSchema}
        defaultProps={{
          name: "Jane Doe",
          role: "Motion Designer",
          barColor: "#1a1d24",
          textColor: "#f5f6f8",
          accentColor: "#5b8def",
        }}
      />

      <Composition
        id="KineticText"
        component={KineticText}
        durationInFrames={seconds(5)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={kineticTextSchema}
        defaultProps={{"text":"  M  O  T  I  O  N ","backgroundColor":"#0f1115","textColor":"#f5f6f8","staggerFrames":4}}
      />

      {/*
        Transparent overlay. The component sets NO background, so when rendered
        with the ProRes 4444 (or WebM/VP9) command in the README, it keeps a
        real alpha channel. In Studio it shows on a checkerboard.
      */}
      <Composition
        id="TransparentOverlay"
        component={TransparentOverlay}
        durationInFrames={seconds(4)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={transparentOverlaySchema}
        defaultProps={{"label":"LIVE","badgeColor":"#ee074f","textColor":"#ffffff"}}
      />
    </>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Adding a sound effect (nice-to-have example).
//
// Put the file in public/sfx/whoosh.mp3, then wrap your graphic and the audio
// in a parent component. Use <Sequence from={...}> to time the sound, and trim
// any leading silence in the file first so the hit lands on frame `from`.
//
//   import { AbsoluteFill, Sequence, staticFile } from "remotion";
//   import { Audio } from "@remotion/media";
//
//   const TitleWithSfx = () => (
//     <AbsoluteFill>
//       <TitleCard {...titleCardDefaults} />
//       <Sequence from={seconds(0.2)}>
//         <Audio src={staticFile("sfx/whoosh.mp3")} />
//       </Sequence>
//     </AbsoluteFill>
//   );
//
// Then register <Composition id="TitleWithSfx" component={TitleWithSfx} ... />.
// ────────────────────────────────────────────────────────────────────────────
