// Loads a Google font once, app-wide. Remotion blocks rendering until it's ready,
// so text never flashes in an unstyled fallback.
//
// Swap "Inter" for any family at https://www.remotion.dev/docs/google-fonts
// (e.g. import { loadFont } from "@remotion/google-fonts/Montserrat").
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const FONT_FAMILY = fontFamily;
