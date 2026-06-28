// Script to render Conformity assets to out/conformity/ in multiple web-optimized formats
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import ffmpegPath from "ffmpeg-static";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUT = path.join(ROOT, "out", "conformity");
const EXAMPLES = path.join(ROOT, "public", "examples");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(EXAMPLES, { recursive: true });

const shapes = [
  "arrowUp", "capsuleDiag", "capsuleH", "plug", "hBars", "barsII", "circle",
  "target", "squares4", "xCross", "dotGrid", "dots3", "dice5", "dice2", "nested", "stripes"
];

// Step 1: Render 4 custom loop videos for the workflow cards
const steps = [
  {
    key: "conformity-step1",
    props: {
      titles: [
        { id: "s1", kind: "block", text: "READ\nCONTRACT", x: 0.36, y: 0.46, size: 120 },
        { id: "s2", kind: "label", text: "spec_to_graph.py", x: 0.36, y: 0.61, size: 30 }
      ],
      bgColor: "#0b0e14",
      accent: "#5f7e96",
      colors: ["#3cd070", "#ff4a4a", "#2c3e50", "#5f7e96", "#ffffff"],
      density: 10,
      proximity: 3,
      seed: 1,
      stagger: 2,
      showGrid: true,
      scatter: true,
      shapes,
      intro: "none"
    }
  },
  {
    key: "conformity-step2",
    props: {
      titles: [
        { id: "s3", kind: "block", text: "QUERY\nORBIT", x: 0.36, y: 0.46, size: 120 },
        { id: "s4", kind: "label", text: "code_graph.py", x: 0.36, y: 0.61, size: 30 }
      ],
      bgColor: "#0b0e14",
      accent: "#5f7e96",
      colors: ["#3cd070", "#ff4a4a", "#2c3e50", "#5f7e96", "#ffffff"],
      density: 10,
      proximity: 3,
      seed: 2,
      stagger: 2,
      showGrid: true,
      scatter: true,
      shapes,
      intro: "none"
    }
  },
  {
    key: "conformity-step3",
    props: {
      titles: [
        { id: "s5", kind: "block", text: "DIFF\nGRAPHS", x: 0.36, y: 0.46, size: 120 },
        { id: "s6", kind: "label", text: "diff_graphs.py", x: 0.36, y: 0.61, size: 30 }
      ],
      bgColor: "#0b0e14",
      accent: "#ff4a4a",
      colors: ["#ff4a4a", "#111111", "#333333", "#ffffff"],
      density: 10,
      proximity: 3,
      seed: 3,
      stagger: 2,
      showGrid: true,
      scatter: true,
      shapes,
      intro: "none"
    }
  },
  {
    key: "conformity-step4",
    props: {
      titles: [
        { id: "s7", kind: "block", text: "GATE\nMERGE", x: 0.36, y: 0.46, size: 120 },
        { id: "s8", kind: "label", text: "render_block.py", x: 0.36, y: 0.61, size: 30 }
      ],
      bgColor: "#0b0e14",
      accent: "#3cd070",
      colors: ["#3cd070", "#111111", "#222222", "#ffffff"],
      density: 10,
      proximity: 3,
      seed: 4,
      stagger: 2,
      showGrid: true,
      scatter: true,
      shapes,
      intro: "none"
    }
  }
];

// Main Conformity assets
const assets = [
  {
    key: "conformity-hero",
    compId: "PatternTitle",
    duration: 180, // 6 seconds
    props: {
      titles: [
        { id: "c1", kind: "block", text: "CONFORMITY", x: 0.36, y: 0.46, size: 130 },
        { id: "c2", kind: "label", text: "SPEC-TO-CODE DRIFT GATE", x: 0.36, y: 0.61, size: 30 },
      ],
      bgColor: "#0b0e14",
      accent: "#ff4a4a",
      colors: ["#3cd070", "#ff4a4a", "#2c3e50", "#5f7e96", "#ffffff"],
      density: 12,
      proximity: 3,
      seed: 42,
      stagger: 3,
      showGrid: true,
      intro: "flood",
      floodStyle: "sweep",
      floodSpeed: 6,
      floodSolid: false,
      cameraMove: "pushIn",
      cameraAmount: 4,
      titleAnim: "wipe",
      underline: false,
      scatter: true,
      paint: 50,
      bgImage: "",
      music: "",
      sfx: false,
      audioReactive: false,
      shapes
    }
  },
  {
    key: "conformity-blocked",
    compId: "PatternTitle",
    duration: 180, // 6 seconds
    props: {
      titles: [
        { id: "c3", kind: "block", text: "MERGE\nBLOCKED.", x: 0.36, y: 0.46, size: 130 },
        { id: "c4", kind: "label", text: "2 CONTRACT VIOLATIONS DETECTED", x: 0.36, y: 0.61, size: 30 },
      ],
      bgColor: "#0b0e14",
      accent: "#ff4a4a",
      colors: ["#ff4a4a", "#111111", "#333333", "#ffffff"],
      density: 10,
      proximity: 2,
      seed: 99,
      stagger: 2,
      showGrid: true,
      intro: "flood",
      floodStyle: "radial",
      floodSpeed: 5,
      floodSolid: false,
      cameraMove: "pan",
      cameraDir: "down",
      cameraAmount: 3,
      titleAnim: "perLetter",
      underline: false,
      scatter: true,
      paint: 50,
      bgImage: "",
      music: "",
      sfx: false,
      audioReactive: false,
      shapes
    }
  },
  {
    key: "conformity-success",
    compId: "PatternTitle",
    duration: 180, // 6 seconds
    props: {
      titles: [
        { id: "c5", kind: "block", text: "CODE\nMATCHED.", x: 0.36, y: 0.46, size: 130 },
        { id: "c6", kind: "label", text: "CONTRACT VERIFIED • MERGE MAY PROCEED", x: 0.36, y: 0.61, size: 30 },
      ],
      bgColor: "#0b0e14",
      accent: "#3cd070",
      colors: ["#3cd070", "#111111", "#222222", "#ffffff"],
      density: 10,
      proximity: 2,
      seed: 88,
      stagger: 2,
      showGrid: true,
      intro: "flood",
      floodStyle: "sweep",
      floodSpeed: 5,
      floodSolid: false,
      cameraMove: "pushIn",
      cameraAmount: 3,
      titleAnim: "wipe",
      underline: false,
      scatter: true,
      paint: 50,
      bgImage: "",
      music: "",
      sfx: false,
      audioReactive: false,
      shapes
    }
  },
  {
    key: "conformity-workflow",
    compId: "FourCardsGrid",
    duration: 240, // 8 seconds
    props: {
      cards: [
        { videoUrl: "examples/conformity-step1.mp4", title: "01. READ CONTRACT (spec_to_graph.py)", alignX: 50, alignY: 50 },
        { videoUrl: "examples/conformity-step2.mp4", title: "02. QUERY ORBIT (code_graph.py)", alignX: 50, alignY: 50 },
        { videoUrl: "examples/conformity-step3.mp4", title: "03. DIFF GRAPHS (diff_graphs.py)", alignX: 50, alignY: 50 },
        { videoUrl: "examples/conformity-step4.mp4", title: "04. GATE MERGE (render_block.py)", alignX: 50, alignY: 50 }
      ],
      bgColor: "#0b0e14",
      cardBorderColor: "#ff4a4a",
      cardBgColor: "#0d1117",
      textColor: "#ffffff",
      grain: 0.1,
      stagger: 8,
      cardWidth: 360,
      cardHeight: 640,
      sfx: true
    }
  }
];

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ stdout, stderr });
    });
  });
}

async function deriveOutputs(srcPath, key) {
  console.log(`Deriving formats for ${key}...`);

  // 1. Mobile Vertical 9:16 Crop
  const mobilePath = path.join(OUT, `${key}-mobile.mp4`);
  console.log(` -> Creating mobile vertical 9:16 version...`);
  await runCommand(ffmpegPath, [
    "-y", "-i", srcPath,
    "-vf", "crop=608:1080:656:0",
    "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy",
    mobilePath
  ]);

  // 2. Highly Optimized WebM (Desktop 16:9)
  const webmPath = path.join(OUT, `${key}.webm`);
  console.log(` -> Creating optimized WebM...`);
  await runCommand(ffmpegPath, [
    "-y", "-i", srcPath,
    "-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-c:a", "libopus",
    webmPath
  ]);

  // 3. Compact GIF (Desktop 16:9, 15fps, 480w)
  const gifPath = path.join(OUT, `${key}.gif`);
  console.log(` -> Creating optimized animated GIF...`);
  await runCommand(ffmpegPath, [
    "-y", "-i", srcPath,
    "-vf", "fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
    "-loop", "0",
    gifPath
  ]);
  
  console.log(`✓ Formats ready for ${key}`);
}

console.log("Bundling Remotion project for step videos...");
let serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts") });

// Render steps first
for (const step of steps) {
  console.log(`\nRendering step video: ${step.key} ...`);
  const composition = await selectComposition({
    serveUrl,
    id: "PatternTitle",
    inputProps: step.props,
    port: 4025
  });
  composition.durationInFrames = 130;
  
  const outputLocation = path.join(EXAMPLES, `${step.key}.mp4`);
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 20,
    outputLocation,
    inputProps: step.props,
    port: 4026
  });
  console.log(`✓ Rendered step video to ${outputLocation}`);
}

console.log("\nRe-bundling Remotion project to include the new step videos in the public assets cache...");
serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts") });

// Render main assets (including conformity-workflow which uses the newly rendered steps)
for (const asset of assets) {
  console.log(`\n-----------------------------------------`);
  console.log(`Rendering base MP4 for ${asset.key} (${asset.compId}) ...`);
  const composition = await selectComposition({
    serveUrl,
    id: asset.compId,
    inputProps: asset.props,
    port: 4025
  });
  composition.durationInFrames = asset.duration;
  
  const outputLocation = path.join(OUT, `${asset.key}.mp4`);
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 18,
    outputLocation,
    inputProps: asset.props,
    port: 4026
  });
  console.log(`✓ Rendered ${asset.key}.mp4`);

  // Now create the other formats (mobile, webm, gif)
  try {
    await deriveOutputs(outputLocation, asset.key);
  } catch (err) {
    console.error(`Failed to derive formats for ${asset.key}:`, err.message);
  }
}

console.log("\nAll Conformity assets rendered in all formats successfully!");
