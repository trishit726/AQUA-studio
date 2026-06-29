<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/aqua-studio-logo.png" width="420" alt="Aqua Studio">
</p>

<p align="center"><b>A procedural motion studio in your browser. Design a broadcast‑quality animated title — render a real MP4 — no After Effects, no designer, no sign‑in.</b></p>

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-app.gif" width="1000" alt="Aqua Studio editor — live demo">
</p>

---

### The honest version

Most "new projects" today are the same: an AI wrapper with a Generate button. I didn't want to make another one of those. I wanted to build a tool I'd genuinely use — and put real engineering behind it, not a prompt and a vibe.

So I picked a problem I actually have.

### The problem

Great animated titles — the bold, editorial kind — are **gatekept**. They mean a day in After Effects or hundreds of dollars for a designer. Creators, founders, students: priced and skilled out. Most ideas never become motion.

### What I made

**Aqua Studio** turns a grid into a finished animated title. A deterministic, seeded engine places heavy condensed type and scatters geometric shapes around it; the live preview matches the exported MP4 frame‑for‑frame. Drag, tune, recolor, add music — then render a real H.264 MP4 in one click.

It's a *system*, not a template pack. Same engine, completely different results:

<table align="center">
  <tr>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-one-piece-reveal.gif" width="440" alt="Animated title-card example"></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-flood-intro.gif" width="440" alt="Animated title-card example"></td>
  </tr>
  <tr>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-katana.gif" width="440" alt="Animated title-card example"></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-backrooms.gif" width="440" alt="Animated title-card example"></td>
  </tr>
</table>
<p align="center"><i>One engine. No templates. No prompts.</i></p>

### Why DynamoDB (the decision that defines it)

> **Every read in this app is the same question — *"give me everything one user owns, newest first."* That's a single‑partition, single‑digit‑millisecond query with no Scans, ever. And because ownership is enforced by the partition key itself, the app needs no sign‑in — your browser is your key.**

**Single‑table design:** one item collection per user holds both their **scenes** and their **render history**, separated by the sort key. A sparse GSI sorts scenes by recency; render events are TTL'd. Paginated cursor reads — never a Scan.

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/diagram-dynamodb.png" width="800" alt="DynamoDB single-table design">
</p>

### The stack

Front end on **Vercel** (Next.js 16 · React 19 · Remotion preview). Back end on **AWS**: **DynamoDB** as the primary store, **Lambda** for serverless MP4 rendering (Chromium + ffmpeg can't run in a Vercel function), **S3** for the files, **CloudWatch** for metrics, **Terraform** for all of it.

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/architecture-diagram.png" width="880" alt="Aqua Studio system architecture">
</p>

### What made it real

- **Rendering moved to Lambda** — so it works on the live site with no server running.
- **A data model that doesn't move** — per‑user partitioning shards naturally; reads are always *O(one user)*.
- **No login** — ownership is the partition key, so I deleted sign‑in entirely without losing isolation.

Not another AI SaaS. A real tool, on a real database, that I actually wanted.

---

**Built with** — Next.js · React · TypeScript · Remotion · Tailwind CSS · **Amazon DynamoDB** · **AWS Lambda** · **Amazon S3** · **Amazon CloudWatch** · Terraform · Vercel · FFmpeg
