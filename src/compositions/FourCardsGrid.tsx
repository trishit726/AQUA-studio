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
  Video,
} from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { FONT_FAMILY as INTER } from "../lib/fonts";
import { Backdrop, GrainOverlay } from "../lib/textures";

export const cardItemSchema = z.object({
  videoUrl: z.string(),
  title: z.string(),
  alignX: z.number().min(0).max(100).default(50).optional(),
  alignY: z.number().min(0).max(100).default(50).optional(),
});

export const fourCardsSchema = z.object({
  cards: z.array(cardItemSchema),
  bgColor: zColor(),
  grain: z.number(),
  stagger: z.number(),
  cardWidth: z.number(),
  cardHeight: z.number(),
  cardBorderColor: zColor(),
  cardBgColor: zColor(),
  textColor: zColor(),
  sfx: z.boolean(),
});

export type FourCardsProps = z.infer<typeof fourCardsSchema>;

export const fourCardsDefaults: FourCardsProps = {
  cards: [
    {
      videoUrl: "examples/conformity-step1.mp4",
      title: "01. READ CONTRACT (spec_to_graph.py)",
      alignX: 50,
      alignY: 50,
    },
    {
      videoUrl: "examples/conformity-step2.mp4",
      title: "02. QUERY ORBIT (code_graph.py)",
      alignX: 50,
      alignY: 50,
    },
    {
      videoUrl: "examples/conformity-step3.mp4",
      title: "03. DIFF GRAPHS (diff_graphs.py)",
      alignX: 50,
      alignY: 50,
    },
    {
      videoUrl: "examples/conformity-step4.mp4",
      title: "04. GATE MERGE (render_block.py)",
      alignX: 50,
      alignY: 50,
    },
  ],
  bgColor: "#0b0e14",
  grain: 0.1,
  stagger: 8,
  cardWidth: 360,
  cardHeight: 640,
  cardBorderColor: "#ff4a4a",
  cardBgColor: "#0d1117",
  textColor: "#ffffff",
  sfx: true,
};

export const FourCardsGrid: React.FC<FourCardsProps> = ({
  cards,
  bgColor,
  grain,
  stagger,
  cardWidth,
  cardHeight,
  cardBorderColor,
  cardBgColor,
  textColor,
  sfx,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Position Calculations
  const numCards = cards.length;
  const totalCardWidth = numCards * cardWidth;
  const remainingWidth = width - totalCardWidth;
  const gap = remainingWidth / (numCards + 1);

  const cardTop = (height - cardHeight) / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      {/* Texture Layer */}
      <Backdrop variant="studio" />

      {/* Grid of Cards */}
      {cards.map((card, i) => {
        const delay = i * stagger;
        
        // Bouncy Card Entrance Animation
        const cardSpring = spring({
          frame: frame - delay,
          fps,
          config: {
            damping: 13,
            mass: 0.85,
            stiffness: 90,
          },
        });

        const scale = interpolate(cardSpring, [0, 1], [0.8, 1]);
        const opacity = interpolate(cardSpring, [0, 1], [0, 1]);
        const translateY = interpolate(cardSpring, [0, 1], [150, 0]);

        // Caption Animations (fades and slides in slightly after card entrance starts)
        const textSpring = spring({
          frame: frame - delay - 5,
          fps,
          config: {
            damping: 15,
            mass: 0.7,
            stiffness: 110,
          },
        });
        const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);
        const textTranslateY = interpolate(textSpring, [0, 1], [15, 0]);

        // Left coordinate of the card
        const left = gap + i * (cardWidth + gap);

        // Alternating label placement: Odd cards at bottom, Even cards at top
        const isLabelAtBottom = i % 2 === 0;
        const labelTop = isLabelAtBottom 
          ? cardTop + cardHeight + 28
          : cardTop - 52;

        return (
          <React.Fragment key={i}>
            {/* Timed Sound Effect triggers */}
            {sfx && (
              <Sequence from={delay} durationInFrames={40}>
                <Audio 
                  src={staticFile(i === numCards - 1 ? "sfx/ding.wav" : "sfx/switch.wav")} 
                  volume={i === numCards - 1 ? 0.8 : 0.6} 
                />
              </Sequence>
            )}

            {/* Card Frame Container */}
            <div
              style={{
                position: "absolute",
                left,
                top: cardTop,
                width: cardWidth,
                height: cardHeight,
                opacity,
                transform: `translateY(${translateY}px) scale(${scale})`,
                transformOrigin: "center center",
                borderRadius: 28,
                border: `2px solid ${cardBorderColor}`,
                backgroundColor: cardBgColor,
                overflow: "hidden",
                boxShadow: "0 12px 36px rgba(0, 0, 0, 0.12)",
                zIndex: 10,
              }}
            >
              {/* Screen Recording Video */}
              <Video
                src={staticFile(card.videoUrl)}
                loop
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `${card.alignX ?? 50}% ${card.alignY ?? 50}%`,
                }}
              />

            </div>

            {/* Alternating Text Label */}
            <div
              style={{
                position: "absolute",
                left: left - 20,
                width: cardWidth + 40,
                top: labelTop,
                textAlign: "center",
                fontFamily: INTER,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: textColor,
                opacity: textOpacity,
                transform: `translateY(${isLabelAtBottom ? textTranslateY : -textTranslateY}px)`,
                zIndex: 5,
              }}
            >
              {card.title}
            </div>
          </React.Fragment>
        );
      })}

      {/* Film Grain & Vignette Overlay */}
      <GrainOverlay name="four-cards-grain" intensity={grain} mottle={0.15} />
    </AbsoluteFill>
  );
};
