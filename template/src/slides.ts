// ============================================================
// ✏️  EDIT THIS FILE TO CHANGE YOUR CAROUSEL CONTENT
// ============================================================
//
// This is the only file you need to touch to create a new carousel.
// The rendering engine lives in src/app/page.tsx and src/lib/*.
//
// - SLIDES: your slide content (see types for all available slide types)
// - DEFAULT_FONT:    typeface — "minimal" | "editorial" | "clean"
// - DEFAULT_COLOR:   palette  — "dark" | "light" | "paper" | "white" | "gradient" | "pastel" | "neon" | "custom"
// - DEFAULT_PURPOSE: layout   — "carousel" | "presentation"
// - DEFAULT_BG:      decoration — "none" | "blobs" | "grid" | "lines" | "noise" | "bignumber" | "glow"
// - DEFAULT_FORMAT:  canvas size — "threads-4x5" | "instagram-square" | "linkedin-square" | "tiktok-9x16" | "story-9x16" | "wide-16x9"
//
// Demo below showcases all 9 slide types: hook / body / list / stats / quote / checklist / process / comparison / cta
// body slides also support `points` — a list of { type: "plus" | "minus", text } rendered with SVG check/cross icons
// ============================================================

import type { SlideData, BgType, FormatId, FontId, ColorThemeId, PurposeId } from "./lib/types";

export const SLIDES: SlideData[] = [
  {
    type: "hook",
    text: "Текстовый пост →\nготовая карусель",
    highlight: "карусель",
  },
  {
    type: "body",
    badge: "01",
    title: "Как это работает",
    text: "Кидаешь Claude текст поста и говоришь\n«сделай карусель».\n\nОн разбивает на слайды, запускает превью — и ты видишь результат в браузере.",
    highlight: "сделай карусель",
  },
  {
    type: "list",
    badge: "02",
    title: "9 типов слайдов",
    items: [
      "Hook — цепляющий заголовок",
      "Body — заголовок + текст",
      "List, Checklist — списки",
      "Stats — большие числа",
      "Quote, Process, Comparison, CTA",
    ],
  },
  {
    type: "body",
    badge: "03",
    title: "Pros & Cons",
    points: [
      { type: "plus", text: "One click to register" },
      { type: "plus", text: "Works on any background" },
      { type: "minus", text: "Requires provider setup" },
    ],
  },
  {
    type: "stats",
    badge: "04",
    title: "Форматы",
    stats: [
      { value: "4:5", label: "Threads" },
      { value: "1:1", label: "Square" },
      { value: "9:16", label: "TikTok" },
    ],
  },
  {
    type: "body",
    badge: "05",
    title: "Архитектура",
    text: "slides.ts — 50 строк контента.\nДвижок — 1200 строк.\n\nClaude редактирует только slides.ts.\nМинимум шансов сломать рендер.",
    highlight: "slides.ts",
  },
  {
    type: "cta",
    text: "Попробуй в своём\nследующем посте",
    handle: "github@itchernetski",
  },
];

export const DEFAULT_FONT: FontId = "minimal";
export const DEFAULT_COLOR: ColorThemeId = "dark";
export const DEFAULT_PURPOSE: PurposeId = "carousel";
export const DEFAULT_BG: BgType = "glow";
export const DEFAULT_FORMAT: FormatId = "threads-4x5";
// For a presentation: set DEFAULT_PURPOSE = "presentation" and DEFAULT_FORMAT = "wide-16x9"
