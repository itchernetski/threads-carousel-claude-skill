// ============================================================
// ✏️  EDIT THIS FILE TO CHANGE YOUR CAROUSEL CONTENT
// ============================================================
//
// This is the only file you need to touch to create a new carousel.
// The rendering engine lives in src/app/page.tsx and src/lib/*.
//
// - SLIDES: your slide content (see types for all available slide types)
// - ACTIVE_PRESET: visual style (minimal-dark, minimal-light, gradient-bold, paper, editorial, brutalist, pastel, neon, custom)
// - DEFAULT_BG: background decoration (none, blobs, grid, lines, noise, bignumber, glow)
// - DEFAULT_FORMAT: canvas size per platform (threads-4x5, instagram-square, linkedin-square, tiktok-9x16, story-9x16)
//
// Demo below showcases all 9 slide types: hook / body / list / stats / quote / checklist / process / comparison / cta
// body slides also support `points` — a list of { type: "plus" | "minus", text } rendered with SVG check/cross icons
// ============================================================

import type { SlideData, BgType, FormatId } from "./lib/types";

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
    title: "Плюсы и минусы",
    points: [
      { type: "plus", text: "Быстрая регистрация" },
      { type: "plus", text: "Работает на любом фоне" },
      { type: "minus", text: "Требует настройки" },
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

export const ACTIVE_PRESET = "minimal-dark";
export const DEFAULT_BG: BgType = "glow";
export const DEFAULT_FORMAT: FormatId = "threads-4x5";
