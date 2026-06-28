// Rebuild a saved Aqua Studio scene with its background photo embedded as a
// data URL (so it round-trips on Load and renders), then render it to MP4.
import fs from "node:fs";

const IMG = "C:/Users/Asus/Desktop/d043cec16b60a48fea1cb9097903c1be.jpg";
const SRC_JSON = "D:/Downloads/pattern-scene.json";
const OUT_JSON = "D:/Downloads/pattern-scene-one-piece.json";

const b64 = fs.readFileSync(IMG).toString("base64");
const dataUrl = `data:image/jpeg;base64,${b64}`;
console.log(`image: ${(b64.length / 1024).toFixed(0)}KB base64`);

const scene = JSON.parse(fs.readFileSync(SRC_JSON, "utf8"));
scene.props.bgImage = dataUrl;
fs.writeFileSync(OUT_JSON, JSON.stringify(scene, null, 2));
console.log(`wrote ${OUT_JSON} (bgImage now embedded)`);

console.log("rendering via http://localhost:3001/render …");
const res = await fetch("http://localhost:3001/render", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    composition: "PatternTitle",
    props: scene.props,
    duration: scene.duration,
    ratio: "16:9",
  }),
});
if (!res.ok) {
  console.error("render failed:", res.status, await res.text());
  process.exit(1);
}
const json = await res.json();
console.log("render OK →", json.url);
