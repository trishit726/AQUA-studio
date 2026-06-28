import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { FONT_FAMILY as INTER } from "../lib/fonts";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { Backdrop, GrainOverlay } from "../lib/textures";

const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export const soundShowcaseSchema = z.object({
  bgColor: zColor(),
  titleColor: zColor(),
  grain: z.number(),
});

export type SoundShowcaseProps = z.infer<typeof soundShowcaseSchema>;

export const soundShowcaseDefaults: SoundShowcaseProps = {
  bgColor: "#dbd7c7", // ambient cream
  titleColor: "#111111",
  grain: 0.1,
};

type SoundItem = {
  label: string;
  soundPath: string;
  triggerFrame: number;
  color: string;
  textColor: string;
  subLabel: string;
};

const SOUND_ITEMS: SoundItem[] = [
  {
    label: "CLICK 01",
    soundPath: "sfx/kenney/click1.wav",
    triggerFrame: 20,
    color: "#f74026", // Vermilion Red
    textColor: "#ffffff",
    subLabel: "Mechanical micro-click",
  },
  {
    label: "SWITCH 05",
    soundPath: "sfx/kenney/switch5.wav",
    triggerFrame: 45,
    color: "#5d7a5c", // Sage Green
    textColor: "#ffffff",
    subLabel: "Tactile toggle click",
  },
  {
    label: "ROLLOVER 02",
    soundPath: "sfx/kenney/rollover2.wav",
    triggerFrame: 70,
    color: "#c79a4a", // Ochre Yellow
    textColor: "#111111",
    subLabel: "Soft interface swoop",
  },
  {
    label: "SWITCH 12",
    soundPath: "sfx/kenney/switch12.wav",
    triggerFrame: 95,
    color: "#5f7e96", // Slate Blue
    textColor: "#ffffff",
    subLabel: "Heavy slider slap",
  },
  {
    label: "DING CHIME",
    soundPath: "sfx/ding.wav",
    triggerFrame: 120,
    color: "#111111", // Ink Black
    textColor: "#ffffff",
    subLabel: "Climatic bell chime",
  },
];

export const SoundShowcase: React.FC<SoundShowcaseProps> = ({
  bgColor,
  titleColor,
  grain,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header animations
  const headerSpring = spring({
    frame,
    fps,
    config: { damping: 12 },
  });
  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);
  const headerScale = interpolate(headerSpring, [0, 1], [0.9, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      {/* Texture Background */}
      <Backdrop variant="studio" />

      {/* Title Header */}
      <div
        style={{
          position: "absolute",
          top: 80,
          width: "100%",
          textAlign: "center",
          opacity: headerOpacity,
          transform: `scale(${headerScale})`,
        }}
      >
        <h1
          style={{
            fontFamily: ANTON,
            fontSize: 64,
            letterSpacing: 2,
            color: titleColor,
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          Tactile Audio Showcase
        </h1>
        <p
          style={{
            fontFamily: INTER,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: 4,
            color: "#6b6557",
            marginTop: 8,
            textTransform: "uppercase",
          }}
        >
          Testing Kenney UI Sound Effects in Remotion
        </p>
      </div>

      {/* Row of Sound blocks */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
          position: "absolute",
          top: 280,
          width: "100%",
          padding: "0 80px",
          boxSizing: "border-box",
        }}
      >
        {SOUND_ITEMS.map((item, i) => {
          // Bouncy entrance animation starting at item.triggerFrame
          const itemSpring = spring({
            frame: frame - item.triggerFrame,
            fps,
            config: {
              damping: 11,
              mass: 0.8,
              stiffness: 100,
            },
          });

          const scale = interpolate(itemSpring, [0, 1], [0, 1]);
          const opacity = interpolate(itemSpring, [0, 1], [0, 1]);
          const translateY = interpolate(itemSpring, [0, 1], [80, 0]);

          return (
            <React.Fragment key={i}>
              {/* Trigger the audio file at the exact start frame */}
              <Sequence from={item.triggerFrame} durationInFrames={30}>
                <Audio src={staticFile(item.soundPath)} volume={0.7} />
              </Sequence>

              {/* Visual Card block */}
              <div
                style={{
                  width: 280,
                  height: 480,
                  backgroundColor: item.color,
                  borderRadius: 24,
                  border: "2px solid #111111",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.15)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: 32,
                  boxSizing: "border-box",
                  opacity,
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  transformOrigin: "center bottom",
                  transition: "transform 0.1s ease-out",
                }}
              >
                {/* Number indicator */}
                <span
                  style={{
                    fontFamily: INTER,
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: item.textColor,
                    opacity: 0.6,
                  }}
                >
                  0{i + 1}
                </span>

                {/* Main Label */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <h2
                    style={{
                      fontFamily: ANTON,
                      fontSize: 42,
                      letterSpacing: 1,
                      color: item.textColor,
                      margin: 0,
                      lineHeight: 1.1,
                    }}
                  >
                    {item.label}
                  </h2>
                  <span
                    style={{
                      fontFamily: INTER,
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      color: item.textColor,
                      opacity: 0.8,
                    }}
                  >
                    {item.subLabel}
                  </span>
                </div>

                {/* Waveform indicator */}
                <div style={{ display: "flex", gap: 4, height: 40, alignItems: "flex-end" }}>
                  {Array.from({ length: 12 }).map((_, barIdx) => {
                    // Make the waveform bars animate when the sound is triggered
                    const relativeFrame = frame - item.triggerFrame;
                    const isActive = relativeFrame >= 0 && relativeFrame < 20;
                    
                    // Seeded random height for waveform bars
                    const seedHeight = Math.sin(barIdx * 1.5 + 2) * 15 + 20;
                    
                    // Decaying height after trigger
                    const decay = isActive ? Math.max(0, 1 - relativeFrame / 20) : 0;
                    const height = isActive ? seedHeight * decay + 4 : 4;

                    return (
                      <div
                        key={barIdx}
                        style={{
                          flex: 1,
                          height,
                          backgroundColor: item.textColor,
                          borderRadius: 2,
                          opacity: isActive ? 0.9 : 0.2,
                          transition: "height 0.05s ease-out",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Subtext info */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          width: "100%",
          textAlign: "center",
          fontFamily: INTER,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 1.5,
          color: "#8c8577",
          textTransform: "uppercase",
        }}
      >
        Sound triggers are frame-synced to card pop-ins
      </div>

      {/* Film Grain & Vignette Overlay */}
      <GrainOverlay name="showcase-grain" intensity={grain} mottle={0.15} />
    </AbsoluteFill>
  );
};
