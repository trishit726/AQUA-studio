# Devpost Submission Kit — Aqua Studio

Copy‑paste material for the UOE Summer of Code 2026 form, plus the demo‑video script and shot list. (This file is for you; it can stay in the repo or be deleted before final push.)

---

## Project name
**Aqua Studio**

## Tagline (elevator pitch)
Describe your brand in a sentence — get a broadcast‑quality animated title, rendered to MP4, in seconds.

## Theme
Open Innovation

---

## Inspiration
High‑end motion graphics are gatekept. A single animated brand title can cost hundreds of dollars or hours in After Effects, and the skills don't transfer to non‑designers — founders, students, small creators. Template tools look generic; pro tools are too hard. We wanted the bold, editorial title style you see on great brand channels to be one sentence away for anyone.

## What it does
Aqua Studio turns a one‑line brand description into a finished animated title:
- **AI brand‑from‑a‑prompt** — Google Gemini designs a full scene from your description: headline + sub‑label, a cohesive colour palette, which geometric shapes to scatter, density/proximity, and layout — returned as structured, validated data that drops straight into the editor.
- **Live editor** — drag titles, tune sliders, pick shapes and brand colours, add music/SFX, save/load scenes. Everything the AI makes stays fully editable.
- **One‑click MP4** — a local render server bundles the scene with Remotion and exports a real H.264 MP4.
- **AI script‑writer** — one click drafts a 45–75s voiceover script for the brand/demo video.
- **Ready‑made films** — branded openers you can export as polished bookends.

## How we built it
- **Remotion 4 + React 19 + TypeScript** for the animated compositions (deterministic, frame‑accurate).
- A **Vite** editor wrapping the **Remotion Player** for live preview, with Zod‑typed scene props.
- An **Express render server** that (a) calls **Claude** server‑side for scene + script generation and (b) renders MP4s with `@remotion/renderer`.
- **Google Gemini** (`gemini-2.5-flash`) via Google AI Studio (`@google/genai`); a provider-agnostic layer also runs Claude on Vertex (`@anthropic-ai/vertex-sdk`) or the first‑party **Anthropic API** — selectable with one env flag.
- A deterministic, seeded **pattern engine** (adapted from the MIT‑licensed `patterngen-oss`) that scatters shapes around the title.

## Challenges we ran into
- **Making AI output safe to render.** LLM JSON can't be trusted blindly — we constrain Claude with a precise schema and then validate/clamp every field server‑side (coordinates, sizes, slider ranges, shape ids, hex colours) before it ever reaches the renderer.
- **Deterministic animation.** Renders must be identical every frame, so the generator is pure seeded math — no randomness at render time.
- **Cloud AI access.** Claude on Vertex AI requires per‑project model quota; we built a provider abstraction so the exact same code runs on Vertex (GCP credits) or the Anthropic API without changes.

## Accomplishments we're proud of
A genuine prompt‑to‑MP4 pipeline: type a sentence, get an on‑brand, editable, broadcast‑style title you can export — with the AI output guaranteed to fit a real, editable schema.

## What we learned
How to bridge a generative model to a deterministic rendering engine safely, and how to design an AI feature that augments a creative tool instead of replacing the user's control.

## What's next
Social export presets (9:16, 1:1), audio‑reactive patterns, brand‑kit memory, and a hosted render queue.

---

## Technologies Used (comma‑separated for the form)
React, TypeScript, Remotion, Vite, Node.js, Express, Google Gemini (Google AI Studio), provider-agnostic AI layer (also Claude via Vertex AI / Anthropic API), Zod, FFmpeg, HTML5 Canvas/SVG

## Required submission checklist
- [ ] Project name: **Aqua Studio**
- [ ] Team information
- [ ] Detailed description (use *What it does* + *How we built it* above)
- [x] GitHub repo: https://github.com/trishit726/Pattern-Studio
- [ ] Demo link / working prototype (run locally, or upload the demo MP4)
- [ ] Presentation slides / documentation (README + this file)
- [x] Technologies Used (above)
- [ ] Walkthrough video (script below)

---

## Demo video — script (voiceover, ~60s)

> **Hook** — “Great brand titles usually cost a designer and a week. Watch me make one in fifteen seconds.”
>
> **Problem** — “Motion graphics are gatekept — too expensive for small creators, too hard for non‑designers, and template tools all look the same.”
>
> **Solution / demo** — “This is Aqua Studio. I describe my brand in one line…” *(type: “Ember — a warm, rustic specialty coffee roaster”)* “…and Gemini designs the whole title: the headline, the palette, the pattern, the layout. Everything stays editable — I’ll drag the title, warm up the colour, tweak the density. Then one click…” *(Render)* “…and I’ve got a finished MP4.”
>
> **CTA** — “Prompt to broadcast‑quality motion, in seconds. That’s Aqua Studio — open source on GitHub.”

## Demo video — shot list
1. **Cold open (0–3s):** the branded `Intro`/`PatternTitle` render as a title card (export from the app).
2. **The pitch (3–10s):** talking‑head or screen with the hook line.
3. **The magic (10–35s):** screen‑record the editor — type the prompt → **Generate Scene** → the scene fills in. Let it breathe.
4. **Control (35–48s):** drag a title, move a slider, change a colour — show it stays editable.
5. **Payoff (48–58s):** click **Render**, show the MP4 playing/downloading.
6. **Close (58–62s):** end card (`Assembly` end frame) + GitHub URL.

**Recording tips:** Windows **Win+G** (Game Bar) or OBS for screen capture. Record the editor at 1080p. If live AI isn't connected yet at record time, you can still show the full manual design → Render flow and the AI panel; swap in the AI clip once Claude access is granted.

---

## Note on attribution (for judges)
The pattern engine is adapted from the MIT‑licensed `patterngen-oss` (credited in `NOTICE.md`); the editor, the Remotion → MP4 pipeline, and the AI scene/script generation are original to this project.
