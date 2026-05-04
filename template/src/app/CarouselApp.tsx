"use client";

import { useRef, useState, useCallback, useEffect, ReactNode, createContext, useContext } from "react";
import { toPng, toJpeg } from "html-to-image";
import type { SlideData, SlideType, BgType, StylePreset, FontId, SurfaceId, AccentId, PurposeId, FormatId } from "../lib/types";
import { FONT_STYLES, SURFACES, ACCENTS, composePreset, FORMAT_PRESETS } from "../lib/presets";
import { SLIDES, DEFAULT_FONT, DEFAULT_SURFACE, DEFAULT_ACCENT, DEFAULT_PURPOSE, DEFAULT_BG, DEFAULT_FORMAT } from "../slides";

const CANVAS_W = FORMAT_PRESETS[DEFAULT_FORMAT].w;
const CANVAS_H = FORMAT_PRESETS[DEFAULT_FORMAT].h;

const CanvasSizeContext = createContext({ w: CANVAS_W, h: CANVAS_H });
function useCanvasSize() { return useContext(CanvasSizeContext); }

// ============================================================
// ADAPTIVE FONT SIZE
// ============================================================

function getAdaptiveFontSize(text: string, type: "hook" | "body"): number {
  const chars = text.replace(/\n/g, "").length;
  const lines = text.split("\n").length;
  const maxLineLen = Math.max(...text.split("\n").map((l) => l.length));

  if (type === "hook") {
    let sizeByChars = 170;
    if (chars > 70) sizeByChars = 104;
    else if (chars > 50) sizeByChars = 120;
    else if (chars > 30) sizeByChars = 140;
    else if (chars > 20) sizeByChars = 156;

    let sizeByLines = 170;
    if (lines > 4) sizeByLines = 104;
    else if (lines > 3) sizeByLines = 120;
    else if (lines > 2) sizeByLines = 144;

    // Unbounded bold is wide (Cyrillic more so) — cap by longest explicit line
    // so long words don't overflow 920px content area (1080 − 80×2 padding).
    let sizeByMaxLine = 170;
    if (lines > 1) {
      if (maxLineLen > 14) sizeByMaxLine = 88;
      else if (maxLineLen > 12) sizeByMaxLine = 108;
      else if (maxLineLen > 10) sizeByMaxLine = 124;
      else if (maxLineLen > 8) sizeByMaxLine = 140;
    }

    return Math.min(sizeByChars, sizeByLines, sizeByMaxLine);
  }

  // body
  let sizeByChars = 88;
  if (chars > 160) sizeByChars = 48;
  else if (chars > 120) sizeByChars = 56;
  else if (chars > 80) sizeByChars = 64;
  else if (chars > 40) sizeByChars = 76;

  let sizeByLines = 88;
  if (lines > 6) sizeByLines = 48;
  else if (lines > 5) sizeByLines = 54;
  else if (lines > 4) sizeByLines = 62;
  else if (lines > 3) sizeByLines = 72;

  return Math.min(sizeByChars, sizeByLines);
}

// ============================================================
// DECORATIVE BLOBS
// ============================================================

function seededRandom(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateBlobPath(
  rng: () => number,
  cx: number,
  cy: number,
  radius: number,
  points: number = 7
): string {
  const angleStep = (Math.PI * 2) / points;
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < points; i++) {
    const angle = angleStep * i - Math.PI / 2;
    const r = radius * (0.7 + rng() * 0.6);
    pts.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }

  // Build smooth cubic bezier path through points
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < points; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % points];
    const prev = pts[(i - 1 + points) % points];
    const nextNext = pts[(i + 2) % points];

    const cp1x = curr.x + (next.x - prev.x) * 0.25;
    const cp1y = curr.y + (next.y - prev.y) * 0.25;
    const cp2x = next.x - (nextNext.x - curr.x) * 0.25;
    const cp2y = next.y - (nextNext.y - curr.y) * 0.25;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }
  d += " Z";
  return d;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

// Corner zones where blobs can appear without overlapping text
const BLOB_ZONES = [
  { x: 0.1, y: 0.05 },   // top-left
  { x: 0.85, y: 0.05 },  // top-right
  { x: 0.05, y: 0.85 },  // bottom-left
  { x: 0.9, y: 0.8 },    // bottom-right
  { x: 0.85, y: 0.45 },  // mid-right
  { x: 0.05, y: 0.4 },   // mid-left
];

function SlideDecorations({
  slideIndex,
  preset,
}: {
  slideIndex: number;
  preset: StylePreset;
}) {
  const { w: CANVAS_W, h: CANVAS_H } = useCanvasSize();
  const rng = seededRandom(slideIndex * 7919 + 42);
  const blobCount = 1 + Math.floor(rng() * 2); // 1-2 blobs
  const { r, g, b } = hexToRgb(preset.accentColor);

  const blobs: ReactNode[] = [];

  for (let i = 0; i < blobCount; i++) {
    const zoneIdx = Math.floor(rng() * BLOB_ZONES.length);
    const zone = BLOB_ZONES[zoneIdx];
    const cx = zone.x * CANVAS_W + (rng() - 0.5) * 100;
    const cy = zone.y * CANVAS_H + (rng() - 0.5) * 100;
    const radius = 150 + rng() * 200;
    const opacity = 0.06 + rng() * 0.06;
    const rotation = rng() * 360;

    const path = generateBlobPath(rng, 0, 0, radius);

    blobs.push(
      <g
        key={i}
        transform={`translate(${cx}, ${cy}) rotate(${rotation})`}
      >
        <path
          d={path}
          fill={`rgba(${r}, ${g}, ${b}, ${opacity})`}
        />
      </g>
    );
  }

  return (
    <svg
      width={CANVAS_W}
      height={CANVAS_H}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    >
      {blobs}
    </svg>
  );
}

// ============================================================
// BACKGROUND DECORATIONS (grid / noise / bignumber / glow / lines)
// ============================================================

function GridDecoration({ preset }: { preset: StylePreset }) {
  const { w: CANVAS_W, h: CANVAS_H } = useCanvasSize();
  const { r, g, b } = hexToRgb(preset.accentColor);
  return (
    <svg
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      <defs>
        <pattern id="dotgrid" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="30" cy="30" r="2.5" fill={`rgba(${r},${g},${b},0.14)`} />
        </pattern>
      </defs>
      <rect width={CANVAS_W} height={CANVAS_H} fill="url(#dotgrid)" />
    </svg>
  );
}

function LinesDecoration({ preset }: { preset: StylePreset }) {
  const { w: CANVAS_W, h: CANVAS_H } = useCanvasSize();
  const { r, g, b } = hexToRgb(preset.accentColor);
  return (
    <svg
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      <defs>
        <pattern
          id="diaglines"
          width="64"
          height="64"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-35)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="64"
            stroke={`rgba(${r},${g},${b},0.08)`}
            strokeWidth="3"
          />
        </pattern>
      </defs>
      <rect width={CANVAS_W} height={CANVAS_H} fill="url(#diaglines)" />
    </svg>
  );
}

function PaperDecoration({ preset }: { preset: StylePreset }) {
  const { w: CANVAS_W, h: CANVAS_H } = useCanvasSize();
  const { r, g, b } = hexToRgb(preset.textColor);
  const lineColor = `rgba(${r},${g},${b},0.12)`;
  const marginColor = `rgba(${r},${g},${b},0.22)`;
  return (
    <svg
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      <defs>
        <pattern id="ruledlines" width={CANVAS_W} height="64" patternUnits="userSpaceOnUse">
          <line
            x1="0"
            y1="64"
            x2={CANVAS_W}
            y2="64"
            stroke={lineColor}
            strokeWidth="1.5"
          />
        </pattern>
      </defs>
      <rect width={CANVAS_W} height={CANVAS_H} fill="url(#ruledlines)" />
      <line
        x1="140"
        y1="0"
        x2="140"
        y2={CANVAS_H}
        stroke={marginColor}
        strokeWidth="2"
      />
    </svg>
  );
}

function NoiseDecoration({ slideIndex }: { slideIndex: number }) {
  const { w: CANVAS_W, h: CANVAS_H } = useCanvasSize();
  const id = `noise-${slideIndex}`;
  return (
    <svg
      width={CANVAS_W}
      height={CANVAS_H}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        mixBlendMode: "overlay",
        opacity: 0.6,
      }}
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves="2"
          seed={slideIndex + 1}
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={CANVAS_W} height={CANVAS_H} filter={`url(#${id})`} />
    </svg>
  );
}

function BigNumberDecoration({
  slideIndex,
  preset,
}: {
  slideIndex: number;
  preset: StylePreset;
}) {
  const { r, g, b } = hexToRgb(preset.accentColor);
  return (
    <div
      style={{
        position: "absolute",
        right: -60,
        bottom: -280,
        fontSize: 960,
        fontFamily: preset.fontFamily,
        fontWeight: 900,
        color: `rgba(${r},${g},${b},0.055)`,
        lineHeight: 0.8,
        letterSpacing: "-0.06em",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {String(slideIndex + 1).padStart(2, "0")}
    </div>
  );
}

function GlowDecoration({
  slideIndex,
  preset,
}: {
  slideIndex: number;
  preset: StylePreset;
}) {
  const { r, g, b } = hexToRgb(preset.accentColor);
  // alternate corners by slide index
  const positions = [
    { top: -200, right: -200 },
    { bottom: -200, left: -200 },
    { top: -200, left: -200 },
    { bottom: -200, right: -200 },
  ];
  const pos = positions[slideIndex % positions.length];
  return (
    <div
      style={{
        position: "absolute",
        ...pos,
        width: 900,
        height: 900,
        background: `radial-gradient(circle, rgba(${r},${g},${b},0.22), transparent 65%)`,
        filter: "blur(60px)",
        pointerEvents: "none",
      }}
    />
  );
}

function SlideBackground({
  bgType,
  slideIndex,
  preset,
}: {
  bgType: BgType;
  slideIndex: number;
  preset: StylePreset;
}) {
  switch (bgType) {
    case "blobs":
      return <SlideDecorations slideIndex={slideIndex} preset={preset} />;
    case "grid":
      return <GridDecoration preset={preset} />;
    case "lines":
      return <LinesDecoration preset={preset} />;
    case "paper":
      return <PaperDecoration preset={preset} />;
    case "noise":
      return <NoiseDecoration slideIndex={slideIndex} />;
    case "bignumber":
      return <BigNumberDecoration slideIndex={slideIndex} preset={preset} />;
    case "glow":
      return <GlowDecoration slideIndex={slideIndex} preset={preset} />;
    case "none":
    default:
      return null;
  }
}

// ============================================================
// HELPERS — badge, highlight, text balance
// ============================================================

function getHighlights(data: SlideData): string[] {
  if (data.highlights && data.highlights.length > 0) return data.highlights.filter(Boolean);
  if (data.highlight) return [data.highlight];
  return [];
}

function renderWithHighlight(
  text: string,
  highlights: string[],
  highlightColor: string,
  style: "default" | "italic-box" = "default"
): ReactNode {
  if (!highlights.length) return text;
  const escaped = highlights.map(h => h.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  return parts.map((part, i) => {
    const isHighlight = highlights.some(h => part.toLowerCase() === h.toLowerCase());
    if (!isHighlight) return <span key={i}>{part}</span>;
    if (style === "italic-box") {
      return (
        <span
          key={i}
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontStyle: "italic",
            fontWeight: 700,
            background: highlightColor,
            color: "#ffffff",
            padding: "0 0.22em",
            borderRadius: 6,
            textTransform: "none",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            boxDecorationBreak: "clone",
            WebkitBoxDecorationBreak: "clone",
          }}
        >
          {part}
        </span>
      );
    }
    return <span key={i} style={{ color: highlightColor, position: "relative" }}>{part}</span>;
  });
}

function Badge({ text, preset }: { text: string; preset: StylePreset }) {
  return (
    <div
      style={{
        display: "inline-block",
        fontFamily: preset.fontFamily,
        fontSize: 26,
        fontWeight: 800,
        padding: "10px 22px",
        border: `3px solid ${preset.accentColor}`,
        color: preset.accentColor,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        marginBottom: 40,
        borderRadius: 6,
        alignSelf: "flex-start",
        position: "relative",
      }}
    >
      {text}
    </div>
  );
}

function SlideTitle({
  text,
  preset,
  highlights,
  uppercase,
}: {
  text: string;
  preset: StylePreset;
  highlights?: string[];
  uppercase?: boolean;
}) {
  const isUppercase = uppercase !== undefined ? uppercase : (preset.titleUppercase ?? true);
  return (
    <div
      style={{
        fontFamily: preset.fontFamily,
        fontSize: preset.titleFontSize ?? 44,
        fontWeight: preset.titleFontWeight ?? 800,
        color: preset.titleColor ?? preset.accentColor,
        textTransform: isUppercase ? "uppercase" : "none",
        letterSpacing: isUppercase ? "0.06em" : "-0.02em",
        lineHeight: 1.1,
        marginBottom: 28,
        position: "relative",
        textWrap: "balance" as const,
      }}
    >
      {renderWithHighlight(text, highlights ?? [], preset.highlightColor)}
    </div>
  );
}

function TitleDivider({ preset, showDivider }: { preset: StylePreset; showDivider?: boolean }) {
  const visible = showDivider !== undefined ? showDivider : (preset.titleDivider !== false);
  if (!visible) return null;
  return (
    <div
      style={{
        width: 96,
        height: 4,
        background: preset.accentColor,
        opacity: 0.6,
        marginBottom: 64,
        position: "relative",
      }}
    />
  );
}

// ============================================================
// SLIDE COMPONENTS
// ============================================================

function SlideCounter({
  current,
  total,
  color,
}: {
  current: number;
  total: number;
  color: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
            opacity: i === current ? 1 : 0.3,
            transition: "all 0.2s",
          }}
        />
      ))}
    </div>
  );
}

function SlideHook({
  data,
  preset,
  index,
  total,
  bgType,
}: {
  data: SlideData;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
}) {
  const { w: CANVAS_W, h: CANVAS_H } = useCanvasSize();
  return (
    <div
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        background: preset.bgGradient || preset.bg,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        fontFamily: preset.hookFontFamily || preset.fontFamily,
        boxSizing: "border-box",
      }}
    >
      <SlideBackground bgType={bgType} slideIndex={index} preset={preset} />
      {data.badge && <Badge text={data.badge} preset={preset} />}
      <div
        style={{
          fontSize: getAdaptiveFontSize(data.text || "", "hook"),
          fontWeight: 800,
          color: preset.textColor,
          // 1.08 instead of 0.95 — tight but leaves room for italic-box highlight
          // on the next line without the colored rect clipping into prev line
          lineHeight: data.highlightStyle === "italic-box" ? 1.15 : 1.02,
          whiteSpace: "pre-line",
          letterSpacing: "-0.03em",
          position: "relative",
          textWrap: "balance" as const,
        }}
      >
        {renderWithHighlight(data.text || "", getHighlights(data), preset.highlightColor, data.highlightStyle)}
      </div>
      <SlideCounter current={index} total={total} color={preset.accentColor} />
    </div>
  );
}

function getPointsFontSize(points: Array<{ type: string; text: string }>): number {
  const count = points.length;
  const maxLen = Math.max(...points.map((p) => p.text.length));
  let byCount = 62;
  if (count >= 6) byCount = 44;
  else if (count >= 5) byCount = 48;
  else if (count >= 4) byCount = 54;
  else if (count >= 3) byCount = 58;
  let byLen = 62;
  if (maxLen > 50) byLen = 44;
  else if (maxLen > 40) byLen = 50;
  else if (maxLen > 30) byLen = 56;
  return Math.min(byCount, byLen);
}

function IconCheck({ size }: { size: number }) {
  const stroke = Math.max(1.5, size * 0.1);
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 13 9 18 20 7" />
    </svg>
  );
}

function IconCross({ size }: { size: number }) {
  const stroke = Math.max(1.5, size * 0.1);
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

function SlideBody({
  data,
  preset,
  index,
  total,
  bgType,
}: {
  data: SlideData;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
}) {
  const { w: CANVAS_W, h: CANVAS_H } = useCanvasSize();
  return (
    <div
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        background: preset.bgGradient || preset.bg,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        fontFamily: preset.fontFamily,
        boxSizing: "border-box",
      }}
    >
      <SlideBackground bgType={bgType} slideIndex={index} preset={preset} />
      {data.badge && <Badge text={data.badge} preset={preset} />}
      {data.title && (
        <>
          <SlideTitle text={data.title} preset={preset} highlights={getHighlights(data)} uppercase={data.uppercase} />
          <TitleDivider preset={preset} showDivider={data.divider} />
        </>
      )}
      {data.points ? (
        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          {data.points.map((point, i) => {
            const fontSize = getPointsFontSize(data.points!);
            const iconSize = Math.round(fontSize * 0.65);
            const isFirstMinus = point.type === "minus" && (i === 0 || data.points![i - 1].type === "plus");
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: Math.round(fontSize * 0.45),
                  marginTop: isFirstMinus ? Math.round(fontSize * 0.9) : (i === 0 ? 0 : Math.round(fontSize * 0.3)),
                }}
              >
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", color: point.type === "plus" ? "#22c55e" : preset.textSecondary }}>
                  {point.type === "plus" ? <IconCheck size={iconSize} /> : <IconCross size={iconSize} />}
                </div>
                <span style={{ fontSize, fontWeight: 600, color: point.type === "plus" ? preset.textColor : preset.textSecondary, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
                  {point.text}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            fontSize: getAdaptiveFontSize(data.text || "", "body"),
            fontWeight: preset.bodyFontWeight ?? 600,
            color: preset.bodyColor ?? preset.textColor,
            lineHeight: preset.bodyLineHeight ?? 1.2,
            whiteSpace: "pre-line",
            letterSpacing: "-0.01em",
            position: "relative",
            textWrap: "balance" as const,
          }}
        >
          {renderWithHighlight(data.text || "", getHighlights(data), preset.highlightColor, data.highlightStyle)}
        </div>
      )}
      {data.handle && (
        <div
          style={{
            fontFamily: preset.fontFamily,
            fontSize: 36,
            fontWeight: 500,
            color: preset.textSecondary,
            marginTop: 48,
            letterSpacing: "0.02em",
            position: "relative",
          }}
        >
          {data.handle}
        </div>
      )}
      <SlideCounter current={index} total={total} color={preset.accentColor} />
    </div>
  );
}

// ============================================================
// NEW SLIDE TYPES
// ============================================================

function SlideShell({
  children,
  preset,
  index,
  total,
  bgType,
  center,
}: {
  children: ReactNode;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
  center?: boolean;
}) {
  const { w: CANVAS_W, h: CANVAS_H } = useCanvasSize();
  return (
    <div
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        background: preset.bgGradient || preset.bg,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: center ? "center" : "center",
        padding: "80px",
        fontFamily: preset.fontFamily,
        boxSizing: "border-box",
      }}
    >
      <SlideBackground bgType={bgType} slideIndex={index} preset={preset} />
      {children}
      <SlideCounter current={index} total={total} color={preset.accentColor} />
    </div>
  );
}

function SlideList({
  data,
  preset,
  index,
  total,
  bgType,
}: {
  data: SlideData;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
}) {
  const items = data.items || [];
  return (
    <SlideShell preset={preset} index={index} total={total} bgType={bgType}>
      {data.badge && <Badge text={data.badge} preset={preset} />}
      {data.title && (
        <>
          <SlideTitle text={data.title} preset={preset} highlights={getHighlights(data)} uppercase={data.uppercase} />
          <TitleDivider preset={preset} showDivider={data.divider} />
        </>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 32, position: "relative" }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 28,
            }}
          >
            <div
              style={{
                fontFamily: preset.fontFamily,
                fontSize: 48,
                fontWeight: 800,
                color: preset.highlightColor,
                lineHeight: 1,
                minWidth: 80,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div
              style={{
                fontSize: 46,
                fontWeight: 600,
                color: preset.textColor,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                flex: 1,
                textWrap: "balance" as const,
              }}
            >
              {item}
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function SlideStats({
  data,
  preset,
  index,
  total,
  bgType,
}: {
  data: SlideData;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
}) {
  const stats = data.stats || [];
  return (
    <SlideShell preset={preset} index={index} total={total} bgType={bgType}>
      {data.badge && <Badge text={data.badge} preset={preset} />}
      {data.title && (
        <>
          <SlideTitle text={data.title} preset={preset} highlights={getHighlights(data)} uppercase={data.uppercase} />
          <TitleDivider preset={preset} showDivider={data.divider} />
        </>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: stats.length > 2 ? "column" : "row",
          gap: 48,
          position: "relative",
        }}
      >
        {stats.map((stat, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                fontFamily: preset.fontFamily,
                fontSize: stats.length > 2 ? 140 : 170,
                fontWeight: 900,
                color: preset.highlightColor,
                lineHeight: 0.9,
                letterSpacing: "-0.04em",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 500,
                color: preset.textSecondary,
                marginTop: 12,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function SlideQuote({
  data,
  preset,
  index,
  total,
  bgType,
}: {
  data: SlideData;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
}) {
  return (
    <SlideShell preset={preset} index={index} total={total} bgType={bgType}>
      <div
        style={{
          fontFamily: preset.fontFamily,
          fontSize: 200,
          fontWeight: 900,
          color: preset.highlightColor,
          lineHeight: 0.7,
          marginBottom: 24,
          position: "relative",
        }}
      >
        “
      </div>
      <div
        style={{
          fontSize: 62,
          fontWeight: 600,
          color: preset.textColor,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          whiteSpace: "pre-line",
          position: "relative",
          textWrap: "balance" as const,
        }}
      >
        {renderWithHighlight(data.text || "", getHighlights(data), preset.highlightColor, data.highlightStyle)}
      </div>
      {data.author && (
        <div
          style={{
            marginTop: 48,
            fontFamily: preset.fontFamily,
            fontSize: 32,
            fontWeight: 700,
            color: preset.accentColor,
            letterSpacing: "0.04em",
            position: "relative",
          }}
        >
          — {data.author}
          {data.role && (
            <span
              style={{ color: preset.textSecondary, fontWeight: 400, marginLeft: 12 }}
            >
              {data.role}
            </span>
          )}
        </div>
      )}
    </SlideShell>
  );
}

function SlideChecklist({
  data,
  preset,
  index,
  total,
  bgType,
}: {
  data: SlideData;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
}) {
  const items = data.items || [];
  return (
    <SlideShell preset={preset} index={index} total={total} bgType={bgType}>
      {data.badge && <Badge text={data.badge} preset={preset} />}
      {data.title && (
        <>
          <SlideTitle text={data.title} preset={preset} highlights={getHighlights(data)} uppercase={data.uppercase} />
          <TitleDivider preset={preset} showDivider={data.divider} />
        </>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 28, position: "relative" }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: preset.highlightColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: preset.bg,
                fontSize: 34,
                fontWeight: 900,
                fontFamily: preset.fontFamily,
              }}
            >
              ✓
            </div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 600,
                color: preset.textColor,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                flex: 1,
              }}
            >
              {item}
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function SlideProcess({
  data,
  preset,
  index,
  total,
  bgType,
}: {
  data: SlideData;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
}) {
  const steps = data.steps || [];
  return (
    <SlideShell preset={preset} index={index} total={total} bgType={bgType}>
      {data.badge && <Badge text={data.badge} preset={preset} />}
      {data.title && (
        <>
          <SlideTitle text={data.title} preset={preset} highlights={getHighlights(data)} uppercase={data.uppercase} />
          <TitleDivider preset={preset} showDivider={data.divider} />
        </>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 36, position: "relative" }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  background: preset.highlightColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: preset.bg,
                  fontFamily: preset.fontFamily,
                  fontWeight: 900,
                  fontSize: 32,
                }}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    width: 4,
                    height: 56,
                    background: preset.accentColor,
                    opacity: 0.3,
                    marginTop: 8,
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div
                style={{
                  fontFamily: preset.fontFamily,
                  fontSize: 36,
                  fontWeight: 700,
                  color: preset.accentColor,
                  letterSpacing: "0.02em",
                  marginBottom: 8,
                }}
              >
                {step.title}
              </div>
              {step.text && (
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 500,
                    color: preset.textSecondary,
                    lineHeight: 1.3,
                  }}
                >
                  {step.text}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function SlideComparison({
  data,
  preset,
  index,
  total,
  bgType,
}: {
  data: SlideData;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
}) {
  const allItems = [...(data.leftItems || []), ...(data.rightItems || [])];
  const maxItems = Math.max(data.leftItems?.length || 0, data.rightItems?.length || 0);
  const maxItemLen = Math.max(0, ...allItems.map((i) => i.length));
  let itemSize = 48;
  if (maxItems >= 5 || maxItemLen > 48) itemSize = 34;
  else if (maxItems >= 4 || maxItemLen > 36) itemSize = 40;
  else if (maxItemLen > 26) itemSize = 44;
  const labelSize = 40;

  return (
    <SlideShell preset={preset} index={index} total={total} bgType={bgType}>
      {data.title && (
        <>
          <SlideTitle text={data.title} preset={preset} highlights={getHighlights(data)} uppercase={data.uppercase} />
          <TitleDivider preset={preset} showDivider={data.divider} />
        </>
      )}
      <div style={{ display: "flex", gap: 32, position: "relative", flex: 1, alignItems: "stretch" }}>
        {[
          { label: data.leftLabel || "", items: data.leftItems || [], color: "#EF4444" },
          { label: data.rightLabel || "", items: data.rightItems || [], color: "#22C55E" },
        ].map((col, ci) => (
          <div
            key={ci}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              padding: 36,
              border: `3px solid ${col.color}`,
              borderRadius: 16,
            }}
          >
            <div
              style={{
                fontFamily: preset.fontFamily,
                fontSize: labelSize,
                fontWeight: 800,
                color: col.color,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 16,
              }}
            >
              {col.label}
            </div>
            {col.items.map((item, i) => (
              <div
                key={i}
                style={{
                  fontSize: itemSize,
                  fontWeight: 500,
                  color: preset.textColor,
                  lineHeight: 1.25,
                }}
              >
                · {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function SlideImage({
  data,
  preset,
  index,
  total,
  bgType,
}: {
  data: SlideData;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
}) {
  return (
    <SlideShell preset={preset} index={index} total={total} bgType={bgType}>
      {data.badge && <Badge text={data.badge} preset={preset} />}
      {data.title && (
        <>
          <SlideTitle text={data.title} preset={preset} highlight={data.highlight} highlightStyle={data.highlightStyle} />
          <TitleDivider preset={preset} />
        </>
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 32,
          position: "relative",
          minHeight: 0,
        }}
      >
        {data.imageSrc && (
          <img
            src={data.imageSrc}
            alt={data.imageCaption || data.title || "slide image"}
            crossOrigin="anonymous"
            style={{
              maxWidth: "100%",
              maxHeight: data.imageCaption ? "78%" : "88%",
              objectFit: "contain",
              borderRadius: 18,
              boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
              display: "block",
            }}
          />
        )}
        {data.imageCaption && (
          <div
            style={{
              fontFamily: preset.fontFamily,
              fontSize: 40,
              fontWeight: 500,
              color: preset.textSecondary,
              letterSpacing: "0.01em",
              textAlign: "center",
              lineHeight: 1.25,
              textWrap: "balance" as const,
            }}
          >
            {data.imageCaption}
          </div>
        )}
      </div>
    </SlideShell>
  );
}

function SlideEmoji({
  data,
  preset,
  index,
  total,
  bgType,
}: {
  data: SlideData;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
}) {
  return (
    <SlideShell preset={preset} index={index} total={total} bgType={bgType} center>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          position: "relative",
        }}
      >
        {data.emoji && (
          <div
            style={{
              fontSize: 360,
              lineHeight: 1,
              marginBottom: 48,
              // deliberately no fontFamily — let OS emoji font render in color
            }}
          >
            {data.emoji}
          </div>
        )}
        {data.title && (
          <div
            style={{
              fontFamily: preset.fontFamily,
              fontSize: preset.titleFontSize ?? 72,
              fontWeight: preset.titleFontWeight ?? 800,
              color: preset.titleColor ?? preset.textColor,
              textTransform: (preset.titleUppercase ?? true) ? "uppercase" : "none",
              letterSpacing: (preset.titleUppercase ?? true) ? "0.04em" : "-0.02em",
              lineHeight: 1.1,
              marginBottom: data.text ? 20 : 0,
              textWrap: "balance" as const,
            }}
          >
            {renderWithHighlight(data.title, data.highlight, preset.highlightColor, data.highlightStyle)}
          </div>
        )}
        {data.text && (
          <div
            style={{
              fontFamily: preset.fontFamily,
              fontSize: 56,
              fontWeight: 500,
              color: preset.textSecondary,
              lineHeight: 1.25,
              maxWidth: "88%",
              textWrap: "balance" as const,
              whiteSpace: "pre-line",
            }}
          >
            {data.text}
          </div>
        )}
      </div>
    </SlideShell>
  );
}

function SlideNumber({
  data,
  preset,
  index,
  total,
  bgType,
}: {
  data: SlideData;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
}) {
  const num = data.bigNumber || "";
  const size = num.length <= 2 ? 560 : num.length <= 4 ? 420 : 320;
  return (
    <SlideShell preset={preset} index={index} total={total} bgType={bgType} center>
      {data.badge && <Badge text={data.badge} preset={preset} />}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: preset.hookFontFamily || preset.fontFamily,
            fontSize: size,
            fontWeight: 900,
            color: preset.highlightColor,
            lineHeight: 0.9,
            letterSpacing: "-0.05em",
            marginBottom: 24,
          }}
        >
          {num}
        </div>
        {data.title && (
          <div
            style={{
              fontFamily: preset.fontFamily,
              fontSize: 64,
              fontWeight: 800,
              color: preset.textColor,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              textWrap: "balance" as const,
              marginBottom: data.text ? 16 : 0,
            }}
          >
            {renderWithHighlight(data.title, data.highlight, preset.highlightColor, data.highlightStyle)}
          </div>
        )}
        {data.text && (
          <div
            style={{
              fontFamily: preset.fontFamily,
              fontSize: 48,
              fontWeight: 500,
              color: preset.textSecondary,
              lineHeight: 1.25,
              whiteSpace: "pre-line",
              textWrap: "balance" as const,
            }}
          >
            {data.text}
          </div>
        )}
      </div>
    </SlideShell>
  );
}

function Slide({
  data,
  preset,
  index,
  total,
  bgType,
}: {
  data: SlideData;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
}) {
  switch (data.type) {
    case "hook":
      return <SlideHook data={data} preset={preset} index={index} total={total} bgType={bgType} />;
    case "list":
      return <SlideList data={data} preset={preset} index={index} total={total} bgType={bgType} />;
    case "stats":
      return <SlideStats data={data} preset={preset} index={index} total={total} bgType={bgType} />;
    case "quote":
      return <SlideQuote data={data} preset={preset} index={index} total={total} bgType={bgType} />;
    case "checklist":
      return <SlideChecklist data={data} preset={preset} index={index} total={total} bgType={bgType} />;
    case "process":
      return <SlideProcess data={data} preset={preset} index={index} total={total} bgType={bgType} />;
    case "comparison":
      return <SlideComparison data={data} preset={preset} index={index} total={total} bgType={bgType} />;
    case "image":
      return <SlideImage data={data} preset={preset} index={index} total={total} bgType={bgType} />;
    case "emoji":
      return <SlideEmoji data={data} preset={preset} index={index} total={total} bgType={bgType} />;
    case "number":
      return <SlideNumber data={data} preset={preset} index={index} total={total} bgType={bgType} />;
    case "body":
    case "cta":
    default:
      return <SlideBody data={data} preset={preset} index={index} total={total} bgType={bgType} />;
  }
}

// ============================================================
// PREVIEW + EXPORT
// ============================================================

function SlidePreview({
  data,
  preset,
  index,
  total,
  bgType,
}: {
  data: SlideData;
  preset: StylePreset;
  index: number;
  total: number;
  bgType: BgType;
}) {
  const { w: CANVAS_W, h: CANVAS_H } = useCanvasSize();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const parentW = entry.contentRect.width;
        setScale(parentW / CANVAS_W);
      }
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, [CANVAS_W]);

  return (
    <div
      className="slide-preview-wrapper"
      style={{
        width: "100%",
        aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
        overflow: "hidden",
        borderRadius: 12,
        position: "relative",
      }}
    >
      <div
        ref={containerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: CANVAS_W,
          height: CANVAS_H,
        }}
      >
        <Slide data={data} preset={preset} index={index} total={total} bgType={bgType} />
      </div>
    </div>
  );
}

// ============================================================
// EDIT PANEL
// ============================================================

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: "#555", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      {children}
    </div>
  );
}

function ToggleBtn({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="tb-btn" style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${on ? "#6366F1" : "#2e2e2e"}`, borderRadius: 6, color: on ? "#a5b4fc" : "#555", cursor: "pointer", padding: "5px 10px", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>
      <span style={{ width: 20, height: 12, borderRadius: 6, background: on ? "#6366F1" : "#333", position: "relative", flexShrink: 0, display: "inline-block", transition: "background 0.15s" }}>
        <span style={{ position: "absolute", top: 2, left: on ? 10 : 2, width: 8, height: 8, borderRadius: "50%", background: "#fff", transition: "left 0.15s" }} />
      </span>
      {label}
    </button>
  );
}

function HighlightTagsInput({ highlights, onChange, placeholder }: { highlights: string[]; onChange: (h: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  const add = () => {
    const w = input.trim();
    if (w && !highlights.includes(w)) onChange([...highlights, w]);
    setInput("");
  };
  return (
    <div>
      {highlights.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          {highlights.map((h, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.4)", borderRadius: 5, padding: "2px 8px", fontSize: 12, color: "#facc15" }}>
              {h}
              <button onClick={() => onChange(highlights.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "rgba(250,204,21,0.5)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
      )}
      <input
        className="ep-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        placeholder={placeholder || "word → Enter"}
      />
    </div>
  );
}

function EditPanel({
  slide,
  index,
  total,
  preset,
  bgType,
  lang,
  onChange,
  onClose,
  onExport,
}: {
  slide: SlideData;
  index: number;
  total: number;
  preset: StylePreset;
  bgType: BgType;
  lang: "en" | "ru";
  onChange: (patch: Partial<SlideData>) => void;
  onClose: () => void;
  onExport: () => void;
}) {
  const isRu = lang === "ru";
  const t = {
    slideOf: isRu ? (i: number, n: number) => `Слайд ${i}/${n}` : (i: number, n: number) => `Slide ${i}/${n}`,
    exportBtn: isRu ? "Экспорт PNG" : "Export PNG",
    typeLabel: isRu ? "Тип" : "Type",
    badge: isRu ? "Значок (badge)" : "Badge",
    highlights: isRu ? "Акценты (Enter — добавить)" : "Highlights (Enter to add)",
    uppercase: isRu ? "ALL CAPS заголовок" : "ALL CAPS title",
    divider: isRu ? "Линия под заголовком" : "Divider line",
    text: isRu ? "Текст" : "Text",
    title: isRu ? "Заголовок" : "Title",
    handle: isRu ? "Хэндл" : "Handle",
    author: isRu ? "Автор" : "Author",
    role: isRu ? "Роль / год" : "Role / year",
    items: isRu ? "Пункты (каждый с новой строки)" : "Items (one per line)",
    statsLabel: isRu ? "Статистики" : "Stats",
    statValue: isRu ? "Значение" : "Value",
    statCaption: isRu ? "Подпись" : "Label",
    addStat: isRu ? "+ Добавить" : "+ Add",
    stepsLabel: isRu ? "Шаги" : "Steps",
    stepTitle: isRu ? "Название шага" : "Step title",
    stepDesc: isRu ? "Описание (необяз.)" : "Description (optional)",
    addStep: isRu ? "+ Добавить шаг" : "+ Add step",
    pointsLabel: isRu ? "Пункты" : "Points",
    addPoint: isRu ? "+ Добавить" : "+ Add",
    leftLabel: isRu ? "Заголовок слева" : "Left label",
    leftItems: isRu ? "Пункты слева" : "Left items",
    rightLabel: isRu ? "Заголовок справа" : "Right label",
    rightItems: isRu ? "Пункты справа" : "Right items",
  };

  const removeBtnStyle: React.CSSProperties = {
    width: 24, height: 24, flexShrink: 0, border: "none", borderRadius: 4,
    background: "transparent", color: "#484848", cursor: "pointer", fontSize: 16,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
  };

  const addBtnStyle: React.CSSProperties = {
    width: "100%", background: "transparent", border: "1px dashed #2e2e2e",
    borderRadius: 6, color: "#555", cursor: "pointer", fontSize: 12,
    padding: "6px 0", marginTop: 4,
  };

  const allTypes: SlideType[] = ["hook", "body", "list", "stats", "quote", "checklist", "process", "comparison", "cta"];
  const typeLabels: Record<SlideType, string> = { hook: "hook", body: "body", list: "list", stats: "stats", quote: "quote", checklist: "check", process: "steps", comparison: "vs", cta: "cta" };

  const currentHighlights = getHighlights(slide);

  // Effective uppercase/divider: use slide override, else infer from preset
  const effectiveUppercase = slide.uppercase !== undefined ? slide.uppercase : (preset.titleUppercase ?? true);
  const effectiveDivider = slide.divider !== undefined ? slide.divider : (preset.titleDivider !== false);

  return (
    <div style={{
      width: 340, flexShrink: 0, background: "#0d0d0d",
      borderLeft: "1px solid #222", padding: "18px 18px 48px",
      position: "sticky", top: 0, height: "100vh",
      overflowY: "auto", boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14, gap: 8 }}>
        <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#bbb" }}>
          {t.slideOf(index + 1, total)}
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "1px solid #2e2e2e", borderRadius: 6, color: "#666", cursor: "pointer", width: 28, height: 28, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
      </div>

      {/* Mini preview */}
      <div style={{ marginBottom: 14, pointerEvents: "none", borderRadius: 8, overflow: "hidden" }}>
        <SlidePreview data={slide} preset={preset} index={index} total={total} bgType={bgType} />
      </div>

      {/* Type switcher */}
      <FieldGroup label={t.typeLabel}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {allTypes.map(type => (
            <button key={type} onClick={() => onChange({ type })} className="tb-btn" style={{ padding: "4px 9px", fontSize: 11, borderRadius: 5, border: slide.type === type ? "1px solid #6366F1" : "1px solid #2e2e2e", background: slide.type === type ? "#6366F118" : "transparent", color: slide.type === type ? "#a5b4fc" : "#555", cursor: "pointer", fontWeight: slide.type === type ? 700 : 400 }}>
              {typeLabels[type]}
            </button>
          ))}
        </div>
      </FieldGroup>

      {/* Style toggles (uppercase + divider) — only for slides with a title */}
      {(slide.type === "body" || slide.type === "list" || slide.type === "stats" || slide.type === "checklist" || slide.type === "process" || slide.type === "comparison") && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          <ToggleBtn on={effectiveUppercase} label={t.uppercase} onToggle={() => onChange({ uppercase: !effectiveUppercase })} />
          <ToggleBtn on={effectiveDivider} label={t.divider} onToggle={() => onChange({ divider: !effectiveDivider })} />
        </div>
      )}

      {/* Badge */}
      <FieldGroup label={t.badge}>
        <input className="ep-input" value={slide.badge || ""} onChange={e => onChange({ badge: e.target.value || undefined })} placeholder="01, TIP, NEW…" />
      </FieldGroup>

      {/* Highlights — chip input */}
      <FieldGroup label={t.highlights}>
        <HighlightTagsInput
          highlights={currentHighlights}
          onChange={h => onChange({ highlights: h.length ? h : undefined, highlight: undefined })}
          placeholder={isRu ? "слово → Enter" : "word → Enter"}
        />
      </FieldGroup>

      {/* hook */}
      {slide.type === "hook" && (
        <FieldGroup label={t.text}>
          <textarea className="ep-input" style={{ minHeight: 90, resize: "vertical" }} value={slide.text || ""} onChange={e => onChange({ text: e.target.value })} />
        </FieldGroup>
      )}

      {/* cta */}
      {slide.type === "cta" && (<>
        <FieldGroup label={t.text}>
          <textarea className="ep-input" style={{ minHeight: 80, resize: "vertical" }} value={slide.text || ""} onChange={e => onChange({ text: e.target.value })} />
        </FieldGroup>
        <FieldGroup label={t.handle}>
          <input className="ep-input" value={slide.handle || ""} onChange={e => onChange({ handle: e.target.value })} placeholder="@username" />
        </FieldGroup>
      </>)}

      {/* body */}
      {slide.type === "body" && (<>
        <FieldGroup label={t.title}>
          <input className="ep-input" value={slide.title || ""} onChange={e => onChange({ title: e.target.value })} />
        </FieldGroup>
        {slide.points ? (
          <FieldGroup label={t.pointsLabel}>
            {slide.points.map((point, pi) => (
              <div key={pi} style={{ display: "flex", gap: 5, marginBottom: 5, alignItems: "center" }}>
                <button
                  onClick={() => {
                    const np = [...slide.points!];
                    np[pi] = { ...np[pi], type: np[pi].type === "plus" ? "minus" : "plus" };
                    onChange({ points: np });
                  }}
                  style={{ width: 28, height: 28, flexShrink: 0, border: "none", borderRadius: 5, background: point.type === "plus" ? "#22c55e18" : "#ef444418", color: point.type === "plus" ? "#22c55e" : "#ef4444", cursor: "pointer", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {point.type === "plus" ? "+" : "−"}
                </button>
                <input className="ep-input" style={{ flex: 1 }} value={point.text} onChange={e => {
                  const np = [...slide.points!]; np[pi] = { ...np[pi], text: e.target.value }; onChange({ points: np });
                }} />
                <button style={removeBtnStyle} onClick={() => onChange({ points: slide.points!.filter((_, idx) => idx !== pi) })}>×</button>
              </div>
            ))}
            <button style={addBtnStyle} onClick={() => onChange({ points: [...(slide.points || []), { type: "plus", text: "" }] })}>{t.addPoint}</button>
          </FieldGroup>
        ) : (
          <FieldGroup label={t.text}>
            <textarea className="ep-input" style={{ minHeight: 100, resize: "vertical" }} value={slide.text || ""} onChange={e => onChange({ text: e.target.value })} />
          </FieldGroup>
        )}
      </>)}

      {/* quote */}
      {slide.type === "quote" && (<>
        <FieldGroup label={t.text}>
          <textarea className="ep-input" style={{ minHeight: 100, resize: "vertical" }} value={slide.text || ""} onChange={e => onChange({ text: e.target.value })} />
        </FieldGroup>
        <FieldGroup label={t.author}>
          <input className="ep-input" value={slide.author || ""} onChange={e => onChange({ author: e.target.value })} />
        </FieldGroup>
        <FieldGroup label={t.role}>
          <input className="ep-input" value={slide.role || ""} onChange={e => onChange({ role: e.target.value })} />
        </FieldGroup>
      </>)}

      {/* list / checklist */}
      {(slide.type === "list" || slide.type === "checklist") && (<>
        <FieldGroup label={t.title}>
          <input className="ep-input" value={slide.title || ""} onChange={e => onChange({ title: e.target.value })} />
        </FieldGroup>
        <FieldGroup label={t.items}>
          <textarea className="ep-input" style={{ minHeight: 120, resize: "vertical" }} value={(slide.items || []).join("\n")} onChange={e => onChange({ items: e.target.value.split("\n").filter(Boolean) })} />
        </FieldGroup>
      </>)}

      {/* stats */}
      {slide.type === "stats" && (<>
        <FieldGroup label={t.title}>
          <input className="ep-input" value={slide.title || ""} onChange={e => onChange({ title: e.target.value })} />
        </FieldGroup>
        <FieldGroup label={t.statsLabel}>
          {(slide.stats || []).map((stat, si) => (
            <div key={si} style={{ display: "flex", gap: 5, marginBottom: 5, alignItems: "center" }}>
              <input className="ep-input" style={{ width: "38%" }} value={stat.value} placeholder={t.statValue}
                onChange={e => { const ns = [...(slide.stats || [])]; ns[si] = { ...ns[si], value: e.target.value }; onChange({ stats: ns }); }} />
              <input className="ep-input" style={{ flex: 1 }} value={stat.label} placeholder={t.statCaption}
                onChange={e => { const ns = [...(slide.stats || [])]; ns[si] = { ...ns[si], label: e.target.value }; onChange({ stats: ns }); }} />
              <button style={removeBtnStyle} onClick={() => onChange({ stats: (slide.stats || []).filter((_, idx) => idx !== si) })}>×</button>
            </div>
          ))}
          <button style={addBtnStyle} onClick={() => onChange({ stats: [...(slide.stats || []), { value: "", label: "" }] })}>{t.addStat}</button>
        </FieldGroup>
      </>)}

      {/* process */}
      {slide.type === "process" && (<>
        <FieldGroup label={t.title}>
          <input className="ep-input" value={slide.title || ""} onChange={e => onChange({ title: e.target.value })} />
        </FieldGroup>
        <FieldGroup label={t.stepsLabel}>
          {(slide.steps || []).map((step, si) => (
            <div key={si} style={{ marginBottom: 8, padding: "9px 10px", background: "#161616", borderRadius: 7 }}>
              <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: "#444", fontWeight: 700, width: 18 }}>{si + 1}.</span>
                <input className="ep-input" style={{ flex: 1 }} value={step.title} placeholder={t.stepTitle}
                  onChange={e => { const ns = [...(slide.steps || [])]; ns[si] = { ...ns[si], title: e.target.value }; onChange({ steps: ns }); }} />
                <button style={removeBtnStyle} onClick={() => onChange({ steps: (slide.steps || []).filter((_, idx) => idx !== si) })}>×</button>
              </div>
              <input className="ep-input" style={{ marginLeft: 23 }} value={step.text || ""} placeholder={t.stepDesc}
                onChange={e => { const ns = [...(slide.steps || [])]; ns[si] = { ...ns[si], text: e.target.value || undefined }; onChange({ steps: ns }); }} />
            </div>
          ))}
          <button style={addBtnStyle} onClick={() => onChange({ steps: [...(slide.steps || []), { title: "" }] })}>{t.addStep}</button>
        </FieldGroup>
      </>)}

      {/* comparison */}
      {slide.type === "comparison" && (<>
        <FieldGroup label={t.title}>
          <input className="ep-input" value={slide.title || ""} onChange={e => onChange({ title: e.target.value })} />
        </FieldGroup>
        <FieldGroup label={t.leftLabel}>
          <input className="ep-input" value={slide.leftLabel || ""} onChange={e => onChange({ leftLabel: e.target.value })} />
        </FieldGroup>
        <FieldGroup label={t.leftItems}>
          <textarea className="ep-input" style={{ minHeight: 80, resize: "vertical" }} value={(slide.leftItems || []).join("\n")} onChange={e => onChange({ leftItems: e.target.value.split("\n") })} />
        </FieldGroup>
        <FieldGroup label={t.rightLabel}>
          <input className="ep-input" value={slide.rightLabel || ""} onChange={e => onChange({ rightLabel: e.target.value })} />
        </FieldGroup>
        <FieldGroup label={t.rightItems}>
          <textarea className="ep-input" style={{ minHeight: 80, resize: "vertical" }} value={(slide.rightItems || []).join("\n")} onChange={e => onChange({ rightItems: e.target.value.split("\n") })} />
        </FieldGroup>
      </>)}

      {/* Export button */}
      <button onClick={onExport} className="tb-btn" style={{ width: "100%", marginTop: 20, padding: "10px 0", background: "#6366F1", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
        {t.exportBtn}
      </button>
    </div>
  );
}

// ============================================================
// I18N
// ============================================================

type Lang = "en" | "ru";

const T = {
  en: {
    appTitle: "Threads Carousel",
    rowFont: "Font",
    rowSurface: "Surface",
    rowAccent: "Accent",
    rowBg: "Background",
    rowMode: "Mode",
    rowFormat: "Format",
    btnPdf: "Export PDF",
    btnAll: "Export All",
    statusDone: "Done!",
    statusExport: (i: number, n: number) => `Exporting ${i}/${n}...`,
    statusPdf: (i: number, n: number) => `PDF ${i}/${n}...`,
    footer: (w: number, h: number, n: number) =>
      `${w}×${h}px — ${n} slides — Click a slide to edit`,
    modes: { carousel: "Carousel", presentation: "Presentation" } as Record<PurposeId, string>,
    bgs: {
      none: "None", blobs: "Blobs", grid: "Grid", lines: "Lines",
      noise: "Noise", bignumber: "Bignumber", glow: "Glow", paper: "Ruled",
    } as Record<BgType, string>,
    surfaces: {
      dark: "Dark", white: "White", light: "Light", paper: "Paper",
      gradient: "Gradient", pastel: "Pastel", neon: "Neon", ember: "Ember",
    } as Record<SurfaceId, string>,
    accents: {
      yellow: "Yellow", red: "Red", teal: "Teal", coral: "Coral",
      orange: "Orange", violet: "Violet", lime: "Lime", blue: "Blue",
      fuchsia: "Fuchsia", pink: "Pink", amber: "Amber",
    } as Record<AccentId, string>,
  },
  ru: {
    appTitle: "Threads Carousel",
    rowFont: "Шрифт",
    rowSurface: "Фон",
    rowAccent: "Акцент",
    rowBg: "Декор",
    rowMode: "Режим",
    rowFormat: "Формат",
    btnPdf: "PDF",
    btnAll: "PNG",
    statusDone: "Готово!",
    statusExport: (i: number, n: number) => `Экспорт ${i}/${n}...`,
    statusPdf: (i: number, n: number) => `PDF ${i}/${n}...`,
    footer: (w: number, h: number, n: number) =>
      `${w}×${h}px — ${n} слайдов — Нажми на слайд для редактирования`,
    modes: { carousel: "Карусель", presentation: "Презентация" } as Record<PurposeId, string>,
    bgs: {
      none: "Нет", blobs: "Пятна", grid: "Сетка", lines: "Линии",
      noise: "Шум", bignumber: "Номер", glow: "Свечение", paper: "Линейка",
    } as Record<BgType, string>,
    surfaces: {
      dark: "Тёмный", white: "Белый", light: "Светлый", paper: "Бумага",
      gradient: "Градиент", pastel: "Пастель", neon: "Неон", ember: "Уголь",
    } as Record<SurfaceId, string>,
    accents: {
      yellow: "Жёлтый", red: "Красный", teal: "Бирюза", coral: "Коралл",
      orange: "Оранж", violet: "Фиолет", lime: "Лайм", blue: "Синий",
      fuchsia: "Фуксия", pink: "Розовый", amber: "Янтарь",
    } as Record<AccentId, string>,
  },
} as const;

// ============================================================
// MAIN PAGE
// ============================================================

export default function CarouselPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const t = T[lang];
  const [fontId, setFontId] = useState<FontId>(DEFAULT_FONT);
  const [surfaceId, setSurfaceId] = useState<SurfaceId>(DEFAULT_SURFACE);
  const [accentId, setAccentId] = useState<AccentId>(DEFAULT_ACCENT);
  const [purposeId, setPurposeId] = useState<PurposeId>(DEFAULT_PURPOSE);
  const [formatId, setFormatId] = useState<FormatId>(DEFAULT_FORMAT);
  const [bgType, setBgType] = useState<BgType>(DEFAULT_BG);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [slides, setSlides] = useState<SlideData[]>(() => [...SLIDES]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const langRef = useRef<Lang>("ru");
  langRef.current = lang;
  const slidesRef = useRef(slides);
  slidesRef.current = slides;
  const offscreenRefs = useRef<(HTMLDivElement | null)[]>([]);

  const updateSlide = useCallback((index: number, patch: Partial<SlideData>) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s));
  }, []);

  const canvasW = FORMAT_PRESETS[formatId].w;
  const canvasH = FORMAT_PRESETS[formatId].h;
  const preset = composePreset(FONT_STYLES[fontId], SURFACES[surfaceId], ACCENTS[accentId], purposeId);

  const captureSlide = useCallback(
    async (index: number): Promise<string | null> => {
      const el = offscreenRefs.current[index];
      if (!el) return null;

      el.style.opacity = "1";
      el.style.zIndex = "-1";
      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      const opts = {
        width: canvasW,
        height: canvasH,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: preset.bg,
      };

      // Double-call: first warms fonts/images, second captures
      await toPng(el, opts);
      await new Promise((r) => setTimeout(r, 120));
      const dataUrl = await toPng(el, opts);

      el.style.opacity = "0";
      el.style.zIndex = "-1";
      return dataUrl;
    },
    [preset.bg, canvasW, canvasH]
  );

  const exportSlide = useCallback(
    async (index: number) => {
      const dataUrl = await captureSlide(index);
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = `${String(index + 1).padStart(2, "0")}-${slidesRef.current[index].type}.png`;
      link.href = dataUrl;
      link.click();
    },
    [captureSlide]
  );

  const exportAll = useCallback(async () => {
    setExporting(true);
    const tl = T[langRef.current];
    const n = slidesRef.current.length;
    for (let i = 0; i < n; i++) {
      setExportStatus(tl.statusExport(i + 1, n));
      await exportSlide(i);
      await new Promise((r) => setTimeout(r, 300));
    }
    setExportStatus(tl.statusDone);
    setExporting(false);
    setTimeout(() => setExportStatus(""), 2000);
  }, [exportSlide]);

  const exportPdf = useCallback(async () => {
    setExporting(true);
    const isLandscape = canvasW > canvasH;
    const orientation = isLandscape ? "landscape" : "portrait";
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation, unit: "px", format: [canvasW, canvasH], hotfixes: ["px_scaling"] });
    const jpegOpts = { width: canvasW, height: canvasH, pixelRatio: 2, cacheBust: true, backgroundColor: preset.bg, quality: 0.92 };

    const tl = T[langRef.current];
    const n = slidesRef.current.length;
    for (let i = 0; i < n; i++) {
      setExportStatus(tl.statusPdf(i + 1, n));
      const el = offscreenRefs.current[i];
      if (!el) continue;

      el.style.opacity = "1";
      el.style.zIndex = "-1";
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await toJpeg(el, jpegOpts); // warm up
      await new Promise((r) => setTimeout(r, 120));
      const dataUrl = await toJpeg(el, jpegOpts);
      el.style.opacity = "0";
      el.style.zIndex = "-1";

      if (i > 0) pdf.addPage([canvasW, canvasH], orientation);
      pdf.addImage(dataUrl, "JPEG", 0, 0, canvasW, canvasH);
      await new Promise((r) => setTimeout(r, 200));
    }

    pdf.save("slides.pdf");
    setExportStatus(T[langRef.current].statusDone);
    setExporting(false);
    setTimeout(() => setExportStatus(""), 2000);
  }, [preset.bg, canvasW, canvasH]);

  return (
    <CanvasSizeContext.Provider value={{ w: canvasW, h: canvasH }}>
    <div suppressHydrationWarning style={{ display: "flex", minHeight: "100vh", alignItems: "flex-start" }}>
    <div style={{ flex: 1, minWidth: 0, padding: 32 }}>
      {/* Toolbar */}
      <div style={{ marginBottom: 32 }}>
        {/* Title + Export + Lang toggle */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, textWrap: "balance" } as React.CSSProperties}>{t.appTitle}</h1>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              {FORMAT_PRESETS[formatId].name} — {canvasW}×{canvasH}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {/* Lang toggle */}
            <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid #333" }}>
              {(["en", "ru"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="tb-btn"
                  style={{
                    padding: "9px 12px",
                    minHeight: 36,
                    border: "none",
                    background: lang === l ? "#555" : "transparent",
                    color: lang === l ? "#fff" : "#888",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <button onClick={exportPdf} disabled={exporting} style={{ padding: "8px 20px", minWidth: 120, minHeight: 36, borderRadius: 8, border: "none", background: exporting ? "#444" : "#6366F1", color: "#fff", cursor: exporting ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }} className="tb-btn">
              {exporting ? exportStatus : t.btnPdf}
            </button>
            <button onClick={exportAll} disabled={exporting} style={{ padding: "8px 20px", minWidth: 110, minHeight: 36, borderRadius: 8, border: "none", background: exporting ? "#444" : "#22C55E", color: "#fff", cursor: exporting ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }} className="tb-btn">
              {exporting ? exportStatus : t.btnAll}
            </button>
          </div>
        </div>

        {/* 5-row axis toolbar — order: Format → Mode → Font → Color → Background */}
        {/* key={lang} causes remount → tbFadeIn animation plays on language switch */}
        <div key={lang} className="tb-lang-fade" style={{ display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Format */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#666", width: 90, flexShrink: 0 }}>{t.rowFormat}</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.values(FORMAT_PRESETS).map((f) => (
                <button key={f.id} onClick={() => setFormatId(f.id)} title={f.platform} style={{ padding: "9px 14px", minHeight: 36, borderRadius: 8, border: formatId === f.id ? "2px solid #06B6D4" : "1px solid #333", background: formatId === f.id ? "#06B6D4" : "transparent", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500 }} className="tb-btn">
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#666", width: 90, flexShrink: 0 }}>{t.rowMode}</span>
            <div style={{ display: "flex", gap: 6 }}>
              {(["carousel", "presentation"] as PurposeId[]).map((p) => (
                <button key={p} onClick={() => setPurposeId(p)} style={{ padding: "9px 14px", minWidth: 110, minHeight: 36, borderRadius: 8, border: purposeId === p ? "2px solid #F59E0B" : "1px solid #333", background: purposeId === p ? "#F59E0B" : "transparent", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500 }} className="tb-btn">
                  {t.modes[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#666", width: 90, flexShrink: 0 }}>{t.rowFont}</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.values(FONT_STYLES).map((f) => (
                <button key={f.id} onClick={() => setFontId(f.id)} style={{ padding: "9px 14px", minHeight: 36, borderRadius: 8, border: fontId === f.id ? "2px solid #6366F1" : "1px solid #333", background: fontId === f.id ? "#6366F1" : "transparent", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: f.fontFamily }} className="tb-btn">
                  {f.displayName}
                </button>
              ))}
            </div>
          </div>

          {/* Surface (bg + text) */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#666", width: 90, flexShrink: 0 }}>{t.rowSurface}</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.values(SURFACES).map((s) => (
                <button key={s.id} onClick={() => setSurfaceId(s.id)} style={{ padding: "9px 14px", minHeight: 36, borderRadius: 8, border: surfaceId === s.id ? "2px solid #6366F1" : "1px solid #333", background: surfaceId === s.id ? "#6366F1" : "transparent", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500 }} className="tb-btn">
                  {t.surfaces[s.id]}
                </button>
              ))}
            </div>
          </div>

          {/* Accent (pop color) */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#666", width: 90, flexShrink: 0 }}>{t.rowAccent}</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.values(ACCENTS).map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccentId(a.id)}
                  title={t.accents[a.id]}
                  style={{
                    padding: "9px 14px",
                    minHeight: 36,
                    borderRadius: 8,
                    border: accentId === a.id ? `2px solid ${a.color}` : "1px solid #333",
                    background: accentId === a.id ? a.color : "transparent",
                    color: accentId === a.id ? "#000" : "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  className="tb-btn"
                >
                  {t.accents[a.id]}
                </button>
              ))}
            </div>
          </div>

          {/* Background */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#666", width: 90, flexShrink: 0 }}>{t.rowBg}</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["none", "blobs", "grid", "lines", "paper", "noise", "bignumber", "glow"] as BgType[]).map((bg) => (
                <button key={bg} onClick={() => setBgType(bg)} style={{ padding: "9px 12px", minHeight: 36, borderRadius: 8, border: bgType === bg ? "2px solid #22C55E" : "1px solid #333", background: bgType === bg ? "#22C55E" : "transparent", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500 }} className="tb-btn">
                  {t.bgs[bg]}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Preview Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 20,
        }}
      >
        {slides.map((slide, i) => (
          <div key={i}>
            <div
              onClick={() => !exporting && setEditingIndex(editingIndex === i ? null : i)}
              className={`slide-card${editingIndex === i ? " slide-card--active" : ""}`}
              title={editingIndex === i ? undefined : (lang === "ru" ? "Нажмите для редактирования" : "Click to edit")}
              style={{ position: "relative" }}
            >
              <SlidePreview
                data={slide}
                preset={preset}
                index={i}
                total={slides.length}
                bgType={bgType}
              />
              <div className="slide-edit-overlay">
                <span style={{ fontSize: 15 }}>✏</span>
                <span>{lang === "ru" ? "Редактировать" : "Edit"}</span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12,
                color: "#888",
                marginTop: 8,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span>{i + 1}/{slides.length} — {slide.type}</span>
              <button
                onClick={() => !exporting && exportSlide(i)}
                className="tb-btn"
                title={lang === "ru" ? "Экспорт PNG" : "Export PNG"}
                style={{ background: "transparent", border: "1px solid #2a2a2a", borderRadius: 5, color: "#555", cursor: "pointer", fontSize: 11, padding: "2px 7px", lineHeight: 1.6 }}
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Offscreen slides for export — always rendered at (0,0), invisible via opacity */}
      {slides.map((slide, i) => (
        <div
          key={`export-${i}`}
          ref={(el) => {
            offscreenRefs.current[i] = el;
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: canvasW,
            height: canvasH,
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
            fontFamily: preset.fontFamily,
          }}
        >
          <Slide data={slide} preset={preset} index={i} total={slides.length} bgType={bgType} />
        </div>
      ))}

      {/* Info */}
      <div
        style={{
          marginTop: 32,
          fontSize: 13,
          color: "#666",
          textAlign: "center",
        }}
      >
        {t.footer(canvasW, canvasH, slides.length)}
      </div>
    </div>

    {/* Edit Panel */}
    {editingIndex !== null && editingIndex < slides.length && (
      <EditPanel
        slide={slides[editingIndex]}
        index={editingIndex}
        total={slides.length}
        preset={preset}
        bgType={bgType}
        lang={lang}
        onChange={(patch) => updateSlide(editingIndex, patch)}
        onClose={() => setEditingIndex(null)}
        onExport={() => exportSlide(editingIndex)}
      />
    )}
    </div>
    </CanvasSizeContext.Provider>
  );
}
