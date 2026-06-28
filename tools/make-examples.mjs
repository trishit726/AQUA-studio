// Renders a set of varied PatternTitle example scenes + a gallery page.
// Run: node tools/make-examples.mjs   → outputs to public/examples/
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";

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
  { key: "coffee", prompt: "Ember — a warm, rustic specialty coffee roaster",
    props: T("EMBER\nCOFFEE", "ROASTED WITH PASSION", "#e0573a", "#241a14",
      ["#cf9f4a", "#e0573a", "#a87f5d", "#6fa5a9"], 8) },
  { key: "ai", prompt: "NeuralForge — an AI infrastructure startup",
    props: T("NEURAL\nFORGE", "INTELLIGENCE, SHIPPED", "#3fd6c2", "#0e1117",
      ["#3fd6c2", "#5b8def", "#9b6dff", "#ffffff"], 21,
      12, 12, ["circle", "target", "plug", "barsII", "dotGrid", "nested", "xCross", "dice2"]) },
  { key: "fitness", prompt: "Iron Pulse — a high-energy fitness brand",
    props: T("IRON\nPULSE", "TRAIN. RECOVER. REPEAT.", "#c6f24e", "#14181d",
      ["#c6f24e", "#e0573a", "#ffffff", "#888888"], 33, 13, 10) },
  { key: "luxury", prompt: "Maison Noir — a luxury couture atelier",
    props: T("MAISON\nNOIR", "ATELIER COUTURE", "#d8b25a", "#efe9dd",
      ["#d8b25a", "#1a1a1a", "#a87f5d", "#6fa5a9"], 12, 9, 12,
      ["capsuleH", "capsuleDiag", "circle", "dots3", "barsII", "nested"]) },
  { key: "festival", prompt: "Neon Nights — a summer music festival",
    props: T("NEON\nNIGHTS", "LIVE  •  THIS SUMMER", "#ff5db1", "#1a0f2e",
      ["#ff5db1", "#7b5bff", "#3fd6c2", "#ffd23f"], 45, 14, 11,
      ["xCross", "dice5", "target", "stripes", "dots3", "circle", "squares4", "arrowUp"]) },
  { key: "travel", prompt: "Wild North — an outdoor travel & adventure brand",
    props: T("WILD\nNORTH", "ADVENTURE AWAITS", "#f0a541", "#123b3a",
      ["#f0a541", "#6fa5a9", "#e6dcc3", "#e0573a"], 7, 11, 12) },
];

console.log("Bundling…");
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts") });
for (const ex of examples) {
  const composition = await selectComposition({ serveUrl, id: "PatternTitle", inputProps: ex.props, port: 4017 });
  await renderStill({ composition, serveUrl, output: path.join(OUT, `${ex.key}.png`), inputProps: ex.props, frame: 125, port: 4018 });
  console.log("✓", ex.key);
}

const cards = examples.map((ex) => `
    <figure class="card">
      <img src="${ex.key}.png" alt="${ex.key}" />
      <figcaption>
        <span class="prompt">“${ex.prompt}”</span>
        <span class="sw"><i style="background:${ex.props.bgColor}"></i>bg <i style="background:${ex.props.accent}"></i>title</span>
      </figcaption>
    </figure>`).join("");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Aqua Studio — Example Scenes</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0c0d10; color: #f3efe6; font-family: -apple-system, Segoe UI, Roboto, sans-serif; }
  header { padding: 48px 40px 8px; }
  h1 { margin: 0; font-size: 34px; letter-spacing: .04em; }
  p.sub { margin: 8px 0 0; color: #9aa0a6; font-size: 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 22px; padding: 28px 40px 56px; }
  .card { margin: 0; background: #15171c; border: 1px solid #23262e; border-radius: 12px; overflow: hidden; }
  .card img { display: block; width: 100%; aspect-ratio: 16/9; object-fit: cover; }
  figcaption { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; }
  .prompt { font-size: 14px; color: #cdd2da; }
  .sw { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #8b9098; white-space: nowrap; }
  .sw i { width: 14px; height: 14px; border-radius: 3px; display: inline-block; border: 1px solid #333; }
</style></head>
<body>
  <header>
    <h1>Aqua Studio — Example Scenes</h1>
    <p class="sub">Each designed from a one-line prompt: different brand, palette, title colour &amp; background.</p>
  </header>
  <div class="grid">${cards}
  </div>
</body></html>`;
fs.writeFileSync(path.join(OUT, "index.html"), html);
console.log("Gallery → public/examples/index.html");
