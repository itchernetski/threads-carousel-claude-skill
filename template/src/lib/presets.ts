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
  ColorThemeId,
  ColorTheme,
  PurposeId,
} from "./types";

// ---- Font styles ----

export const FONT_STYLES: Record<FontId, FontStyle> = {
  minimal: {
    id: "minimal",
    name: "Minimal",
    fontFamily: "var(--font-space-grotesk), var(--font-inter)",
    hookFontFamily: "var(--font-unbounded)",
  },
  editorial: {
    id: "editorial",
    name: "Editorial",
    fontFamily: "var(--font-playfair)",
    hookFontFamily: "var(--font-playfair)",
  },
  clean: {
    id: "clean",
    name: "Clean",
    fontFamily: "var(--font-inter)",
  },
};

// ---- Color themes ----

export const COLOR_THEMES: Record<ColorThemeId, ColorTheme> = {
  dark: {
    id: "dark",
    name: "Dark",
    bg: "#0A0A0A",
    textColor: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.5)",
    accentColor: "#FFFFFF",
    highlightColor: "#FACC15",
  },
  light: {
    id: "light",
    name: "Light",
    bg: "#FAFAFA",
    textColor: "#1A1A1A",
    textSecondary: "rgba(0,0,0,0.4)",
    accentColor: "#1A1A1A",
    highlightColor: "#DC2626",
  },
  paper: {
    id: "paper",
    name: "Paper",
    bg: "#F5F0E8",
    textColor: "#2C2416",
    textSecondary: "rgba(44,36,22,0.5)",
    accentColor: "#8B7355",
    highlightColor: "#B91C1C",
  },
  white: {
    id: "white",
    name: "White",
    bg: "#FFFFFF",
    textColor: "#111111",
    textSecondary: "rgba(0,0,0,0.35)",
    accentColor: "#111111",
    highlightColor: "#E11D48",
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
    highlightColor: "#FDE047",
  },
  pastel: {
    id: "pastel",
    name: "Pastel",
    bg: "#EDE9FE",
    textColor: "#1E1B4B",
    textSecondary: "rgba(30,27,75,0.45)",
    accentColor: "#6D28D9",
    highlightColor: "#C026D3",
  },
  neon: {
    id: "neon",
    name: "Neon",
    bg: "#0F172A",
    bgGradient: "linear-gradient(160deg, #0F172A 0%, #1E1B4B 100%)",
    textColor: "#E0F2FE",
    textSecondary: "rgba(224,242,254,0.4)",
    accentColor: "#06B6D4",
    highlightColor: "#A855F7",
  },
  custom: {
    id: "custom",
    name: "Custom",
    bg: "#0A0A0A",
    textColor: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.5)",
    accentColor: "#6366F1",
    highlightColor: "#FACC15",
  },
};

// ---- Compose a StylePreset from the three axes ----

export function composePreset(
  font: FontStyle,
  color: ColorTheme,
  purpose: PurposeId
): StylePreset {
  const base: StylePreset = {
    id: `${font.id}-${color.id}`,
    name: `${font.name} / ${color.name}`,
    bg: color.bg,
    bgGradient: color.bgGradient,
    textColor: color.textColor,
    textSecondary: color.textSecondary,
    accentColor: color.accentColor,
    highlightColor: color.highlightColor,
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
      bodyColor: color.textSecondary,
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
