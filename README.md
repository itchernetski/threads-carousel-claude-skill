# threads-carousel-claude-skill

A [Claude Code](https://claude.com/claude-code) skill that converts text posts into visual carousel images for **Threads, Instagram, LinkedIn, TikTok, and Stories**.

![Preview](preview.png)

Paste a text post (or a Markdown file) into Claude, say "сделай карусель" / "make a carousel", and get a browser preview with exportable PNGs or a single PDF. Composable design system with three independent style axes, 10 slide types, 7 background decorations, and multi-platform format presets.

## Features

- **10 slide types** — hook, body, list, stats, quote, checklist, process, comparison, cta, plus a `points` variant of body for ✓/✗ pro/con lists with SVG icons
- **6 format presets** — Threads 4:5, Instagram square, LinkedIn document PDF, TikTok 9:16, Stories 9:16, Wide 16:9 (1920×1080 for presentations / YouTube)
- **3-axis style system** — pick a font × color × purpose independently:
  - **Font:** Minimal (Space Grotesk), Editorial (Playfair), Clean (Inter)
  - **Color:** Dark, Light, Paper, White, Gradient, Pastel, Neon, Custom (8 palettes)
  - **Purpose:** Carousel (bold 44px uppercase titles) or Presentation (72px sentence case, lighter body)
- **7 background decorations** — none, organic blobs, dot grid, diagonal lines, SVG noise, big number watermark, radial glow
- **Highlighted keywords** — any word in title or body can be colored in the accent color
- **Badges** — small outlined tags above titles (`01`, `02`, `TIP`, `NEW`)
- **Text balance** — `text-wrap: balance` on hooks and titles to prevent orphan words
- **Adaptive typography** — font size scales to content length
- **Modular architecture** — content in `src/slides.ts`, engine in `src/app/CarouselApp.tsx` + `src/lib/`
- **Live preview toolbar** — switch format, purpose, font, color, and background in the browser without editing code
- **RU/EN toolbar** — UI labels toggle between Russian and English
- **PNG export** — download individual slides or all at once via `html-to-image`
- **PDF export** — all slides in a single file via jsPDF (JPEG-compressed, ~5–8 MB for 10 slides)

## Quick start

### As a Claude Code skill

1. Clone the repo into your Claude skills directory:
   ```bash
   mkdir -p ~/.claude/skills
   git clone https://github.com/itchernetski/threads-carousel-claude-skill.git ~/.claude/skills/threads-carousel
   ```

2. Install template dependencies (one-time):
   ```bash
   cd ~/.claude/skills/threads-carousel/template
   bun install   # or pnpm / npm
   ```

3. In Claude Code, trigger the skill by pasting a post and saying:
   > Сделай карусель из этого поста
   >
   > or: Make a Threads carousel from this text

Claude reads the text, splits it into slides, edits `src/slides.ts` in a temporary working copy of the template, launches `bun dev` on port 3333, and hands you the preview URL.

### Standalone (without Claude)

You can also use the template directly as a Next.js carousel generator:

```bash
cd template
bun install
# Edit src/slides.ts with your content
bun dev --port 3333
# Open http://localhost:3333
# Click "Export All" to download PNGs
```

## Architecture

```
template/
├── src/
│   ├── slides.ts              ← ✏️  Edit this: your SLIDES array + defaults
│   ├── lib/
│   │   ├── types.ts           ← Shared type definitions
│   │   └── presets.ts         ← FONT_STYLES + COLOR_THEMES + composePreset + FORMAT_PRESETS
│   └── app/
│       ├── CarouselApp.tsx    ← Rendering engine (all slide components + toolbar)
│       ├── page.tsx           ← Dynamic client-only wrapper around CarouselApp
│       ├── layout.tsx         ← Next.js root layout + font loading
│       └── globals.css        ← Minimal global styles + toolbar transitions
├── package.json               ← Dependencies (Next.js, React, html-to-image, jspdf)
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

**The golden rule:** to change carousel content, only touch `src/slides.ts`. Everything else is the engine.

## Slide types reference

Each slide is an object in the `SLIDES` array with a `type` field and type-specific fields:

```ts
// hook — opening slide
{ type: "hook", text: "Claude Code\nis smarter with skills", highlight: "skills" }

// body — title + paragraph
{ type: "body", badge: "01", title: "Title", text: "Body text", highlight: "key" }

// body with points — pros/cons list with ✓/✗ SVG icons
{ type: "body", badge: "03", title: "Pros & Cons", points: [
  { type: "plus",  text: "One click to register" },
  { type: "plus",  text: "Works on any background" },
  { type: "minus", text: "Requires provider setup" },
]}

// list — numbered items
{ type: "list", title: "Steps", items: ["First", "Second", "Third"] }

// stats — big numbers
{ type: "stats", title: "Impact", stats: [
  { value: "3×", label: "More saves" },
  { value: "40%", label: "Faster" },
]}

// quote — pulled quote
{ type: "quote", text: "Quote text", author: "Someone", role: "2026" }

// checklist — checkmarks
{ type: "checklist", title: "Pre-flight", items: ["One", "Two", "Three"] }

// process — numbered steps with connector
{ type: "process", title: "How it works", steps: [
  { title: "Step 1", text: "Description" },
  { title: "Step 2", text: "Description" },
]}

// comparison — two-column VS
{ type: "comparison", title: "Before vs after",
  leftLabel: "Before", leftItems: ["Slow", "Manual"],
  rightLabel: "After", rightItems: ["Fast", "Automated"],
}

// cta — final call to action
{ type: "cta", text: "Follow for more", handle: "@username" }
```

## Defaults

- **Font:** `minimal` (Space Grotesk body + Unbounded display for hooks)
- **Color:** `dark` (black background, white text, yellow highlight)
- **Purpose:** `carousel` (bold 44px uppercase titles with divider)
- **Background:** `glow` (soft radial gradient in alternating corners)
- **Format:** `threads-4x5` (1080×1350)
- **Padding:** 80px, left-aligned

Change any of these in `src/slides.ts` via `DEFAULT_FONT`, `DEFAULT_COLOR`, `DEFAULT_PURPOSE`, `DEFAULT_BG`, and `DEFAULT_FORMAT`. For a presentation deck, set `DEFAULT_PURPOSE = "presentation"` and `DEFAULT_FORMAT = "wide-16x9"`.

## Design system

Sizes below are for the default `carousel` purpose. The `presentation` purpose overrides titles to 72px / weight 700 / sentence case / no divider, and body to weight 400 / `textSecondary` / line-height 1.45. Fonts follow the active font axis — Unbounded display accents are used only when the font axis provides `hookFontFamily` (Minimal preset).

| Element | Size | Weight | Font axis |
|---|---|---|---|
| Hook | 104–140px | 800 | `hookFontFamily` ?? `fontFamily` |
| Title | 44px | 800 uppercase | `fontFamily` |
| Body | 48–88px | 600 | `fontFamily` |
| Points (pros/cons) | 44–62px | 600 | `fontFamily` |
| Badge | 26px | 800 uppercase | `fontFamily` |
| Stats value | 140–170px | 900 | `fontFamily` |
| Quote | 62px | 600 | `fontFamily` |
| List item | 46px | 600 | `fontFamily` |
| Handle | 36px | 500 | `fontFamily` |

## Tech stack

- **Next.js 15** — React framework + `next/font/google` for font loading
- **React 19** — rendering
- **TypeScript 5** — type safety
- **Tailwind CSS 4** — minimal usage (mostly for reset)
- **html-to-image** — client-side PNG / JPEG export
- **jspdf** — multi-slide PDF export (dynamic import to avoid Next.js 15 webpack ESM issue)
- **Unbounded** + **Space Grotesk** + **Inter** + **Playfair Display** — via Google Fonts

## Customization

### Adding a new font axis

Add an entry to `FONT_STYLES` in `src/lib/presets.ts` and extend the `FontId` union in `src/lib/types.ts`:

```ts
mono: {
  id: "mono",
  name: "Mono",
  fontFamily: "var(--font-jetbrains-mono)",   // applied to titles, body, badges, stats, handles
  hookFontFamily: "var(--font-unbounded)",    // optional, hook-only display font
},
```

### Adding a new color theme

Add an entry to `COLOR_THEMES`:

```ts
midnight: {
  id: "midnight",
  name: "Midnight",
  bg: "#0A0A1F",
  bgGradient: undefined,       // optional CSS gradient (overrides bg)
  textColor: "#E0E7FF",
  textSecondary: "rgba(224,231,255,0.5)",
  accentColor: "#818CF8",      // dividers, decorative elements, default title color
  highlightColor: "#FACC15",   // keyword highlight color
},
```

Available font CSS variables (already loaded via Google Fonts):
- `--font-unbounded` — geometric display, great for hooks
- `--font-space-grotesk` — modern grotesque, good for body
- `--font-inter` — neutral sans-serif
- `--font-playfair` — classic serif

Then set `DEFAULT_FONT` / `DEFAULT_COLOR` in `src/slides.ts` to your new id. Font × color × purpose are composed into a final `StylePreset` at runtime by `composePreset()`.

To add a custom font: import it in `src/app/layout.tsx` via `next/font/google`, add a CSS variable, and reference it in a font axis entry.

### Modifying format presets

Add a new entry to `FORMAT_PRESETS` in `src/lib/presets.ts` and update the `FormatId` union type in `src/lib/types.ts`.

## Roadmap

- [x] **Runtime format switcher** — in the toolbar, resizes canvas live (shipped in [#1](https://github.com/itchernetski/threads-carousel-claude-skill/pull/1)).
- [x] **PDF export** — all slides in a single file via jsPDF (shipped in [#1](https://github.com/itchernetski/threads-carousel-claude-skill/pull/1)).
- [ ] **Satori + Resvg server-side export** — replace browser-based `html-to-image` with headless PNG generation for sharper output and CLI use. See [Slashgear/linkedin-carousel-gen](https://github.com/Slashgear/linkedin-carousel-gen) for reference.
- [ ] **Per-slide background override** — different bg type per slide.
- [ ] **Cyrillic-optimized defaults** — adjust adaptive sizing thresholds for Russian/Cyrillic text density.

## Feedback

Feature requests and ideas: [Telegram discussion](https://t.me/beyondcoinkeeper/170)

## Related projects

- [Slashgear/linkedin-carousel-gen](https://github.com/Slashgear/linkedin-carousel-gen) — LinkedIn carousels via Satori + PDF (TypeScript + Bun)
- [FranciscoMoretti/carousel-generator](https://github.com/FranciscoMoretti/carousel-generator) — in-browser LinkedIn carousel editor
- [PritishMishraa/thread-to-carousel](https://github.com/PritishMishraa/thread-to-carousel) — Twitter thread → LinkedIn carousel
- [fern-opensource/carouselmaker](https://github.com/fern-opensource/carouselmaker) — LinkedIn carousels via LangGraph + Claude + Figma MCP

## Contributors

Thanks to everyone who shipped improvements:

- [@azdaev](https://github.com/azdaev) — `points` slide type, 3-axis style system, `wide-16x9` format, PDF export, runtime format switcher, RU/EN toolbar ([#1](https://github.com/itchernetski/threads-carousel-claude-skill/pull/1))

## License

MIT — see [LICENSE](LICENSE).

---

Built with [Claude Code](https://claude.com/claude-code).
