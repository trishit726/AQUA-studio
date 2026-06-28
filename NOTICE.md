# Notices & Attributions

Aqua Studio is built on open-source work and openly-licensed assets. Credit
where it's due:

## Pattern generation engine

The procedural pattern placement engine in `src/lib/patterngen/` is **ported and
adapted from [`patterngen-oss`](https://github.com/halfof8/patterngen) by halfof8
(MIT License)**. The original is a seeded generator that scatters shapes/squares/
dots around a title; this project re-implements it to be Remotion-native and
deterministic per frame, and builds a new product around it (a live web editor,
an MP4 render pipeline, and AI-driven scene generation).

Original copyright © halfof8, MIT License.

## Frameworks & libraries

- **[Remotion](https://www.remotion.dev)** `4.0.481` — programmatic video in React.
  Remotion has its own license; this project uses it under the terms applicable to
  individuals / small teams. See https://www.remotion.dev/license.
- React, Vite, Express, Zod — their respective open-source licenses.

## Fonts

- **Anton** and **Shippori Mincho** — Google Fonts, SIL Open Font License (OFL).

## Audio

- Background music and SFX in `public/music/` and `public/sfx/` are **CC0**
  (public domain). See `public/music/CREDITS.txt`.

## AI

- Scene-from-a-prompt and script generation use **Anthropic's Claude** API.
