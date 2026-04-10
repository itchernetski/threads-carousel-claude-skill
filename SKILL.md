---
name: threads-carousel
user_invocable: true
description: >
  Convert text posts into visual carousel images for Threads, Instagram, LinkedIn, TikTok.
  9 slide types, 5 format presets, 7 background styles, highlighted keywords, Unbounded display font.
  Generates PNG carousels via Next.js preview + browser export.
  Triggers: threads carousel, instagram carousel, linkedin carousel, tiktok carousel, карусель, slides, carousel images.
---

# Threads Carousel Generator

Converts a text post into a set of visual carousel slides for Threads, Instagram, LinkedIn, TikTok, Stories and similar platforms. Opinionated dark-mode design system with a bold display typeface (Unbounded) and 9 composable slide types.

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

## Slide types (9)

| Type | Purpose | Required fields |
|---|---|---|
| `hook` | Opening slide — the catchiest line | `text` |
| `body` | Title + paragraph | `title`, `text` |
| `list` | Numbered items (ordered list) | `title`, `items[]` |
| `stats` | Big numbers with labels | `title`, `stats[]` |
| `quote` | Large pulled quote | `text`, `author` |
| `checklist` | Checkmark bullets | `title`, `items[]` |
| `process` | Numbered steps with connector line | `title`, `steps[]` |
| `comparison` | Two-column VS / before-after | `leftLabel`, `leftItems[]`, `rightLabel`, `rightItems[]` |
| `cta` | Final call to action | `text`, `handle` |

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

## Style presets (5)

- **`minimal-dark`** *(default)* — black bg, white text, Unbounded+SpaceGrotesk, yellow highlight
- **`minimal-light`** — off-white bg, dark text, red highlight
- **`gradient-bold`** — purple→pink→amber gradient, white text
- **`paper`** — cream bg, Playfair Display serif, literary
- **`custom`** — editable hex colors

---

## Workflow

### Step 1 — Get the text

- If passed inline — use it.
- If a file path (`.md`, `.txt`) — read it.
- If text is long (>500 chars) — confirm it's complete before planning.

### Step 2 — Clarify parameters (optional, can assume defaults)

Ask once, combined:

1. **Number of slides** (3–10, default 6)
2. **Format preset** (see table above, default `threads-4x5`)
3. **Style preset** (default `minimal-dark`)
4. **Handle** for CTA slide (e.g. `@username`)

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

#### Inject content into `src/app/page.tsx`

Edit the `SLIDES` array at the top of the file. Each slide is an object matching the types above. Also set `ACTIVE_PRESET`, `DEFAULT_BG`, and `DEFAULT_FORMAT` constants.

Full injection example:

```tsx
const SLIDES: SlideData[] = [
  { type: "hook", text: "Line one\nline two", highlight: "two" },
  { type: "body", badge: "01", title: "Title", text: "Body text...", highlight: "key" },
  { type: "list", badge: "02", title: "Steps", items: ["First", "Second", "Third"] },
  { type: "stats", title: "Numbers", stats: [
    { value: "10×", label: "Faster" },
    { value: "50%", label: "Smaller" },
  ]},
  { type: "quote", text: "Big idea\nin few words", author: "Someone", role: "2026" },
  { type: "checklist", title: "Pre-flight", items: ["One", "Two", "Three"] },
  { type: "cta", text: "Last word", handle: "@username" },
];

const ACTIVE_PRESET = "minimal-dark";
const DEFAULT_BG: BgType = "glow";
const DEFAULT_FORMAT: FormatId = "threads-4x5";
```

#### Launch preview and export

```bash
bun dev --port 3333
```

Tell the user to open `http://localhost:3333`. They can:
- Switch style presets and background types live via toolbar buttons
- Click **Export All** to download every slide as `01-hook.png`, `02-body.png`, …
- Click an individual slide thumbnail to export just that one

After export, stop the dev server.

#### Parallel carousels

If making multiple carousels at once: create multiple work dirs and launch on ports 3333, 3334, 3335 — they run side by side without conflict.

---

## Design system

Canonical look (`minimal-dark` preset):

- **Display typeface:** Unbounded (Google Fonts), for hooks, titles, badges, handles, quotes
- **Body typeface:** Space Grotesk, for body paragraphs
- **Palette:** `#0A0A0A` bg, `#FFFFFF` text, `#FACC15` highlight
- **Layout:** 80px padding, left-aligned, slide counter bottom-center
- **Title discipline:** each body slide has the title → a 96×4px accent divider → body text, with ≥64px breathing room above body
- **Hook size:** 104–140px, adaptive by character/line count
- **Body text size:** 48–88px, adaptive
- **Text balance:** `textWrap: "balance"` on hook + title (no orphan words)

### Typography table

| Element | Size | Weight | Font |
|---|---|---|---|
| Hook | 104–140px | 800 | Unbounded |
| Title | 44px | 800 uppercase | Unbounded |
| Body | 48–88px | 600 | Space Grotesk |
| Badge | 26px | 800 uppercase | Unbounded |
| Stats value | 140–170px | 900 | Unbounded |
| Stats label | 32px | 500 uppercase | Space Grotesk |
| Quote | 62px | 600 | Unbounded |
| List item | 46px | 600 | Space Grotesk (numbers 48px Unbounded) |
| Checklist item | 44px | 600 | Space Grotesk |
| Process step title | 36px | 700 | Unbounded |
| Handle | 36px | 500 | Unbounded |

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

- **Satori server-side export** — replace browser-based `html-to-image` with Satori + Resvg for CLI export (`bun run export → out/*.png`). Enables headless runs and LinkedIn PDF mode (Satori+pdf-lib). See `Slashgear/linkedin-carousel-gen` for reference implementation.
- **Runtime format switcher** — currently format is a const edited in source; could be React state with canvas dimensions via context.
- **Pencil MCP mode** — previous skill version had a manual design mode via Pencil; not currently implemented in the template.
