// Project-wide render defaults for Remotion Studio.
// Docs: https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

// Use a real alpha channel when a composition has a transparent background.
// PNG is the only image format that preserves transparency frame-to-frame.
Config.setVideoImageFormat("png");

// Higher quality H.264 by default (lower CRF = better quality, larger file).
Config.setCodec("h264");

// Overwrite existing files in out/ without prompting.
Config.setOverwriteOutput(true);
