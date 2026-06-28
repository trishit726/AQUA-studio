/**
 * Tiny in-process read-through cache.
 *
 * Used for the hot, eventually-consistent read path (listScenes). It collapses
 * repeated reads within a warm serverless instance to a single DynamoDB Query,
 * cutting read-capacity cost and tail latency. Writes invalidate the affected
 * user's entry immediately, so a save is reflected on the next list within the
 * same instance; across instances the staleness window is bounded by the TTL —
 * acceptable for a recency list (getScene, by contrast, is never cached and
 * stays strongly consistent).
 *
 * In production this same role is filled at the data-tier by DAX (provisioned
 * in terraform/cache.tf); this module is the always-on, zero-infra layer.
 */

interface Entry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, Entry<unknown>>()

/** Default time-to-live for cached reads. */
export const DEFAULT_TTL_MS = 20_000

let hits = 0
let misses = 0

/** Lightweight counters for observability (surfaced as a metric by callers). */
export const cacheStats = () => ({ hits, misses, size: store.size })

/**
 * Read-through: return the cached value if fresh, otherwise run `loader`, cache
 * its result, and return it. Concurrent callers each run the loader (no
 * request coalescing) — acceptable for short TTLs and idempotent reads.
 */
export async function withCache<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const now = Date.now()
  const entry = store.get(key) as Entry<T> | undefined
  if (entry && entry.expiresAt > now) {
    hits++
    return entry.value
  }
  misses++
  const value = await loader()
  store.set(key, { value, expiresAt: now + ttlMs })
  return value
}

/** Drop a single cache key (e.g. after a write to that user's collection). */
export function invalidate(key: string): void {
  store.delete(key)
}
