interface RGB {
  r: number;
  g: number;
  b: number;
}

function luminance(c: RGB): number {
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
}

function rgbToHex(c: RGB): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}

function getPixel(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number
): RGB {
  const i = (y * width + x) * 4;
  return { r: data[i], g: data[i + 1], b: data[i + 2] };
}

function medianColor(colors: RGB[]): RGB {
  if (colors.length === 0) return { r: 255, g: 255, b: 255 };
  const sorted = (arr: number[]) => [...arr].sort((a, b) => a - b);
  const rs = sorted(colors.map((c) => c.r));
  const gs = sorted(colors.map((c) => c.g));
  const bs = sorted(colors.map((c) => c.b));
  const mid = Math.floor(colors.length / 2);
  return { r: rs[mid], g: gs[mid], b: bs[mid] };
}

/**
 * Sample pixels inside a bbox and determine text color and background color.
 * Text color = darker cluster, background color = lighter cluster.
 */
export function sampleTextAndBgColor(
  imageData: ImageData,
  bbox: { x0: number; y0: number; x1: number; y1: number }
): { textColor: string; bgColor: string } {
  const { width } = imageData;
  const { data } = imageData;

  // Sample pixels inside the bbox
  const pixels: RGB[] = [];
  const step = 2; // sample every 2 pixels for performance
  for (
    let y = Math.max(0, bbox.y0);
    y < Math.min(imageData.height, bbox.y1);
    y += step
  ) {
    for (
      let x = Math.max(0, bbox.x0);
      x < Math.min(width, bbox.x1);
      x += step
    ) {
      pixels.push(getPixel(data, width, x, y));
    }
  }

  if (pixels.length === 0) {
    return { textColor: "#000000", bgColor: "#ffffff" };
  }

  // Simple 2-cluster split: separate into dark and light pixels
  const avgLum =
    pixels.reduce((sum, c) => sum + luminance(c), 0) / pixels.length;

  const dark: RGB[] = [];
  const light: RGB[] = [];
  for (const p of pixels) {
    if (luminance(p) < avgLum) {
      dark.push(p);
    } else {
      light.push(p);
    }
  }

  const textColor =
    dark.length > 0 ? rgbToHex(medianColor(dark)) : "#000000";
  const bgColorInner =
    light.length > 0 ? rgbToHex(medianColor(light)) : "#ffffff";

  // Also sample the border of the bbox for background color
  const bgColor = sampleBorderColor(imageData, bbox) || bgColorInner;

  return { textColor, bgColor };
}

/**
 * Sample pixels along the outer border of a bbox to determine background color.
 */
function sampleBorderColor(
  imageData: ImageData,
  bbox: { x0: number; y0: number; x1: number; y1: number }
): string | null {
  const { width, height, data } = imageData;
  const margin = 2;
  const colors: RGB[] = [];

  // Top edge
  const topY = Math.max(0, bbox.y0 - margin);
  for (let x = Math.max(0, bbox.x0); x < Math.min(width, bbox.x1); x += 2) {
    colors.push(getPixel(data, width, x, topY));
  }

  // Bottom edge
  const botY = Math.min(height - 1, bbox.y1 + margin);
  for (let x = Math.max(0, bbox.x0); x < Math.min(width, bbox.x1); x += 2) {
    colors.push(getPixel(data, width, x, botY));
  }

  // Left edge
  const leftX = Math.max(0, bbox.x0 - margin);
  for (let y = Math.max(0, bbox.y0); y < Math.min(height, bbox.y1); y += 2) {
    colors.push(getPixel(data, width, leftX, y));
  }

  // Right edge
  const rightX = Math.min(width - 1, bbox.x1 + margin);
  for (let y = Math.max(0, bbox.y0); y < Math.min(height, bbox.y1); y += 2) {
    colors.push(getPixel(data, width, rightX, y));
  }

  if (colors.length === 0) return null;
  return rgbToHex(medianColor(colors));
}

/**
 * Get ImageData from a loaded image element using canvas.
 */
export function getImageDataFromImage(img: HTMLImageElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to obtain 2D canvas context");
  }
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
