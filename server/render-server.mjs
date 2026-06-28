// Local render server for the Aqua Studio web app.
// POST /render { props, imageData?, imageExt?, duration?, composition? }
//   → renders the chosen composition to out/pattern-<id>.mp4 and returns its URL.
// Runs entirely on your machine.
import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { AnthropicVertex } from "@anthropic-ai/vertex-sdk";
import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { execFile } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { STORAGE_ENABLED, uploadRender } from "./lib/storage.mjs";
import { metric } from "./lib/metrics.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUT = path.join(ROOT, "out");
const IMAGES = path.join(ROOT, "public", "images");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(IMAGES, { recursive: true });

// ── Aspect-ratio + multi-format export ───────────────────────────────────────
// Renders are 1920x1080 MP4; everything else (other ratios, WebM, GIF) is derived
// from that base file with ffmpeg — center-cropped so the design stays intact
// (no re-layout) and transcoded to the target codec. One Remotion render, many
// outputs.
const RATIOS = { "16:9": 16 / 9, "3:2": 3 / 2, "4:3": 4 / 3, "5:4": 5 / 4, "1:1": 1, "4:5": 4 / 5, "9:16": 9 / 16 };

// Center-crop rectangle for a ratio against the 1920x1080 source (null for 16:9).
function cropRect(ratio) {
  const ar = RATIOS[ratio];
  if (!ar || ratio === "16:9") return null;
  const SW = 1920, SH = 1080, sAR = SW / SH;
  let cw, ch;
  if (ar <= sAR) { ch = SH; cw = Math.round(SH * ar); } else { cw = SW; ch = Math.round(SW / ar); }
  cw -= cw % 2; ch -= ch % 2;
  const x = Math.round((SW - cw) / 2), y = Math.round((SH - ch) / 2);
  return `crop=${cw}:${ch}:${x}:${y}`;
}

// Derive one output file (format × ratio) from the base 1920x1080 MP4.
function deriveOutput(src, { format, ratio, id }) {
  const ext = format === "webm" ? "webm" : format === "gif" ? "gif" : "mp4";
  const tag = ratio === "16:9" ? "" : `-${ratio.replace(":", "x")}`;
  const rel = `pattern-${id}-${format}${tag}.${ext}`;
  const outPath = path.join(OUT, rel);
  const crop = cropRect(ratio);
  let args;
  if (format === "gif") {
    // crop → 15fps → 640w → palette for a clean, size-bounded GIF.
    const vf = [crop, "fps=15", "scale=640:-1:flags=lanczos", "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"].filter(Boolean).join(",");
    args = ["-y", "-i", src, "-vf", vf, "-loop", "0", outPath];
  } else if (format === "webm") {
    args = ["-y", "-i", src, ...(crop ? ["-vf", crop] : []), "-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-c:a", "libopus", outPath];
  } else {
    args = ["-y", "-i", src, ...(crop ? ["-vf", crop] : []), "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy", outPath];
  }
  return new Promise((resolve) => {
    execFile(ffmpegPath, args, (err) => {
      if (err) { console.error(`ffmpeg ${format} ${ratio} failed:`, err.message); resolve(null); }
      else resolve(`/out/${rel}`);
    });
  });
}

// ── Claude (Anthropic) — AI "brand-from-a-prompt" + script writer ────────────
// Calls run server-side only, so the API key never reaches the browser.
// Default: first-party Anthropic API (set ANTHROPIC_API_KEY in .env).
// To use Google Cloud / Vertex credits instead, swap `new Anthropic()` for the
// AnthropicVertex client from `@anthropic-ai/vertex-sdk` (same call shape).
// AI provider: "gemini" (Google AI Studio key), "vertex" (Claude on GCP via ADC),
// or "anthropic" (first-party Claude key). Auto-detect from whatever creds exist.
const AI_PROVIDER = (
  process.env.CLAUDE_PROVIDER ||
  (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    ? "gemini"
    : process.env.ANTHROPIC_VERTEX_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT
      ? "vertex"
      : "anthropic")
).toLowerCase();
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-opus-4-8";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
console.log(`AI provider: ${AI_PROVIDER} (${AI_PROVIDER === "gemini" ? GEMINI_MODEL : CLAUDE_MODEL})`);

let claude = null;
const getAnthropic = () => {
  if (claude) return claude;
  if (AI_PROVIDER === "vertex") {
    const projectId = process.env.ANTHROPIC_VERTEX_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    const region = process.env.CLOUD_ML_REGION || process.env.CLAUDE_REGION || "global";
    if (!projectId)
      throw new Error("Vertex mode: set ANTHROPIC_VERTEX_PROJECT_ID (your GCP project) in .env, and run `gcloud auth application-default login`.");
    claude = new AnthropicVertex({ projectId, region });
  } else {
    if (!process.env.ANTHROPIC_API_KEY)
      throw new Error("Set ANTHROPIC_API_KEY in .env (or CLAUDE_PROVIDER=gemini / vertex).");
    claude = new Anthropic();
  }
  return claude;
};

let gemini = null;
const getGemini = () => {
  if (gemini) return gemini;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Set GEMINI_API_KEY in .env (free key from aistudio.google.com).");
  gemini = new GoogleGenAI({ apiKey });
  return gemini;
};

// Unified text generation across providers — both AI features call this.
async function generateText({ system, user, maxTokens, json = false }) {
  if (AI_PROVIDER === "gemini") {
    const ai = getGemini();
    const config = {
      systemInstruction: system,
      maxOutputTokens: maxTokens,
      temperature: 0.9,
      thinkingConfig: { thinkingBudget: 0 }, // skip thinking — these are quick generation tasks
    };
    if (json) config.responseMimeType = "application/json";
    const r = await ai.models.generateContent({ model: GEMINI_MODEL, contents: user, config });
    return r.text ?? "";
  }
  const client = getAnthropic();
  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

const SHAPE_IDS = [
  "arrowUp", "capsuleDiag", "capsuleH", "plug", "hBars", "barsII", "circle",
  "target", "squares4", "xCross", "dotGrid", "dots3", "dice5", "dice2", "nested", "stripes",
];

const clampNum = (v, lo, hi, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fallback;
};
const isHex = (s) => typeof s === "string" && /^#?[0-9a-fA-F]{3,8}$/.test(s.trim());
const normHex = (s, fallback) => (isHex(s) ? (s.trim().startsWith("#") ? s.trim() : "#" + s.trim()) : fallback);

// Strip ```json fences / stray prose, then JSON.parse.
const parseJson = (text) => {
  let t = String(text).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{"), end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
};

const SYSTEM_GENERATE = `You are a senior brand and motion designer working inside "Aqua Studio", a tool that turns a one-line brand description into a bold animated title card: heavy condensed UPPERCASE caps inside a vivid colored block, with small geometric shapes scattered around it on a dark background.

Given a short description of a brand, product, topic, or event, design ONE striking title card and return it as a single JSON object with EXACTLY these fields:

{
  "titles": [
    { "kind": "block", "text": "TWO\\nWORDS", "x": 0.36, "y": 0.46, "size": 130 },
    { "kind": "label", "text": "A SHORT TAGLINE", "x": 0.36, "y": 0.61, "size": 30 }
  ],
  "accent": "#e0573a",
  "bgColor": "#2b2b2b",
  "colors": ["#6fa5a9", "#cf9f4a", "#e0573a"],
  "density": 11,
  "proximity": 11,
  "seed": 7,
  "shapes": ["circle", "target", "xCross", "dots3", "squares4", "stripes"]
}

Rules:
- titles: exactly one main "block" (the punchy title, 1-3 words, UPPERCASE, use \\n to split two lines), plus optionally one "label" (a short uppercase tagline) and/or one "jp" (a SHORT vertical Japanese accent — ONLY if the brand is genuinely Japan-related; otherwise omit it).
- x, y are fractions 0..1 of a 1920x1080 canvas. Keep the block centered-left (x ~0.34-0.46) and vertically centered (y ~0.44-0.62). Put a label just below the block; put a jp accent to the right of it.
- size: block ~110-150, label ~26-34, jp ~36-44.
- accent must pop against bgColor. Choose a palette ("colors", 3-6 hex) that evokes the brand's mood.
- density is 8-12 (how many shapes). proximity is 2-4 (keep shapes clustered tightly AROUND the title — higher values scatter them across the whole frame and look cluttered, so stay low). seed is any integer.
- shapes: 6-12 ids chosen ONLY from: ${SHAPE_IDS.join(", ")}.
- Respond with ONLY the JSON object — no prose, no markdown, no code fences.`;

const SYSTEM_SCRIPT = `You are a scriptwriter for short product-demo and brand videos. Given a brand or topic, write a punchy spoken voiceover script for a 45-75 second video. Structure it as: a 1-line HOOK, a 1-2 line PROBLEM, a 2-3 line SOLUTION/what it does, and a 1-line CALL TO ACTION. Write plain narration the creator reads aloud (no stage directions, no headers unless they help). Keep it energetic, concrete, and under ~140 words.`;

const app = express();
app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use("/out", express.static(OUT));

// Bundle the Remotion project once (cached for subsequent renders).
let serveUrlPromise = null;
const getServeUrl = () => {
  if (!serveUrlPromise) {
    console.log("Bundling Remotion project (first render only)…");
    serveUrlPromise = bundle({ entryPoint: path.join(ROOT, "src", "index.ts") });
  }
  return serveUrlPromise;
};

app.post("/render", async (req, res) => {
  const { props = {}, imageData, imageExt = "jpg", duration, composition: compId = "PatternTitle" } = req.body;
  const id = `${Date.now()}`;
  const renderStart = Date.now();
  try {
    // Pass an uploaded background photo straight through as a data URL. The
    // composition's <Img> resolves data:/blob:/http: sources directly (see
    // resolveSrc in the compositions), so we must NOT write it into public/ —
    // the Remotion bundle snapshots public/ once at first render and never
    // re-serves files added afterwards (they 404, cancelling the render).
    if (imageData) {
      props.bgImage = imageData.startsWith("data:")
        ? imageData
        : `data:image/${imageExt === "jpg" ? "jpeg" : imageExt};base64,${imageData}`;
    }

    const serveUrl = await getServeUrl();
    // Pin the renderer's internal server port (3000 is often taken).
    const composition = await selectComposition({ serveUrl, id: compId, inputProps: props, port: 3017 });
    if (duration) composition.durationInFrames = duration;

    const outputLocation = path.join(OUT, `pattern-${id}.mp4`);
    console.log(`Rendering ${compId} → pattern-${id}.mp4 …`);
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      crf: 18,
      outputLocation,
      inputProps: props,
      port: 3018,
    });
    console.log("Done:", outputLocation);

    // Derive every requested output from the base MP4.
    const formats = Array.isArray(req.body.formats) && req.body.formats.length ? req.body.formats : ["mp4"];
    const batchRatios = !!req.body.batchRatios;
    const selRatio = req.body.ratio || "16:9";
    const outputs = [];

    // MP4 is the primary deliverable — supports batch-all-ratios.
    if (formats.includes("mp4")) {
      const mp4Ratios = batchRatios ? Object.keys(RATIOS) : [selRatio];
      for (const r of mp4Ratios) {
        if (r === "16:9") { outputs.push({ format: "mp4", ratio: "16:9", url: `/out/pattern-${id}.mp4` }); }
        else { const u = await deriveOutput(outputLocation, { format: "mp4", ratio: r, id }); if (u) { outputs.push({ format: "mp4", ratio: r, url: u }); console.log(`mp4 → ${r}`); } }
      }
    }
    // WebM + GIF render at the selected ratio.
    for (const fmt of ["webm", "gif"]) {
      if (formats.includes(fmt)) {
        const u = await deriveOutput(outputLocation, { format: fmt, ratio: selRatio, id });
        if (u) { outputs.push({ format: fmt, ratio: selRatio, url: u }); console.log(`${fmt} → ${selRatio}`); }
      }
    }

    // Push each output to S3/CloudFront when object storage is configured. The
    // render box stays stateless (files don't have to live on it), the browser
    // pulls from the CDN, and renders survive the box restarting. If a single
    // upload fails we keep that output's local /out URL — storage must never
    // fail an otherwise-successful render.
    if (STORAGE_ENABLED) {
      await Promise.all(
        outputs.map(async (o) => {
          const file = o.url.replace(/^\/out\//, "");
          const cdnUrl = await uploadRender(path.join(OUT, file), `renders/${id}/${file}`);
          if (cdnUrl) o.url = cdnUrl;
        }),
      );
      console.log(`Uploaded ${outputs.length} output(s) to S3 (renders/${id}/)`);
    }

    // `url` = primary output (selected-ratio MP4 when present) for back-compat.
    const primary = outputs.find((o) => o.format === "mp4" && o.ratio === selRatio) || outputs.find((o) => o.format === "mp4") || outputs[0];
    metric("RenderDurationMs", Date.now() - renderStart, "Milliseconds", { composition: compId });
    metric("RenderCompleted", 1, "Count", { composition: compId, outputs: outputs.length });
    res.json({ url: primary?.url ?? `/out/pattern-${id}.mp4`, outputs });
  } catch (e) {
    metric("Errors", 1, "Count", { op: "render" });
    console.error(e);
    res.status(500).send(String(e?.message ?? e));
  }
});

// AI brand-from-a-prompt → a full PatternTitle scene the editor can drop in.
app.post("/generate", async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || !String(prompt).trim()) return res.status(400).send("Missing 'prompt'.");
  const aiStart = Date.now();
  try {
    const text = await generateText({
      system: SYSTEM_GENERATE,
      user: `Brand / topic: ${String(prompt).trim()}`,
      maxTokens: 2000,
      json: true,
    });
    const raw = parseJson(text);
    metric("AiGenerateMs", Date.now() - aiStart, "Milliseconds");

    // Validate + clamp into the PatternTitle prop ranges (never trust the model blindly).
    const kinds = new Set(["block", "label", "jp"]);
    const titles = (Array.isArray(raw.titles) ? raw.titles : [])
      .filter((t) => t && kinds.has(t.kind) && typeof t.text === "string" && t.text.trim())
      .slice(0, 4)
      .map((t) => ({
        kind: t.kind,
        text: String(t.text).slice(0, 80),
        x: clampNum(t.x, 0, 1, 0.4),
        y: clampNum(t.y, 0, 1, 0.5),
        size: clampNum(t.size, 8, 400, t.kind === "block" ? 130 : t.kind === "label" ? 30 : 40),
      }));
    if (!titles.length) titles.push({ kind: "block", text: "UNTITLED", x: 0.4, y: 0.5, size: 130 });

    const colors = (Array.isArray(raw.colors) ? raw.colors : [])
      .filter(isHex).map((c) => normHex(c)).slice(0, 6);
    const shapes = (Array.isArray(raw.shapes) ? raw.shapes : [])
      .filter((s) => SHAPE_IDS.includes(s));

    res.json({
      titles,
      accent: normHex(raw.accent, "#e0573a"),
      bgColor: normHex(raw.bgColor, "#2b2b2b"),
      colors: colors.length ? colors : ["#6fa5a9", "#cf9f4a", "#e0573a", "#000000", "#ffffff"],
      density: Math.round(clampNum(raw.density, 1, 20, 11)),
      proximity: Math.round(clampNum(raw.proximity, 1, 20, 11)),
      seed: Math.round(clampNum(raw.seed, 0, 1e9, Math.floor(Date.now() % 1e9))),
      shapes: shapes.length ? shapes : SHAPE_IDS,
    });
  } catch (e) {
    metric("Errors", 1, "Count", { op: "generate" });
    console.error(e);
    res.status(500).send(String(e?.message ?? e));
  }
});

// AI script writer → a short voiceover script for the demo/brand video.
app.post("/script", async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || !String(prompt).trim()) return res.status(400).send("Missing 'prompt'.");
  const aiStart = Date.now();
  try {
    const script = (await generateText({
      system: SYSTEM_SCRIPT,
      user: `Brand / topic: ${String(prompt).trim()}`,
      maxTokens: 1200,
    })).trim();
    metric("AiScriptMs", Date.now() - aiStart, "Milliseconds");
    res.json({ script });
  } catch (e) {
    metric("Errors", 1, "Count", { op: "script" });
    console.error(e);
    res.status(500).send(String(e?.message ?? e));
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Render server on http://localhost:${PORT}`);
  console.log(`Object storage: ${STORAGE_ENABLED ? `S3 (${process.env.AWS_S3_BUCKET})` : "local /out (set AWS_S3_BUCKET to enable S3)"}`);
});
