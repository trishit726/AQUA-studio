# Aqua Studio — H0 Hackathon Submission Kit

Everything you need to fill in the Devpost form for **H0: Hack the Zero Stack
with Vercel v0 and AWS Databases**. Fields marked **`<FILL>`** are yours to
complete before submitting.

> Submission deadline: **June 29, 2026 · 5:00 PM PT.**

---

## 1. Track

**Track 4 — Open Innovation.** Aqua Studio is a creative AI tool: it doesn't map
cleanly to e-commerce or B2B SaaS, but it creatively implements the full
Vercel + AWS Databases stack.

## 2. Database used (the judges read this line carefully)

**Amazon DynamoDB.**

> We chose DynamoDB because Aqua Studio's *entire* access pattern is "give me
> everything one user owns, newest first" — a single-partition, key-ordered read
> DynamoDB serves in single-digit milliseconds at any scale. We use a
> **single-table design**: each user's saved scenes *and* their render history
> live in one item collection (`USER#<id>`), retrieved in one Query — never a
> Scan. A **sparse GSI** lists scenes by most-recently-edited, while render
> events omit the index attributes so they cost nothing on it. Ownership is
> enforced by the partition key, not by application code.

(Full data model: [`app/lib/db.ts`](app/lib/db.ts) · IaC: [`terraform/main.tf`](terraform/main.tf))

## 3. What it does / who it's for / why it matters

- **What:** Describe a brand in one sentence → an AI designs a bold, editable,
  broadcast-style animated title card → export a real MP4/WebM/GIF in any aspect
  ratio. Everything the AI makes stays fully editable in a live editor.
- **Who:** Founders, students, and small creators who need on-brand motion
  graphics but can't afford a motion designer or learn After Effects.
- **Why it matters:** A single animated brand title normally costs hundreds of
  dollars or hours of skilled work. Aqua Studio collapses that to one sentence
  and one click — and persists every creator's work durably in DynamoDB so they
  can come back to anything they've made.

## 4. The stack (how front-end and back-end relate)

| Layer | Tech |
|-------|------|
| Frontend (Vercel) | Next.js 16, React 19, Tailwind 4, Remotion Player (live preview) |
| API (Vercel, Node runtime) | `/api/*` — AI generation, scene CRUD, render logging; all secrets server-side |
| Auth | Clerk → `userId` becomes the DynamoDB partition key |
| **Primary database** | **Amazon DynamoDB** (single-table, sparse GSI, on-demand) |
| Cache | DAX (prod) / in-process TTL cache (always-on) |
| Object storage + CDN | S3 (rendered media) behind CloudFront |
| Render | Remotion + ffmpeg on long-lived compute (can't run on Vercel) |
| Observability | CloudWatch EMF metrics, logs, dashboard, alarms |

Full diagram: [`docs/architecture.md`](docs/architecture.md) ·
screenshot-ready: [`docs/architecture-h0.html`](docs/architecture-h0.html).

## 5. Required Devpost fields

| Field | Value |
|-------|-------|
| Project name | **Aqua Studio** |
| Track | Open Innovation |
| AWS Database(s) | **Amazon DynamoDB** |
| Published Vercel URL | `<FILL: https://....vercel.app>` |
| Vercel Team ID | `<FILL: vercel.com → team → Settings → General → Team ID>` |
| Public GitHub repo | `<FILL>` |
| Demo video (YouTube, <3 min) | `<FILL>` |
| Architecture diagram | `docs/architecture-h0.html` → export PNG |
| DB-proof screenshot | `<FILL: see §7>` |

## 6. Demo video script (under 3 minutes — MUST mention DynamoDB)

> **(0:00–0:15) Hook.** "A broadcast-quality animated brand title usually costs a
> designer and a week. Watch me make one in fifteen seconds — and never lose it."
>
> **(0:15–0:35) Problem + who.** "Motion graphics are gatekept: too expensive for
> small creators, too hard for non-designers. Aqua Studio is for founders,
> students, and creators who need on-brand motion without After Effects."
>
> **(0:35–1:40) Demo.** Type a one-line brand → **Generate** (AI designs the
> scene) → drag a title, change a colour, move a slider (show it's editable) →
> **Render** → the MP4 plays. "That render just went to **S3** and is served back
> through **CloudFront**."
>
> **(1:40–2:25) The database story.** "Every scene I save and every render I make
> is persisted in **Amazon DynamoDB** — in a single-table design where everything
> one user owns lives in one partition and comes back in a single query, newest
> first, in milliseconds. No Scans, ownership enforced by the key. It's the same
> model whether I have ten scenes or ten million." (Show the saved-scenes list
> reloading; optionally flash the DynamoDB console / items.)
>
> **(2:25–2:50) Architecture + close.** Show the architecture diagram for ~4s.
> "Vercel on the front, DynamoDB at the core, S3 + CloudFront for media, DAX and
> CloudWatch for scale and visibility. That's Aqua Studio."

Recording tips: 1080p, OBS or Win+G. A clean TTS voiceover is fine (the rules
explicitly allow it) — keep it tight.

## 7. Proving DynamoDB usage (screenshot)

Any one of these satisfies the requirement — capture it before submitting:
- **AWS Console → DynamoDB → Tables → `pattern-studio-scenes`** showing the table
  (and ideally the **Items** tab with real `USER#…` / `SCENE#…` rows), or
- **Vercel → Project → Storage / Environment Variables** showing the DynamoDB
  connection configured.

## 8. Bonus points (up to +0.6)

Publish a short blog/video on **how you built Aqua Studio on DynamoDB + Vercel**
(dev.to, Medium, LinkedIn, builder.aws.com, or YouTube). Include the line *"I
created this content for the H0 Hackathon"* and the hashtag **#H0Hackathon**.
A good angle: "Single-table DynamoDB design for a creative tool — one query,
zero Scans." Draft material already exists in [`SUBMISSION-STORY.md`](SUBMISSION-STORY.md).

## 9. "Materially updated during the submission period" (rules §4)

If asked for evidence: the AWS data layer (single-table DynamoDB), S3 object
storage for renders, DAX/in-process caching, CloudWatch EMF observability, the
Vercel-OIDC IAM model, and the consolidated Terraform stack were all built/wired
during the submission window. See git history on this branch.
