// Renders the example scenes to animated MP4s → public/examples/<key>.mp4
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUT = path.join(ROOT, "public", "examples");
fs.mkdirSync(OUT, { recursive: true });

const base = { bgImage: "", stagger: 3, paint: 50, showGrid: false };
const T = (block, label, accent, bgColor, colors, seed, density = 11, proximity = 11, shapes) => ({
  ...base,
  titles: [
    { id: "a", kind: "block", text: block, x: 0.37, y: 0.47, size: 130 },
    { id: "b", kind: "label", text: label, x: 0.37, y: 0.62, size: 30 },
  ],
  accent, bgColor, colors, seed, density, proximity,
  shapes: shapes ?? ["circle", "target", "xCross", "dots3", "squares4", "stripes", "dice5", "capsuleH"],
});

const examples = [
  { key: "coffee", props: T("EMBER\nCOFFEE", "ROASTED WITH PASSION", "#e0573a", "#241a14", ["#cf9f4a", "#e0573a", "#a87f5d", "#6fa5a9"], 8) },
  { key: "ai", props: T("NEURAL\nFORGE", "INTELLIGENCE, SHIPPED", "#3fd6c2", "#0e1117", ["#3fd6c2", "#5b8def", "#9b6dff", "#ffffff"], 21, 12, 12, ["circle", "target", "plug", "barsII", "dotGrid", "nested", "xCross", "dice2"]) },
  { key: "fitness", props: T("IRON\nPULSE", "TRAIN. RECOVER. REPEAT.", "#c6f24e", "#14181d", ["#c6f24e", "#e0573a", "#ffffff", "#888888"], 33, 13, 10) },
  { key: "luxury", props: T("MAISON\nNOIR", "ATELIER COUTURE", "#d8b25a", "#efe9dd", ["#d8b25a", "#1a1a1a", "#a87f5d", "#6fa5a9"], 12, 9, 12, ["capsuleH", "capsuleDiag", "circle", "dots3", "barsII", "nested"]) },
  { key: "festival", props: T("NEON\nNIGHTS", "LIVE  •  THIS SUMMER", "#ff5db1", "#1a0f2e", ["#ff5db1", "#7b5bff", "#3fd6c2", "#ffd23f"], 45, 14, 11, ["xCross", "dice5", "target", "stripes", "dots3", "circle", "squares4", "arrowUp"]) },
  { key: "travel", props: T("WILD\nNORTH", "ADVENTURE AWAITS", "#f0a541", "#123b3a", ["#f0a541", "#6fa5a9", "#e6dcc3", "#e0573a"], 7, 11, 12) },
];

console.log("Bundling…");
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts") });
for (const ex of examples) {
  const composition = await selectComposition({ serveUrl, id: "PatternTitle", inputProps: ex.props, port: 4019 });
  composition.durationInFrames = 130;
  await renderMedia({ composition, serveUrl, codec: "h264", crf: 20, outputLocation: path.join(OUT, `${ex.key}.mp4`), inputProps: ex.props, port: 4020 });
  console.log("✓", ex.key);
}
console.log("done");
