# Devpost Media — ready-to-paste embeds

All assets live in [`assets/`](assets) and are served over the **jsDelivr CDN**
straight from this GitHub repo. jsDelivr returns the file directly (correct
`image/gif` / `image/png` content-type), which is exactly what Devpost needs.

> **Base URL:** `https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/`
>
> ⚠️ **These URLs go live ~1–2 min after you `git push` the `assets/` folder to
> GitHub.** (jsDelivr fetches from `@main`.) After pushing, open any URL below in
> a browser to confirm it loads the file directly.

---

## 1. Hero logo — place at the **very top** of the story

`https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/aqua-studio-logo.png`

```html
<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/aqua-studio-logo.png" width="440" alt="Aqua Studio">
</p>
```

Widths → `width="600"` · `width="800"` · `width="1000"` (swap the number in the tag above).
Markdown → `![Aqua Studio](https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/aqua-studio-logo.png)`

---

## 2. Hero demo — place **right under the tagline** (big)

`https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-one-piece-reveal.gif`

```html
<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-one-piece-reveal.gif" width="1000" alt="A title designed in Aqua Studio">
</p>
```
```html
<img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-one-piece-reveal.gif" width="600" alt="A title designed in Aqua Studio">
<img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-one-piece-reveal.gif" width="800" alt="A title designed in Aqua Studio">
```
Markdown → `![A title designed in Aqua Studio](https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-one-piece-reveal.gif)`

---

## 2b. Product demo — the **real editor** (recommended for "What it does")

`https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-app.gif`

```html
<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-app.gif" width="1000" alt="Aqua Studio editor — live demo">
</p>
```
Widths → `600` · `800` · `1000`.
Markdown → `![Aqua Studio editor — live demo](https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-app.gif)`

---

## 3. Live editor / "What it does" — the procedural motion

`https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-flood-intro.gif`

```html
<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-flood-intro.gif" width="900" alt="Procedural pattern engine in motion">
</p>
```
Widths → `600` · `800` · `1000`.
Markdown → `![Procedural pattern engine in motion](https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-flood-intro.gif)`

---

## 4 & 5. Examples (variety) — place **side by side** in "What it does"

`.../assets/demo-kung-fu-panda.gif` and `.../assets/demo-katana.gif`

```html
<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-kung-fu-panda.gif" width="420" alt="Animated title-card example">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-katana.gif" width="420" alt="Animated title-card example">
</p>
```

Single, larger:
```html
<img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-kung-fu-panda.gif" width="800" alt="Animated title-card example">
<img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-katana.gif" width="800" alt="Animated title-card example">
```
Markdown →
`![Animated title-card example](https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-kung-fu-panda.gif)`
`![Animated title-card example](https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-katana.gif)`

---

## 6. Range / Export — another style

`https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-backrooms.gif`

```html
<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-backrooms.gif" width="800" alt="Animated title-card example">
</p>
```
Widths → `600` · `800` · `1000`.
Markdown → `![Animated title-card example](https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-backrooms.gif)`

---

## 7. Optional extra example

`https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-one-piece.gif`

```html
<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-one-piece.gif" width="800" alt="Animated title-card example">
</p>
```
Widths → `600` · `800` · `1000`.
Markdown → `![Animated title-card example](https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/demo-one-piece.gif)`

---

## 8. Why DynamoDB — the single-table diagram

`https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/diagram-dynamodb.png`

```html
<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/diagram-dynamodb.png" width="820" alt="DynamoDB single-table design">
</p>
```
Widths → `600` · `800` · `1000`.
Markdown → `![DynamoDB single-table design](https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/diagram-dynamodb.png)`

---

## 9. Architecture — the system diagram

`https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/architecture-diagram.png`

```html
<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/architecture-diagram.png" width="900" alt="Aqua Studio system architecture">
</p>
```
Widths → `600` · `800` · `1000`.
Markdown → `![Aqua Studio system architecture](https://cdn.jsdelivr.net/gh/trishit726/AQUA-studio@main/assets/architecture-diagram.png)`

---

## Where each goes in the Project Story

| Story section | Asset |
|---|---|
| **Hero (top)** | `aqua-studio-logo.png`, then `demo-one-piece-reveal.gif` (big) |
| **What it does / the real app** | `demo-app.gif` (actual editor screen-recording) |
| **What it does / Live editor** | `demo-flood-intro.gif` |
| **What it does / Examples** | `demo-kung-fu-panda.gif` + `demo-katana.gif` side by side |
| **Range / Export** | `demo-backrooms.gif` (and `demo-one-piece.gif` optional) |
| **Why DynamoDB** | `diagram-dynamodb.png` (+ your AWS console "Explore items" screenshot) |
| **Architecture** | `architecture-diagram.png` |

> **Tip:** if you ever update an asset, jsDelivr caches `@main` for a while.
> Force a fresh copy with a commit-pinned URL, e.g. `@<commit-sha>` instead of `@main`.
