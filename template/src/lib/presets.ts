// ============================================================
// Style axes and format presets.
//
// Three independent axes compose a StylePreset at runtime:
//   FONT_STYLES   — typeface / font family
//   COLOR_THEMES  — background, text, and accent colors
//   composePreset — merges font + color + purpose into StylePreset
//
// FORMAT_PRESETS — canvas dimensions per platform (unchanged)
// ============================================================

import type {
  StylePreset,
  FormatPreset,
  FormatId,
  FontId,
  FontStyle,
  SurfaceId,
  Surface,
  AccentId,
  Accent,
  PurposeId,
} from "./types";

// ---- Font styles ----

export const FONT_STYLES: Record<FontId, FontStyle> = {
  // Geometric display — bold, rounded, distinctive. Unbounded everywhere.
  minimal: {
    id: "minimal",
    name: "Minimal",
    displayName: "Unbounded",
    fontFamily: "var(--font-unbounded)",
    hookFontFamily: "var(--font-unbounded)",
  },
  // Classic serif — Playfair for both headings and body.
  editorial: {
    id: "editorial",
    name: "Editorial",
    displayName: "Playfair Display",
    fontFamily: "var(--font-playfair)",
    hookFontFamily: "var(--font-playfair)",
  },
  // Neutral sans-serif — pure Inter throughout. The most "standard" look.
  clean: {
    id: "clean",
    name: "Inter",
    displayName: "Inter",
    fontFamily: "var(--font-inter)",
    hookFontFamily: "var(--font-inter)",
  },
  // Monospace technical — JetBrains Mono. Tech/dev feel.
  mono: {
    id: "mono",
    name: "Mono",
    displayName: "JetBrains Mono",
    fontFamily: "var(--font-jetbrains-mono)",
    hookFontFamily: "var(--font-jetbrains-mono)",
  },
  // Narrow tall condensed — Oswald. Editorial-poster feel.
  condensed: {
    id: "condensed",
    name: "Condensed",
    displayName: "Oswald",
    fontFamily: "var(--font-oswald)",
    hookFontFamily: "var(--font-oswald)",
  },
  // Full Cyrillic sans-serif — best choice for Russian content.
  manrope: {
    id: "manrope",
    name: "Manrope",
    displayName: "Manrope",
    fontFamily: "var(--font-manrope)",
    hookFontFamily: "var(--font-manrope)",
  },
};

// ---- Color themes ----

// ---- Surfaces: bg + text neutrals (no pop color) ----
export const SURFACES: Record<SurfaceId, Surface> = {
  dark: {
    id: "dark",
    name: "Dark",
    bg: "#0A0A0A",
    textColor: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.5)",
    accentColor: "#FFFFFF",
  },
  white: {
    id: "white",
    name: "White",
    bg: "#FFFFFF",
    textColor: "#0B0B0B",
    textSecondary: "rgba(0,0,0,0.4)",
    accentColor: "#0B0B0B",
  },
  // Cool zinc grey — neutral, editorial, Vercel-like. Distinctly cool.
  light: {
    id: "light",
    name: "Light",
    bg: "#F4F4F5",
    textColor: "#18181B",
    textSecondary: "rgba(24,24,27,0.5)",
    accentColor: "#18181B",
  },
  // Notebook cream — pushed further into yellow. Distinctly warm.
  paper: {
    id: "paper",
    name: "Paper",
    bg: "#ECE2C8",
    textColor: "#3A2F1C",
    textSecondary: "rgba(58,47,28,0.55)",
    accentColor: "#78350F",
  },
  gradient: {
    id: "gradient",
    name: "Gradient",
    bg: "#1a1a2e",
    bgGradient:
      "linear-gradient(135deg, #6366F1 0%, #EC4899 50%, #F59E0B 100%)",
    textColor: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.7)",
    accentColor: "#FFFFFF",
  },
  pastel: {
    id: "pastel",
    name: "Pastel",
    bg: "#EDE9FE",
    textColor: "#1E1B4B",
    textSecondary: "rgba(30,27,75,0.45)",
    accentColor: "#6D28D9",
  },
  neon: {
    id: "neon",
    name: "Neon",
    bg: "#0F172A",
    bgGradient: "linear-gradient(160deg, #0F172A 0%, #1E1B4B 100%)",
    textColor: "#E0F2FE",
    textSecondary: "rgba(224,242,254,0.4)",
    accentColor: "#06B6D4",
  },
  // Black→red radial — dramatic dark surface (inspired by ref 7).
  ember: {
    id: "ember",
    name: "Ember",
    bg: "#0A0A0A",
    bgGradient: "radial-gradient(circle at 30% 20%, #8B0000 0%, #1A0606 45%, #0A0A0A 100%)",
    textColor: "#F5F5F4",
    textSecondary: "rgba(245,245,244,0.55)",
    accentColor: "#F5F5F4",
  },
};

// ---- Accents: the pop color used for highlighted words ----
export const ACCENTS: Record<AccentId, Accent> = {
  yellow:  { id: "yellow",  name: "Yellow",  color: "#FACC15" },
  red:     { id: "red",     name: "Red",     color: "#DC2626" },
  teal:    { id: "teal",    name: "Teal",    color: "#14B8A6" },
  // Pink-family coral (Pantone Living Coral 2019 inspired) — NOT orange-leaning.
  coral:   { id: "coral",   name: "Coral",   color: "#FB7185" },
  // Bright pumpkin orange — clearly distinct from coral.
  orange:  { id: "orange",  name: "Orange",  color: "#F97316" },
  violet:  { id: "violet",  name: "Violet",  color: "#A78BFA" },
  lime:    { id: "lime",    name: "Lime",    color: "#D9F056" },
  // Classic brand blue — high contrast, fills the biggest palette gap.
  blue:    { id: "blue",    name: "Blue",    color: "#3B82F6" },
  // Magenta/fuchsia — pairs beautifully with pastel lilac surface.
  fuchsia: { id: "fuchsia", name: "Fuchsia", color: "#C026D3" },
  // Hot pink — central stop of the gradient surface, pairs well with it.
  pink:    { id: "pink",    name: "Pink",    color: "#EC4899" },
  // Golden amber — final stop of the gradient; pops against its purple/pink sections.
  amber:   { id: "amber",   name: "Amber",   color: "#F59E0B" },
};

// ---- Compose a StylePreset from the four axes ----

export function composePreset(
  font: FontStyle,
  surface: Surface,
  accent: Accent,
  purpose: PurposeId
): StylePreset {
  const base: StylePreset = {
    id: `${font.id}-${surface.id}-${accent.id}`,
    name: `${font.name} / ${surface.name} / ${accent.name}`,
    bg: surface.bg,
    bgGradient: surface.bgGradient,
    textColor: surface.textColor,
    textSecondary: surface.textSecondary,
    accentColor: surface.accentColor,
    highlightColor: accent.color,
    fontFamily: font.fontFamily,
    hookFontFamily: font.hookFontFamily,
  };

  if (purpose === "presentation") {
    return {
      ...base,
      titleFontSize: 72,
      titleFontWeight: 700,
      titleUppercase: false,
      titleDivider: false,
      bodyFontWeight: 400,
      bodyColor: surface.textSecondary,
      bodyLineHeight: 1.45,
    };
  }

  return base;
}

// ---- Format presets (canvas dimensions) ----

export const FORMAT_PRESETS: Record<FormatId, FormatPreset> = {
  "threads-4x5": {
    id: "threads-4x5",
    name: "Threads / Instagram 4:5",
    w: 1080,
    h: 1350,
    platform: "Threads, Instagram",
  },
  "instagram-square": {
    id: "instagram-square",
    name: "Square 1:1",
    w: 1080,
    h: 1080,
    platform: "Instagram, Facebook, LinkedIn",
  },
  "linkedin-square": {
    id: "linkedin-square",
    name: "LinkedIn PDF",
    w: 1080,
    h: 1080,
    platform: "LinkedIn (PDF document)",
  },
  "tiktok-9x16": {
    id: "tiktok-9x16",
    name: "TikTok 9:16",
    w: 1080,
    h: 1920,
    platform: "TikTok, Reels, Shorts",
  },
  "story-9x16": {
    id: "story-9x16",
    name: "Story 9:16",
    w: 1080,
    h: 1920,
    platform: "Instagram Stories, Threads",
  },
  "wide-16x9": {
    id: "wide-16x9",
    name: "Wide 16:9",
    w: 1920,
    h: 1080,
    platform: "Presentations, YouTube, Desktop",
  },
};
