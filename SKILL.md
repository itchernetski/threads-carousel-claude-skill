---
name: threads-carousel
user_invocable: true
description: >
  Convert text posts into visual carousel images or presentations for Threads, Instagram, LinkedIn, TikTok, YouTube.
  10 slide types, 6 format presets (incl. 1920×1080 wide), 7 background styles, 3-axis style system (font × color × purpose), highlighted keywords.
  Generates PNG or single-file PDF via Next.js preview + browser export. RU/EN toolbar.
  Triggers: threads carousel, instagram carousel, linkedin carousel, tiktok carousel, карусель, slides, carousel images, presentation deck, presentation pdf.
---

# Threads Carousel Generator

Converts a text post into a set of visual carousel slides for Threads, Instagram, LinkedIn, TikTok, Stories, YouTube, or a standalone presentation deck. Composable design system with three independent style axes (font × color × purpose) and 10 slide types.

## Invocation

```
/threads-carousel <post text>
/threads-carousel path/to/post.md
```

## Format presets (choose target platform)

| Preset | Size | Platforms |
|---|---|---|
| `threads-4x5` *(default)* | 1080×1350 | Threads, Instagram feed (portrait) |
| `instagram-square` | 1080×1080 | Instagram, Facebook, LinkedIn feed |
| `linkedin-square` | 1080×1080 | LinkedIn document post (PDF) |
| `tiktok-9x16` | 1080×1920 | TikTok Photo Mode, Reels, Shorts |
| `story-9x16` | 1080×1920 | Instagram Stories, Threads Stories |
| `wide-16x9` | 1920×1080 | Presentations, YouTube, desktop decks |

## Slide types (10)

| Type | Purpose | Required fields |
|---|---|---|
| `hook` | Opening slide — the catchiest line | `text` |
| `body` | Title + paragraph | `title`, `text` |
| `body` (points) | Pros/cons list with ✓/✗ SVG icons | `title`, `points[]` (instead of `text`) |
| `list` | Numbered items (ordered list) | `title`, `items[]` |
| `stats` | Big numbers with labels | `title`, `stats[]` |
| `quote` | Large pulled quote | `text`, `author` |
| `checklist` | Checkmark bullets | `title`, `items[]` |
| `process` | Numbered steps with connector line | `title`, `steps[]` |
| `comparison` | Two-column VS / before-after | `leftLabel`, `leftItems[]`, `rightLabel`, `rightItems[]` |
| `cta` | Final call to action | `text`, `handle` |

`points` shape: `Array<{ type: "plus" | "minus"; text: string }>` — green ✓ for plus, muted ✗ for minus. Adaptive sizing (44–62px) based on item count and longest line.

All types also support optional:
- `badge` — small outlined tag above title (e.g. `"01"`, `"TIP"`)
- `highlight` — a word or phrase within `text`/`title` that will be colored in the preset's highlight color (yellow for dark themes)

## Background decorations (7 types)

Switchable via toolbar in preview. Default: `glow`.

| Type | What it is |
|---|---|
| `none` | Solid background |
| `blobs` | Organic colored shapes |
| `grid` | Dotted grid pattern |
| `lines` | Diagonal line pattern |
| `noise` | SVG grain overlay (overlay blend) |
| `bignumber` | Giant slide index as watermark (01, 02…) |
| `glow` *(default)* | Soft radial gradient in alternating corners |

## Style system (3 independent axes)

The final style is composed at runtime from three axes via `composePreset(font, color, purpose)`:

**Font axis** (`DEFAULT_FONT`):

| Id | Body font | Hook font |
|---|---|---|
| `minimal` *(default)* | Space Grotesk + Inter fallback | Unbounded |
| `editorial` | Playfair Display | Playfair Display |
| `clean` | Inter | (falls back to body) |

**Color axis** (`DEFAULT_COLOR`), 8 palettes:

| Id | Feel |
|---|---|
| `dark` *(default)* | `#0A0A0A` bg, white text, yellow highlight |
| `light` | `#FAFAFA` bg, dark text, red highlight |
| `paper` | cream bg, warm text, literary |
| `white` | pure white bg, near-black text, rose highlight |
| `gradient` | purple→pink→amber gradient, white text |
| `pastel` | lilac bg, purple accents |
| `neon` | near-black bg, cyan + violet accents |
| `custom` | editable hex colors |

**Purpose axis** (`DEFAULT_PURPOSE`):

| Id | Title | Body | Divider |
|---|---|---|---|
| `carousel` *(default)* | 44px, weight 800, UPPERCASE | weight 600, `textColor`, line-height 1.2 | visible (96×4px accent) |
| `presentation` | 72px, weight 700, sentence case | weight 400, `textSecondary`, line-height 1.45 | hidden |

Pick `purpose: "presentation"` + `format: "wide-16x9"` for a desktop / YouTube presentation deck. Any 3 × 8 × 2 = 48 combinations are valid.

---

## Workflow

### Step 1 — Get the text

- If passed inline — use it.
- If a file path (`.md`, `.txt`) — read it.
- If text is long (>500 chars) — confirm it's complete before planning.

### Step 2 — Clarify parameters (optional, can assume defaults)

Ask once, combined:

1. **Number of slides** (3–10, default 6)
2. **Format** (see table above, default `threads-4x5`; use `wide-16x9` for a presentation deck)
3. **Purpose** (`carousel` or `presentation`, default `carousel`)
4. **Font** (`minimal` / `editorial` / `clean`, default `minimal`)
5. **Color** (8 palettes, default `dark`)
6. **Handle** for CTA slide (e.g. `@username`)

Shortcut: if user says "presentation" / "презентация" / "slide deck" → default to `purpose: presentation`, `format: wide-16x9`, `font: clean`, `color: white`.

If user says "your call" — apply defaults, do not block.

### Step 3 — Plan the slide breakdown

Show the user a preview list before generation:

```
Slide 1 (hook): "Headline..."  [highlight: "word"]
Slide 2 (body): badge 01 — "Title" / "Text..."
Slide 3 (list): badge 02 — "iOS stack" / 3 items
Slide 4 (stats): badge 03 — "Growth" / 3 stats
Slide 5 (quote): "Quote..." — Author
Slide 6 (cta): "Final message" @username
```

### Rules for splitting text into slides

1. **Hook** = single most intriguing line from the post. 1–3 short lines. Works as a standalone thumbnail.
2. **Body slides** = one idea each. Max 40 words. Max 5 lines. Never join two ideas with "and".
3. **Mix slide types** for visual variety: prefer `list` for enumerations, `stats` for numbers, `quote` for direct speech, `comparison` for VS/before-after. Don't make every slide a `body`.
4. **CTA** = conclusion + follow handle. Centered, short.

### Step 4 — Generate

#### Prepare working copy

```bash
WORK_DIR="/tmp/carousel-$(date +%s)"
rsync -a --exclude=node_modules ~/.claude/skills/threads-carousel/template/ "$WORK_DIR/"
ln -s ~/.claude/skills/threads-carousel/template/node_modules "$WORK_DIR/node_modules"
cd "$WORK_DIR"
```

Symlinking `node_modules` avoids the 350MB copy per run.

#### Inject content into `src/slides.ts`

All content + defaults live in `src/slides.ts` — never touch the engine (`src/app/CarouselApp.tsx`, `src/lib/*`). Edit the `SLIDES` array and the 5 default constants.

Full injection example:

```ts
import type { SlideData, BgType, FormatId, FontId, ColorThemeId, PurposeId } from "./lib/types";

export const SLIDES: SlideData[] = [
  { type: "hook", text: "Line one\nline two", highlight: "two" },
  { type: "body", badge: "01", title: "Title", text: "Body text...", highlight: "key" },
  { type: "body", badge: "02", title: "Pros & Cons", points: [
    { type: "plus",  text: "One click to register" },
    { type: "plus",  text: "Works on any background" },
    { type: "minus", text: "Requires provider setup" },
  ]},
  { type: "list", badge: "03", title: "Steps", items: ["First", "Second", "Third"] },
  { type: "stats", title: "Numbers", stats: [
    { value: "10×", label: "Faster" },
    { value: "50%", label: "Smaller" },
  ]},
  { type: "quote", text: "Big idea\nin few words", author: "Someone", role: "2026" },
  { type: "checklist", title: "Pre-flight", items: ["One", "Two", "Three"] },
  { type: "cta", text: "Last word", handle: "@username" },
];

export const DEFAULT_FONT: FontId = "minimal";
export const DEFAULT_COLOR: ColorThemeId = "dark";
export const DEFAULT_PURPOSE: PurposeId = "carousel";
export const DEFAULT_BG: BgType = "glow";
export const DEFAULT_FORMAT: FormatId = "threads-4x5";
```

#### Launch preview and export

```bash
bun dev --port 3333
```

Tell the user to open `http://localhost:3333`. They can:
- Switch **Format / Mode / Font / Color / Background** live via toolbar rows
- Toggle UI language **RU / EN** in the top-right
- Click **PDF** to download all slides in one file (JPEG-compressed, ~5–8 MB for 10 slides)
- Click **PNG** (a.k.a. "Export All") to download every slide as `01-hook.png`, `02-body.png`, …
- Click an individual slide thumbnail to export just that one as PNG

After export, stop the dev server.

#### Parallel carousels

If making multiple carousels at once: create multiple work dirs and launch on ports 3333, 3334, 3335 — they run side by side without conflict.

---

## Design system

Canonical look (`font: minimal`, `color: dark`, `purpose: carousel`):

- **Display typeface:** Unbounded (Google Fonts), for hooks — applied only when the font axis provides `hookFontFamily`
- **Body typeface:** Space Grotesk (minimal) / Playfair (editorial) / Inter (clean) — everything else uses `preset.fontFamily`
- **Palette (dark):** `#0A0A0A` bg, `#FFFFFF` text, `#FACC15` highlight
- **Layout:** 80px padding, left-aligned, slide counter bottom-center
- **Title discipline:** carousel purpose — title → a 96×4px accent divider → body, with ≥64px breathing room above body. Presentation purpose — no divider, sentence case, 72px.
- **Hook size:** 104–140px, adaptive by character/line count
- **Body text size:** 48–88px, adaptive
- **Text balance:** `textWrap: "balance"` on hook + title (no orphan words)

### Typography table (carousel purpose)

The `presentation` purpose overrides titles to 72px / 700 / sentence case and body to 400 / `textSecondary` / line-height 1.45.

| Element | Size | Weight | Font source |
|---|---|---|---|
| Hook | 104–140px | 800 | `hookFontFamily` ?? `fontFamily` |
| Title | 44px | 800 uppercase | `fontFamily` |
| Body | 48–88px | 600 | `fontFamily` |
| Points (pros/cons) | 44–62px | 600 | `fontFamily` |
| Badge | 26px | 800 uppercase | `fontFamily` |
| Stats value | 140–170px | 900 | `fontFamily` |
| Stats label | 32px | 500 uppercase | `fontFamily` |
| Quote | 62px | 600 | `fontFamily` |
| List item | 46px | 600 | `fontFamily` (numbers 48px) |
| Checklist item | 44px | 600 | `fontFamily` |
| Process step title | 36px | 700 | `fontFamily` |
| Handle | 36px | 500 | `fontFamily` |

## Common mistakes

| Mistake | Fix |
|---|---|
| Too much text on a slide | Max 40 words, max 5 lines |
| Two ideas on one slide | Split into two slides |
| All slides are `body` type | Mix in `list`, `stats`, `quote`, `checklist` for visual variety |
| No hook on first slide | Slide 1 must be the catchiest line |
| No CTA on last slide | Slide N must end with a handle or call to action |
| Highlight word too long | Keep highlight to 1–2 words, not whole phrase |
| Badge has too many characters | Max 2–4 characters (`01`, `TIP`, `NEW`) |

## Future work / TODOs

- **Satori server-side export** — replace browser-based `html-to-image` with Satori + Resvg for CLI export (`bun run export → out/*.png`). Enables headless runs. See `Slashgear/linkedin-carousel-gen` for reference.
- **Per-slide background override** — currently `DEFAULT_BG` is global; could accept a per-slide `bg` field to mix decorations across a deck.
- **Cyrillic-optimized adaptive sizing** — current thresholds are calibrated for Latin; Russian copy tends to be 20–30% longer at the same font size.
- **Pencil MCP mode** — previous skill version had a manual design mode via Pencil; not currently implemented in the template.
