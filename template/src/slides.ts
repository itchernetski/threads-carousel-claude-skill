// ============================================================
// ✏️  EDIT THIS FILE TO CHANGE YOUR CAROUSEL CONTENT
// ============================================================
//
// This is the only file you need to touch to create a new carousel.
// The rendering engine lives in src/app/page.tsx and src/lib/*.
//
// - SLIDES: your slide content (see types for all available slide types)
// - DEFAULT_FONT:    typeface — "minimal" | "editorial" | "clean" | "mono" | "condensed"
// - DEFAULT_SURFACE: bg + text — "dark" | "white" | "light" | "paper" | "gradient" | "pastel" | "neon" | "ember"
// - DEFAULT_ACCENT:  pop color — "yellow" | "red" | "teal" | "coral" | "orange" | "violet" | "lime" | "blue" | "fuchsia" | "pink" | "amber"
// - DEFAULT_PURPOSE: layout   — "carousel" | "presentation"
// - DEFAULT_BG:      decoration — "none" | "blobs" | "grid" | "lines" | "paper" | "noise" | "bignumber" | "glow"
// - DEFAULT_FORMAT:  canvas size — "threads-4x5" | "instagram-square" | "linkedin-square" | "tiktok-9x16" | "story-9x16" | "wide-16x9"
//
// Demo below showcases all 12 slide types:
//   hook / body / list / stats / quote / checklist / process / comparison / cta / image / emoji / number
// body slides also support `points` — a list of { type: "plus" | "minus", text } rendered with SVG check/cross icons
// image slides use `imageSrc: "/images/your-file.png"` (drop PNG/JPG into template/public/images/)
// highlight can be styled with `highlightStyle: "italic-box"` — Playfair italic on a colored rectangle
// ============================================================

import type { SlideData, BgType, FormatId, FontId, SurfaceId, AccentId, PurposeId } from "./lib/types";

export const SLIDES: SlideData[] = [
  {
    type: "hook",
    text: "Carousels that\nactually pop",
    highlight: "pop",
    highlightStyle: "italic-box",
  },
  {
    type: "number",
    badge: "01",
    bigNumber: "+3",
    title: "new slide types",
    text: "Image. Emoji. Number.\nFor everything text can't carry.",
  },
  {
    type: "image",
    badge: "02",
    title: "Drop in any image",
    imageSrc: "/images/demo.png",
    imageCaption: "Screenshots, photos, memes — right inside the slide",
  },
  {
    type: "emoji",
    badge: "03",
    emoji: "🎯",
    title: "One giant emoji",
    text: "A single symbol fills the canvas.\nNo photo needed, still illustrated.",
  },
  {
    type: "number",
    badge: "04",
    bigNumber: "88",
    title: "color combos",
    text: "8 surfaces × 11 accents — independent axes.\nBackground and pop color, finally split.",
    highlight: "8 surfaces × 11 accents",
  },
  {
    type: "list",
    badge: "05",
    title: "Also new",
    highlight: "ruled paper",
    items: [
      "Ruled paper background — for literary posts",
      "Italic-box word highlight on a colored block",
      "5 fonts: minimal, editorial, clean, mono, condensed",
      "12 slide types instead of 9",
    ],
  },
  {
    type: "body",
    badge: "06",
    title: "Images, zero setup",
    text: "Give Claude a local file path.\nIt copies into public/images/\nand wires it into the slide.\n\nNo manual steps.",
    highlight: "public/images/",
  },
  {
    type: "quote",
    text: "A carousel is text\nyou can't scroll past\nwithout reading.",
    author: "product observation",
  },
  {
    type: "cta",
    text: "Update the skill\nand ship your own",
    handle: "github@itchernetski",
  },
];

export const DEFAULT_FONT: FontId = "minimal";
export const DEFAULT_SURFACE: SurfaceId = "dark";
export const DEFAULT_ACCENT: AccentId = "yellow";
export const DEFAULT_PURPOSE: PurposeId = "carousel";
export const DEFAULT_BG: BgType = "glow";
export const DEFAULT_FORMAT: FormatId = "threads-4x5";
// For a presentation: set DEFAULT_PURPOSE = "presentation" and DEFAULT_FORMAT = "wide-16x9"
// Great combos to try:
//   dark + teal (noir)         ember + lime (announcement)
//   paper + orange (literary)  light + teal (calm info)
//   white + coral (editorial)  pastel + fuchsia (playful)
//   gradient + amber (glow)    neon + violet (tech)
