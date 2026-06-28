// ────────────────────────────────────────────────────────────────────────────
// PatternGen engine — ported from halfof8/patterngen-oss (MIT) to be Remotion-
// native and deterministic. Pure math: seeded RNG scatters pattern tiles,
// colored squares, and dots around a title rectangle. No canvas, no images.
//
// generatePlacement() is deterministic for a given seed → identical every frame,
// which is exactly what Remotion needs. Animation is layered on per-frame.
// ────────────────────────────────────────────────────────────────────────────

export const CANVAS_W = 1920;
export const CANVAS_H = 1080;
export const GRID_SIZE = 20;
export const GRID_COLS = CANVAS_W / GRID_SIZE; // 96
export const GRID_ROWS = CANVAS_H / GRID_SIZE; // 54

// 16 shape ids, matching the halfof8 selector grid. (Reveal is clip-based for all.)
export type AnimType =
  | "arrowUp" | "capsuleDiag" | "capsuleH" | "plug" | "hBars" | "barsII"
  | "circle" | "target" | "squares4" | "xCross" | "dotGrid" | "dots3"
  | "dice5" | "dice2" | "nested" | "stripes";
export const ANIM_TYPES: AnimType[] = [
  "arrowUp", "capsuleDiag", "capsuleH", "plug", "hBars", "barsII",
  "circle", "target", "squares4", "xCross", "dotGrid", "dots3",
  "dice5", "dice2", "nested", "stripes",
];
export type ClipSide = "top" | "bottom" | "left" | "right";
export type ColorPair = { bg: string; fg: string };
export type TitleRect = { x: number; y: number; w: number; h: number };

export type PatternEl = { id: string; anim: AnimType; x: number; y: number; size: number; colors: ColorPair; animDelay: number; clipSide: ClipSide };
export type SquareEl = { id: string; x: number; y: number; size: number; color: string; clipSide: ClipSide; animDelay: number };
export type DotEl = { id: string; x: number; y: number; color: string; blinkPhase: number; blinkSpeed: number };
export type Placement = { patterns: PatternEl[]; squares: SquareEl[]; dots: DotEl[] };

// --- seeded RNG (mulberry32) ---
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- grid occupancy ---
class Grid {
  cells: boolean[][];
  constructor() {
    this.cells = Array.from({ length: GRID_ROWS }, () => new Array(GRID_COLS).fill(false));
  }
  markRect(x: number, y: number, w: number, h: number) {
    const c0 = Math.floor(x / GRID_SIZE), r0 = Math.floor(y / GRID_SIZE);
    const c1 = Math.ceil((x + w) / GRID_SIZE), r1 = Math.ceil((y + h) / GRID_SIZE);
    for (let r = r0; r < r1 && r < GRID_ROWS; r++)
      for (let c = c0; c < c1 && c < GRID_COLS; c++)
        if (r >= 0 && c >= 0) this.cells[r][c] = true;
  }
  isBlockFree(col: number, row: number, sc: number, sr: number): boolean {
    if (col < 0 || row < 0 || col + sc > GRID_COLS || row + sr > GRID_ROWS) return false;
    for (let r = row; r < row + sr; r++) for (let c = col; c < col + sc; c++) if (this.cells[r][c]) return false;
    return true;
  }
  isCellFree(col: number, row: number): boolean {
    if (col < 0 || row < 0 || col >= GRID_COLS || row >= GRID_ROWS) return false;
    return !this.cells[row][col];
  }
  markBlock(col: number, row: number, sc: number, sr: number) {
    for (let r = row; r < row + sr && r < GRID_ROWS; r++)
      for (let c = col; c < col + sc && c < GRID_COLS; c++)
        if (r >= 0 && c >= 0) this.cells[r][c] = true;
  }
  findFreeBlocks(sc: number, sr: number, align = 1): Array<[number, number]> {
    const out: Array<[number, number]> = [];
    const step = Math.max(1, align);
    for (let r = 0; r <= GRID_ROWS - sr; r += step)
      for (let c = 0; c <= GRID_COLS - sc; c += step)
        if (this.isBlockFree(c, r, sc, sr)) out.push([c, r]);
    return out;
  }
  findFreeCells(): Array<[number, number]> {
    const out: Array<[number, number]> = [];
    for (let r = 0; r < GRID_ROWS; r++) for (let c = 0; c < GRID_COLS; c++) if (!this.cells[r][c]) out.push([c, r]);
    return out;
  }
}

// --- colors ---
const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const rgbToHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const lum = (r: number, g: number, b: number) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function pairsForColor(primary: string): ColorPair[] {
  const [r, g, b] = hexToRgb(primary);
  const dark = rgbToHex(mix(r, 0, 0.45), mix(g, 0, 0.45), mix(b, 0, 0.45));
  const light = rgbToHex(mix(r, 255, 0.35), mix(g, 255, 0.35), mix(b, 255, 0.35));
  if (lum(r, g, b) > 0.5)
    return [{ bg: primary, fg: "#000000" }, { bg: dark, fg: primary }, { bg: primary, fg: dark }];
  return [{ bg: primary, fg: "#FFFFFF" }, { bg: light, fg: primary }, { bg: primary, fg: light }];
}
const palette = (colors: string[]): ColorPair[] => colors.flatMap(pairsForColor);
const squareColor = (colors: string[], rand: () => number) => {
  const p = palette(colors);
  return p.length ? p[Math.floor(rand() * p.length)].bg : "#4a4a48";
};
const dotColor = (colors: string[], rand: () => number) => {
  const p = palette(colors);
  if (!p.length) return "#555555";
  const pair = p[Math.floor(rand() * p.length)];
  return pair.fg === "#000000" ? pair.bg : pair.fg;
};

// --- placement (proximity BFS + greedy fill) ---
function proximityMap(titles: TitleRect[]): number[][] {
  const dist = Array.from({ length: GRID_ROWS }, () => new Array(GRID_COLS).fill(Infinity));
  const q: Array<[number, number]> = [];
  for (const t of titles) {
    const c0 = Math.floor(t.x / GRID_SIZE), r0 = Math.floor(t.y / GRID_SIZE);
    const c1 = Math.ceil((t.x + t.w) / GRID_SIZE), r1 = Math.ceil((t.y + t.h) / GRID_SIZE);
    for (let r = Math.max(0, r0); r < Math.min(GRID_ROWS, r1); r++)
      for (let c = Math.max(0, c0); c < Math.min(GRID_COLS, c1); c++) {
        dist[r][c] = 0;
        q.push([c, r]);
      }
  }
  let head = 0;
  while (head < q.length) {
    const [cx, cy] = q[head++];
    const d = dist[cy][cx];
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GRID_COLS || ny >= GRID_ROWS) continue;
      if (dist[ny][nx] <= d + 1) continue;
      dist[ny][nx] = d + 1;
      q.push([nx, ny]);
    }
  }
  return dist;
}

function candidates(grid: Grid, sc: number, sr: number, dm: number[][], maxD: number, align = 1) {
  return grid.findFreeBlocks(sc, sr, align).filter(([c, r]) => {
    for (let dr = 0; dr < sr; dr++) for (let dc = 0; dc < sc; dc++) if ((dm[r + dr]?.[c + dc] ?? Infinity) > maxD) return false;
    return true;
  });
}
function placeBlocks(grid: Grid, cands: Array<[number, number]>, sc: number, sr: number, target: number, rand: () => number) {
  const out: Array<[number, number]> = [];
  for (const [c, r] of shuffle(cands, rand)) {
    if (out.length >= target) break;
    if (!grid.isBlockFree(c, r, sc, sr)) continue;
    grid.markBlock(c, r, sc, sr);
    out.push([c, r]);
  }
  return out;
}
function placeCells(grid: Grid, cands: Array<[number, number]>, target: number, rand: () => number) {
  const out: Array<[number, number]> = [];
  for (const [c, r] of shuffle(cands, rand)) {
    if (out.length >= target) break;
    if (!grid.isCellFree(c, r)) continue;
    grid.markBlock(c, r, 1, 1);
    out.push([c, r]);
  }
  return out;
}

let pid = 0;
const nid = () => `pg_${++pid}`;
const SIDES: ClipSide[] = ["top", "bottom", "left", "right"];

export function generatePlacement(
  titles: TitleRect[],
  colors: string[],
  density: number,
  proximity: number,
  seed: number,
  enabledAnims: AnimType[] = ANIM_TYPES,
): Placement {
  pid = 0;
  const rand = mulberry32(seed);
  const grid = new Grid();
  if (!titles.length) return { patterns: [], squares: [], dots: [] };
  for (const t of titles) grid.markRect(t.x, t.y, t.w, t.h);

  const dm = proximityMap(titles);
  const df = density / 10;
  const maxR = 2 + Math.floor(proximity * 2.5);
  const dotR = maxR + 3;
  const d2 = df * df;

  const patterns: PatternEl[] = [];
  const squares: SquareEl[] = [];
  const dots: DotEl[] = [];
  const pickSide = () => SIDES[Math.floor(rand() * 4)];

  const targetPat = Math.max(2, Math.round(3 + 40 * d2));
  if (enabledAnims.length > 0) {
    const slots = placeBlocks(grid, candidates(grid, 2, 2, dm, maxR, 2), 2, 2, targetPat, rand);
    const anims = shuffle(enabledAnims, rand);
    const pal = palette(colors);
    slots.forEach(([c, r], idx) => {
      patterns.push({
        id: nid(), anim: anims[idx % anims.length],
        x: c * GRID_SIZE, y: r * GRID_SIZE, size: 40,
        colors: pal.length ? pal[Math.floor(rand() * pal.length)] : { bg: "#4a4a48", fg: "#fff" },
        animDelay: rand(), clipSide: pickSide(),
      });
    });
  }

  const sq = (sc: number, sr: number, size: number, target: number, align: number, cells = false) => {
    if (target <= 0) return;
    const cands = cells
      ? grid.findFreeCells().filter(([c, r]) => dm[r][c] <= maxR)
      : candidates(grid, sc, sr, dm, maxR, align);
    const placed = cells ? placeCells(grid, cands, target, rand) : placeBlocks(grid, cands, sc, sr, target, rand);
    for (const [c, r] of placed)
      squares.push({ id: nid(), x: c * GRID_SIZE, y: r * GRID_SIZE, size, color: squareColor(colors, rand), clipSide: pickSide(), animDelay: rand() });
  };
  sq(4, 4, 80, Math.round(d2), 4);
  sq(2, 2, 40, Math.max(0, Math.round(1 + 2 * d2)), 2);
  sq(1, 1, 20, Math.max(0, Math.round(1 + 3 * d2)), 1, true);

  const targetDots = Math.max(2, Math.round(5 + 50 * d2));
  for (const [c, r] of placeCells(grid, grid.findFreeCells().filter(([c, r]) => dm[r][c] <= dotR), targetDots, rand))
    dots.push({ id: nid(), x: c * GRID_SIZE + 6, y: r * GRID_SIZE + 6, color: dotColor(colors, rand), blinkPhase: rand(), blinkSpeed: 0.15 + rand() * 0.25 });

  return { patterns, squares, dots };
}
