// Generates voiceovers via free Microsoft Edge neural TTS (no key/quota).
//   node tools/make-voiceover.mjs promo   → public/music/voiceover.mp3
//   node tools/make-voiceover.mjs arch    → public/music/architecture-vo.mp3
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ffprobe from "ffprobe-static";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");

const SCRIPTS = {
  promo: {
    out: "voiceover.mp3",
    text: `Great brand titles used to take a designer, and a week. Now, they take a sentence.
This is Aqua Studio.
Describe your brand, and A.I. designs the whole title. The headline. The colours. The motion.
And every piece stays yours to control.
Pick a style. Let the shapes gather around your words... or flood the screen in colour.
Sync it to the beat. Then render, and your brand is in motion.
Aqua Studio. Open source, and made for everyone.`,
  },
  arch: {
    out: "architecture-vo.mp3",
    text: `Here's how Aqua Studio works under the hood.
You describe your brand, in one line.
The editor — a React app — sends it to a local render server.
The server calls Gemini, which designs a complete scene, and returns it as structured data.
That scene drops straight into a live Remotion preview, where you can edit anything.
When you're happy, one click sends it back — and the server renders your scene with Remotion, into a finished M P 4.
From a sentence, to a video. Editor, server, A.I., and Remotion.`,
  },
  tutorial: {
    out: "tutorial-vo.mp3",
    text: `Welcome to Aqua Studio. Let me walk you through how it works, step by step.
We start by adding our title cards. I can drop in a block title for the headline, a sub label underneath it, or a Japanese accent line. Each one I can drag anywhere on the canvas to place it, retype the text, and scale it up or down with the size slider. And every card gets its own colour box, so my titles and labels can stand apart from each other.
Next is Density. This controls how many shapes gather around your words, and how tightly they pack together. Slide it up for a busy, energetic field... or pull it down for something clean and minimal. Just below it, Proximity and Stagger fine-tune the spacing between the shapes, and the timing of how they appear. And any time I want a completely fresh layout, I can hit Generate to reshuffle the whole pattern in an instant.
Now for my favourite part — Flood. Flood fills the whole screen with a grid of colour behind your title, and there are several ways it can fill in. Random scatters the tiles across the screen. Sweep moves through on a diagonal. Radial opens out from the centre. And rows, columns, and edges fill in exactly the way they sound. I can speed the fill up or slow it down, change the tile size, and flood in a single solid colour or my full set. I can also choose whether the flood stays on screen... or clears away as the title settles into place.
Finally, sound. I can drop in a music bed, turn on sound-effect hits, and switch on Reactive — so the shapes and the dots pulse right along to the beat of the music.
And that's it. Pick your colours, hit render, and you've got a finished, animated title card — all from one simple editor.`,
  },
  problem: {
    out: "problem-vo.mp3",
    text: `Every brand needs motion. A title that moves. An intro that grabs attention. A logo that comes alive.
But great motion graphics are locked behind a wall.
To make a single animated title, you need a motion designer — and they are expensive. Hundreds of dollars, for a few seconds of video.
Or, you learn the tools yourself. After Effects. Keyframes. Easing curves. That is weeks of practice, and the skills don't transfer.
So most people settle. They grab a generic template that looks like everyone else's. They ship a plain, static title. Or, they skip motion entirely.
For a founder launching a product... a student presenting a project... a small creator building a brand... high-end motion is simply out of reach.
The tools are either too expensive, too hard, or too generic. There is no middle ground.
That is the problem. Professional motion graphics should be as easy as describing what you want. And that is exactly what we set out to build.`,
  },
};

const which = process.argv[2] || "promo";
const sel = SCRIPTS[which];
if (!sel) { console.error("Unknown script:", which, "— use 'promo' or 'arch'"); process.exit(1); }

const out = path.join(ROOT, "public", "music", sel.out);
const VOICE = "en-US-GuyNeural";

const tts = new MsEdgeTTS();
await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
let result = tts.toStream(sel.text);
if (result && typeof result.then === "function") result = await result;
const audioStream = result.audioStream ?? result;

const chunks = [];
await new Promise((resolve, reject) => {
  audioStream.on("data", (d) => chunks.push(d));
  audioStream.on("end", resolve);
  audioStream.on("close", resolve);
  audioStream.on("error", reject);
});

const buf = Buffer.concat(chunks);
if (!buf.length) { console.error("no audio produced"); process.exit(1); }
fs.writeFileSync(out, buf);
console.log("voice:", VOICE, "→ saved", out, buf.length, "bytes");
try {
  const dur = execFileSync(ffprobe.path, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).toString().trim();
  console.log("duration:", dur, "sec  →  frames@30:", Math.ceil(parseFloat(dur) * 30));
} catch { console.log("(duration probe skipped)"); }
