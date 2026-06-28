// Audio teardown helper.  Usage:
//   node tools/audio-analyze.mjs <path-to-audio-or-video> [out-dir]
//
// Produces, in <out-dir> (default: ./analysis/<basename>/):
//   - spectrogram.png   frequency x time  (I read this to characterize SFX)
//   - waveform.png       amplitude over time (where the hits land, how punchy)
//   - onsets.txt         approximate SFX/hit start times (silencedetect inverse)
//   - loudness.json      EBU R128 integrated loudness + threshold (mix character)
//   - duration.txt       length in seconds
//
// Uses the bundled ffmpeg-static binary — no system ffmpeg required.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import ffmpegPath from "ffmpeg-static";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node tools/audio-analyze.mjs <file> [out-dir]");
  process.exit(1);
}

const name = basename(input, extname(input));
const outDir = process.argv[3] ?? join("analysis", name);
mkdirSync(outDir, { recursive: true });

const run = (args) =>
  execFileSync(ffmpegPath, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
// ffmpeg writes diagnostics to stderr; capture both.
const runCapture = (args) => {
  try {
    return execFileSync(ffmpegPath, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    return (e.stdout ?? "") + (e.stderr ?? "");
  }
};

console.log(`Analyzing ${input} -> ${outDir}`);

// 1. Spectrogram (log-frequency, with legend)
run(["-y", "-i", input, "-lavfi", "showspectrumpic=s=1280x480:legend=1:scale=log", join(outDir, "spectrogram.png")]);

// 2. Waveform
run(["-y", "-i", input, "-filter_complex", "showwavespic=s=1280x240:colors=#ea431d", join(outDir, "waveform.png")]);

// 3. Loudness (EBU R128) — parse the JSON block ffmpeg prints
const loud = runCapture(["-i", input, "-map", "0:a", "-af", "loudnorm=print_format=json", "-f", "null", "-"]);
const jsonMatch = loud.match(/\{[\s\S]*?\}/);
writeFileSync(join(outDir, "loudness.json"), jsonMatch ? jsonMatch[0] : loud);

// 4. Onsets — non-silent segment starts approximate where SFX/hits fire
const sil = runCapture(["-i", input, "-map", "0:a", "-af", "silencedetect=noise=-35dB:d=0.08", "-f", "null", "-"]);
const onsets = [...sil.matchAll(/silence_end:\s*([0-9.]+)/g)].map((m) => Number(m[1]));
writeFileSync(join(outDir, "onsets.txt"), onsets.map((t) => t.toFixed(3)).join("\n"));

// 5. Duration
const dur = runCapture(["-i", input, "-f", "null", "-"]);
const durMatch = dur.match(/Duration:\s*([0-9:.]+)/);
writeFileSync(join(outDir, "duration.txt"), durMatch ? durMatch[1] : "unknown");

console.log("Done. Files:");
console.log("  spectrogram.png, waveform.png, loudness.json, onsets.txt, duration.txt");
console.log(`Detected ~${onsets.length} hit/onset points.`);
