// Final-cut voiceover — free Edge neural TTS (no key). Writes 3 mp3s.
//   node tools/make-finalcut-vo.mjs
// (ElevenLabs variant is make-finalcut-vo-eleven.mjs — needs a key with credits.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ffprobe from "ffprobe-static";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUTDIR = path.join(ROOT, "video", "final-cut", "vo");
fs.mkdirSync(OUTDIR, { recursive: true });

const VOICE = "en-GB-RyanNeural"; // warm British male

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
Hit render, and a render server runs Remotion and F F-M-peg to export a real video, in any aspect ratio.
And every scene you make is saved in A-W-S DynamoDB.
From a single sentence... to a finished film.
Aqua Studio — designed in your browser. No After Effects required.`,
};

for (const [name, text] of Object.entries(SCRIPTS)) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  let result = tts.toStream(text);
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
  if (!buf.length) { console.error(`no audio for ${name}`); process.exit(1); }
  const out = path.join(OUTDIR, `${name}.mp3`);
  fs.writeFileSync(out, buf);
  const dur = execFileSync(ffprobe.path, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).toString().trim();
  console.log(`${name}.mp3  ${(+dur).toFixed(1)}s`);
}
