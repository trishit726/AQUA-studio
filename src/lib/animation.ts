// Small reusable timing helpers so every graphic gets a clean enter AND exit.
import { interpolate, Easing } from "remotion";

// A smooth, slightly overshoot-free ease used for entrances.
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * Returns a 0→1→0 envelope: ramps up over `enter` frames at the start,
 * stays at 1, then ramps back down over `exit` frames before the clip ends.
 *
 * Multiply opacity / translate / scale by this so nothing ever pops or
 * cuts mid-animation.
 */
export const enterExit = ({
  frame,
  durationInFrames,
  enter = 18,
  exit = 18,
}: {
  frame: number;
  durationInFrames: number;
  enter?: number;
  exit?: number;
}) => {
  const enterProgress = interpolate(frame, [0, enter], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  const exitProgress = interpolate(
    frame,
    [durationInFrames - exit, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_IN_OUT,
    },
  );

  return Math.min(enterProgress, exitProgress);
};
