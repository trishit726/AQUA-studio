// Final-cut voiceover via ElevenLabs. Key is read from .env (gitignored).
//   node tools/make-finalcut-vo-eleven.mjs
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ffprobe from "ffprobe-static";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUTDIR = path.join(ROOT, "video", "final-cut", "vo");
fs.mkdirSync(OUTDIR, { recursive: true });

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("ELEVENLABS_API_KEY missing from .env"); process.exit(1); }

const VOICE = "JBFqnCBsd6RMkjVDRZzb"; // George — warm British storyteller
const MODEL = "eleven_multilingual_v2";

const SCRIPTS = {
  problem: `Every creator wants their videos to look rich — like a real brand.
And the thing that does that is the title: the bold, animated opener that makes people stop scrolling.
But making one means months in After Effects, money for a designer, or templates everyone's already seen.
So most creators settle for plain text. So I built Aqua Studio.`,

  demo: `Here's how it works.
Start with a blank title, and just type.
Aqua Studio lays out a bold, editorial title card — heavy type, a brand palette, and geometric shapes scattered around your words.
And everything stays editable. Drag it, resize it, recolour any part.
Then pick a motion style, and watch the flood fill the frame — any colour, any speed, any density.
When it looks right, export a real video — sixteen by nine, or vertical for Shorts — in a single click.
No timeline. No keyframes. No After Effects.`,

  architecture: `So how does it all fit together?
You describe your brand in the editor, built with Next dot J S.
It goes to the pattern engine — deterministic TypeScript that lays out the scene.
You preview it live with Remotion, and edit anything you like.
Hit render, and a render server runs Remotion and F F M peg to export a real video, in any aspect ratio.
And every scene you make is saved in A W S DynamoDB.
From a single sentence... to a finished film.
Aqua Studio — designed in your browser. No After Effects required.`,
};

for (const [name, text] of Object.entries(SCRIPTS)) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.1, use_speaker_boost: true },
      }),
    },
  );
  if (!res.ok) { console.error(`${name}: HTTP ${res.status} — ${await res.text()}`); process.exit(1); }
  const buf = Buffer.from(await res.arrayBuffer());
  const out = path.join(OUTDIR, `${name}.mp3`);
  fs.writeFileSync(out, buf);
  const dur = execFileSync(ffprobe.path, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).toString().trim();
  console.log(`${name}.mp3  ${(+dur).toFixed(1)}s  (${text.length} chars)`);
}
console.log("done");
