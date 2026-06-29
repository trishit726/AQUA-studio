# Aqua Studio — System Design

A design-doc view of the system: requirements, scale math, the data model and
why it's shaped this way, the caching and consistency model, the real
bottleneck, failure handling, cost, and the path from today's MVP to
million-user scale. Grounded in the actual code — every claim points at a file.

---

## 1. Requirements

**Functional**
- A user describes/edits a scene and **saves** it; it persists durably and
  reloads exactly.
- A user **lists** their scenes, most-recently-edited first.
- A user **renders** a scene to MP4/WebM/GIF and can see their render history.
- Uploaded assets (background images) persist with the scene.

**Non-functional (the ones that drive the design)**
- **Reads must be cheap and fast at any scale** — the list/load path is hit on
  every app open. Target: single-digit-ms, O(user's data), never O(table).
- **Ownership isolation** — a user can only ever touch their own data.
- **Render is heavy and bursty** — it can't share the request path.
- **Scale to ~1M users without re-architecting the data tier.**
- **Cost ≈ 0 at idle** (a creator tool has spiky, long-tail usage).

---

## 2. Back-of-the-envelope scale

| Quantity | Estimate | Implication |
|---|---|---|
| Registered users | 1,000,000 | partition-key cardinality = 1M → even sharding |
| Daily actives | ~100,000 | |
| Scene **list** reads | peak ~500 QPS | trivial for DynamoDB; cache absorbs most |
| Scene **save** writes | peak ~200 QPS | on-demand handles it; per-user partition never hot |
| Items | ~20M scenes × ~5 KB ≈ **100 GB** | well within a single table; props are small (images are in S3, not the item) |
| **Renders** | ~100k/day, peak ~10–50 concurrent | **the bottleneck** — 10–60 s of CPU each |

The key reading: **nothing about the database tier is hard at this scale.** The
hard part is the render fleet. The design optimizes accordingly — keep the data
tier boringly correct, and put the engineering into decoupling renders.

---

## 3. Data model (DynamoDB single table)

One table, one item collection per user. Full code: [`app/lib/db.ts`](../app/lib/db.ts).

```
PK = USER#<userId>
SK = SCENE#<sceneId>                  → a saved scene
     RENDER#<paddedEpochMs>#<id>      → a render-history event

GSI1 (sparse — scenes only)
  GSI1PK = USER#<userId>
  GSI1SK = updatedAt (Number)         → scenes by recency
```

**Access patterns (all O(user), zero Scans):**

| Pattern | Operation |
|---|---|
| getScene | `GetItem` PK+SK, **strongly consistent** (read-after-write) |
| listScenes | `Query` GSI1, `ScanIndexForward=false`, **paginated** |
| saveScene | `UpdateItem` with `if_not_exists(createdAt)` — partial-save safe |
| deleteScene | `DeleteItem` with `attribute_exists(PK)` — no read-before-write |
| recordRender | `PutItem` with a `ttl` attribute (90-day expiry) |
| listRenders | `Query` PK + `begins_with(SK,"RENDER#")`, **paginated** |

**Why this shape — the deliberate choices a reviewer should see:**
- **Single table / item collection per user:** a user's scenes *and* render
  history come back from one partition. Co-located, one round-trip, no
  scatter-gather.
- **Sparse GSI:** only scenes carry `GSI1PK/GSI1SK`; render events don't appear
  on (or add write cost to) the recency index.
- **Why a GSI and not an SK-encoded sort:** the sort key (`updatedAt`) is
  *mutable* — a scene jumps to the top on every edit. You can't reorder by
  mutating an immutable SK without delete+put, so recency lives on a GSI whose
  range key we *can* update in place.
- **Ownership by the key, not by code:** every API call addresses
  `USER#<caller>`; there is no code path that can read another user's partition.
- **Padded epoch in the render SK:** lexicographic SK order == chronological, so
  `listRenders` is a plain reverse Query with no extra index.
- **TTL on renders, none on scenes:** the time-series side auto-expires (bounded
  partition, zero cost for old events); the durable side lives forever.

**Conscious trade-off (stated, not hidden):** GSI1 currently projects `ALL`. At
extreme write volume that re-replicates the full item to the index; the next
optimization is `INCLUDE` (project only the list-view fields: name, updatedAt,
template, duration) and fetch full `props` on open. Deferred because changing a
GSI projection requires an index rebuild and the current write volume doesn't
justify it.

---

## 4. API surface

Stateless Next.js route handlers on Vercel (Node runtime); credentials never
reach the browser.

| Route | Method | Purpose |
|---|---|---|
| `/api/save` | POST | upsert a scene |
| `/api/load` | GET | fetch one scene (strongly consistent) |
| `/api/list` | GET | `?limit&cursor` → `{items, nextCursor}` |
| `/api/delete` | POST | delete a scene (ownership-checked) |
| `/api/upload` | POST | offload an image to S3, return its URL |
| `/api/log-render` | POST | append a render event |
| `/api/renders` | GET | `?limit&cursor` → `{items, nextCursor}` |
| `/render` (render server) | POST | render → S3, out of the request path |

---

## 5. Caching & consistency

Three layers, each with an explicit coherence story:

1. **CDN (Vercel Edge + CloudFront):** static app assets and finished render
   media. Immutable, long-TTL.
2. **App read cache** ([`app/lib/cache.ts`](../app/lib/cache.ts)): in-process
   read-through TTL cache on `listScenes`, **invalidated on every save/delete**
   for that user. Cross-instance staleness is bounded by the TTL — acceptable
   for a recency list. `getScene` is deliberately **never cached** and stays
   strongly consistent, so a load right after a save never reads stale.
3. **DAX (data tier):** the production read cache, **provisioned in Terraform,
   not yet wired into the client.** It's the documented next step, not a current
   claim — see [`terraform/cache.tf`](../terraform/cache.tf).

---

## 6. Rendering: serverless on AWS Lambda (live)

Rendering launches headless Chromium + ffmpeg, runs 10–60 s, and writes files —
it **cannot** run in a Vercel function (time/FS limits) and must not block a
request. So it runs on **AWS Lambda** via Remotion (`app/api/render-lambda/*`):

```
editor → /api/render-lambda → renderMediaOnLambda() → { renderId, bucketName }
       → poll /api/render-lambda/progress → getRenderProgress() → outputUrl
       → Lambda writes out.mp4 to S3 → browser plays it → /api/log-render → DynamoDB
```

- The trigger returns immediately; the editor polls progress and shows a `%`.
- **Lambda auto-scales render concurrency** — a burst of renders is more
  invocations, not a backed-up queue. Cost is cents per render.
- Measured live: trigger → `0.18 → 1.0` → public `out.mp4` (~1.2 MB) in ~36 s.

**Further scale path (provisioned in Terraform, flag-gated):** for very heavy
sustained load, an **SQS queue + DLQ** (`terraform/queue.tf`) decouples the
trigger from a worker pool with retry/dead-letter handling — switched on with
`enable_render_queue` when traffic warrants.

See `enable_render_queue` in [`terraform/queue.tf`](../terraform/queue.tf). This
is the honest frontier: the queue + DLQ are real IaC; the worker consumer is the
next implementation step.

---

## 7. Failure modes & resilience

| Failure | Handling |
|---|---|
| Concurrent saves to one scene | last-write-wins today; `UpdateItem` is atomic. Optimistic locking (a `version` attr + condition) is the upgrade for collaborative editing |
| Storage upload fails mid-render | render still returns; output falls back to a local URL — storage never fails a good render ([`render-server.mjs`](../server/render-server.mjs)) |
| Bad pagination cursor | decoded defensively → "start from beginning"; a client can't wedge itself |
| Render job crashes | SQS visibility timeout re-delivers; DLQ after 3 tries |
| Accidental data loss | DynamoDB point-in-time recovery (Terraform flag); `prevent_destroy` on the table |
| Credential leak | no static keys with the Vercel OIDC role; least-privilege IAM scoped to one table + the `renders/` prefix |

---

## 8. Security

- **Ownership by partition key** — structurally impossible to address another
  user's data.
- **Least-privilege IAM** — the app policy grants CRUD on exactly one table
  (+ its GSI) and read/write under `renders/` only ([`terraform/iam.tf`](../terraform/iam.tf)).
- **Vercel OIDC role** — no long-lived AWS keys stored in env vars (the path AWS
  itself recommends).
- **Private, encrypted S3** — objects are reached only via CloudFront (OAC) or
  short-lived presigned URLs; the bucket is never public.
- **Server-side secrets** — all AWS/AI credentials live in API routes, never the
  client bundle.

---

## 9. Cost model

- **DynamoDB on-demand** — pay per request, **scales to zero** at idle; no
  capacity to plan for a spiky creator tool.
- **TTL on renders + S3 lifecycle (7-day) expiry** — derived/time-series data
  cleans itself up; storage trends to near-zero.
- **CloudFront `PriceClass_100`** — cheapest edge footprint that still covers the
  primary regions.
- **Heavy infra is feature-flagged off** (`enable_dax`, `enable_render_queue`)
  until traffic justifies it — you don't pay for the scale tier on day one.

---

## 10. Scale path to millions (summary)

1. **Now → 100k users:** current design. DynamoDB on-demand + in-process cache +
   **serverless Lambda rendering** (already auto-scales). Nothing changes in the
   data tier.
2. **Sustained render burst:** flip on the SQS queue + DLQ in front of the render
   workers for backpressure/retries. The data tier is untouched.
3. **Read-hot at the data tier:** wire DAX → microsecond cached reads, no app
   call-shape change.
4. **Global / multi-region:** DynamoDB **Global Tables** for active-active
   multi-region; CloudFront already fronts media globally.

The thesis: **the data tier is designed to not move.** Per-user partitioning is
the natural shard key, so growth is absorbed by DynamoDB's own horizontal
scaling — the engineering effort goes into the render fleet, which is exactly
where the load actually is.
