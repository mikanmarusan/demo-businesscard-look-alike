interface Bbox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface TesseractWord {
  is_bold?: boolean;
  is_serif?: boolean;
  is_monospace?: boolean;
}

/**
 * Estimate the CSS font size that makes `text` rendered in the given font
 * fill `bbox` width as closely as possible.
 *
 * For short texts (< 3 chars), falls back to height-based estimation
 * using Canvas font metrics (ascent + descent).
 */
export function estimateFontSize(
  text: string,
  bbox: Bbox,
  fontFamily: string,
  fontWeight: string
): number {
  const bboxWidth = bbox.x1 - bbox.x0;
  const bboxHeight = bbox.y1 - bbox.y0;

  if (bboxHeight <= 0) return 16;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return bboxHeight * 0.85;

  const trimmed = text.trim();
  if (trimmed.length === 0) return bboxHeight * 0.85;

  let estimatedSize: number;

  if (trimmed.length >= 3 && bboxWidth > 0) {
    estimatedSize = fitByWidth(ctx, trimmed, bboxWidth, fontFamily, fontWeight);
  } else {
    estimatedSize = fitByHeight(ctx, trimmed, bboxHeight, fontFamily, fontWeight);
  }

  // Sanity check: clamp to 0.4x–1.5x of bbox height
  const minSize = bboxHeight * 0.4;
  const maxSize = bboxHeight * 1.5;
  return Math.max(minSize, Math.min(maxSize, estimatedSize));
}

/**
 * Binary search for the font size whose measureText width matches bboxWidth.
 */
function fitByWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  targetWidth: number,
  fontFamily: string,
  fontWeight: string
): number {
  let lo = 1;
  let hi = 200;

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    ctx.font = `${fontWeight} ${mid}px ${fontFamily}`;
    const measured = ctx.measureText(text).width;

    if (measured < targetWidth) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return (lo + hi) / 2;
}

/**
 * Height-based fallback for short texts: use Canvas font metrics
 * (actualBoundingBoxAscent + actualBoundingBoxDescent) to proportionally
 * estimate the font size.
 */
function fitByHeight(
  ctx: CanvasRenderingContext2D,
  text: string,
  targetHeight: number,
  fontFamily: string,
  fontWeight: string
): number {
  const probeSize = 100;
  ctx.font = `${fontWeight} ${probeSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  const renderedHeight =
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  if (renderedHeight <= 0) return targetHeight * 0.85;

  return (targetHeight / renderedHeight) * probeSize;
}

/**
 * Infer font family from Tesseract word-level hints using majority vote.
 */
export function inferFontFamily(words: TesseractWord[]): string {
  if (!words || words.length === 0) return "Noto Sans JP";

  let monospace = 0;
  let serif = 0;
  let sansSerif = 0;

  for (const w of words) {
    if (w.is_monospace) {
      monospace++;
    } else if (w.is_serif) {
      serif++;
    } else {
      sansSerif++;
    }
  }

  if (monospace >= serif && monospace >= sansSerif) return "monospace";
  if (serif > sansSerif) return "Noto Serif JP";
  return "Noto Sans JP";
}

/**
 * Infer font weight from Tesseract word-level `is_bold` hints using majority vote.
 */
export function inferFontWeight(words: TesseractWord[]): string {
  if (!words || words.length === 0) return "normal";

  let boldCount = 0;
  for (const w of words) {
    if (w.is_bold) boldCount++;
  }

  return boldCount > words.length / 2 ? "bold" : "normal";
}
