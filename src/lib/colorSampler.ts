interface RGB {
  r: number;
  g: number;
  b: number;
}

interface LAB {
  l: number;
  a: number;
  b: number;
}

// --- sRGB <-> Linear RGB ---

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

// --- RGB -> XYZ (D65) -> CIELAB ---

function rgbToLab(rgb: RGB): LAB {
  const lr = srgbToLinear(rgb.r);
  const lg = srgbToLinear(rgb.g);
  const lb = srgbToLinear(rgb.b);

  // sRGB -> XYZ (D65 reference white)
  let x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / 0.95047;
  let y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb; // D65 Yn=1.0
  let z = (0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb) / 1.08883;

  const f = (t: number) =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

  x = f(x);
  y = f(y);
  z = f(z);

  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
}

// --- CIE76 Delta-E ---

function deltaE(lab1: LAB, lab2: LAB): number {
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

// --- Utility ---

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

// --- Medoid (representative real pixel) ---

function medoidColor(colors: RGB[]): RGB {
  if (colors.length === 0) return { r: 255, g: 255, b: 255 };
  if (colors.length === 1) return colors[0];

  // Subsample for performance (O(n^2))
  const maxSamples = 200;
  let samples = colors;
  if (colors.length > maxSamples) {
    const step = colors.length / maxSamples;
    samples = [];
    for (let i = 0; i < maxSamples; i++) {
      samples.push(colors[Math.floor(i * step)]);
    }
  }

  const labs = samples.map(rgbToLab);

  let bestIdx = 0;
  let bestSum = Infinity;
  for (let i = 0; i < labs.length; i++) {
    let sum = 0;
    for (let j = 0; j < labs.length; j++) {
      if (i !== j) sum += deltaE(labs[i], labs[j]);
    }
    if (sum < bestSum) {
      bestSum = sum;
      bestIdx = i;
    }
  }

  return samples[bestIdx];
}

// --- Border color sampling (returns RGB for LAB comparison) ---

function sampleBorderColor(
  imageData: ImageData,
  bbox: { x0: number; y0: number; x1: number; y1: number }
): RGB | null {
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
  return medoidColor(colors);
}

// --- Main: Background-First text/bg color extraction ---

/**
 * Sample pixels inside a bbox and determine text color and background color.
 * Uses a Background-First approach:
 * 1. Determine background color from border pixels
 * 2. Classify pixels by Delta-E distance in CIELAB space
 * 3. Use medoid for representative colors (no phantom colors)
 */
export function sampleTextAndBgColor(
  imageData: ImageData,
  bbox: { x0: number; y0: number; x1: number; y1: number }
): { textColor: string; bgColor: string } {
  const { width, height, data } = imageData;

  // Phase 1: Determine background color from border pixels
  const borderBg = sampleBorderColor(imageData, bbox);
  if (!borderBg) {
    return { textColor: "#000000", bgColor: "#ffffff" };
  }
  const borderBgLab = rgbToLab(borderBg);

  // Phase 2: Sample pixels inside the bbox
  const step = 2;
  const bgCluster: RGB[] = [];
  const textCluster: RGB[] = [];
  // Delta-E < 20 is "small perceived difference" in CIE76; text on business
  // cards typically has Delta-E > 40 against the background.
  const DELTA_E_THRESHOLD = 20;

  let farthestPixel: RGB | null = null;
  let farthestDist = 0;

  for (
    let y = Math.max(0, bbox.y0);
    y < Math.min(height, bbox.y1);
    y += step
  ) {
    for (
      let x = Math.max(0, bbox.x0);
      x < Math.min(width, bbox.x1);
      x += step
    ) {
      const px = getPixel(data, width, x, y);
      const pxLab = rgbToLab(px);
      const dist = deltaE(borderBgLab, pxLab);

      // Phase 3: Classify by Delta-E distance
      if (dist < DELTA_E_THRESHOLD) {
        bgCluster.push(px);
      } else {
        textCluster.push(px);
      }

      // Track the farthest pixel for fallback
      if (dist > farthestDist) {
        farthestDist = dist;
        farthestPixel = px;
      }
    }
  }

  // Phase 4: Determine representative colors
  const bgColor = rgbToHex(bgCluster.length > 0 ? medoidColor(bgCluster) : borderBg);

  let textColor: string;
  if (textCluster.length >= 3) {
    textColor = rgbToHex(medoidColor(textCluster));
  } else if (farthestPixel && farthestDist > 0) {
    // Too few text pixels — use the single farthest pixel
    textColor = rgbToHex(farthestPixel);
  } else {
    // No distinguishable text — fallback based on background luminance
    textColor = luminance(borderBg) > 128 ? "#000000" : "#ffffff";
  }

  return { textColor, bgColor };
}

/**
 * Sample a single representative background color for the entire card.
 * 1. Grid-sample from the inner 90% of the image (exclude scan borders)
 * 2. Exclude points inside text bboxes
 * 3. Find the medoid to identify the background cluster center
 * 4. Average only pixels within Delta-E 15 of the medoid (reject outliers)
 * This two-pass approach produces a smooth color that blends with JPEG noise.
 */
export function sampleCardBackgroundColor(
  imageData: ImageData,
  textBboxes: { x0: number; y0: number; x1: number; y1: number }[]
): string {
  const { width, height, data } = imageData;

  // Exclude outer 5% to avoid scan/camera borders
  const marginX = Math.floor(width * 0.05);
  const marginY = Math.floor(height * 0.05);
  const innerW = width - marginX * 2;
  const innerH = height - marginY * 2;

  const gridSize = 25;
  const colors: RGB[] = [];

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const x = marginX + Math.floor(((gx + 0.5) / gridSize) * innerW);
      const y = marginY + Math.floor(((gy + 0.5) / gridSize) * innerH);

      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      // Skip points inside any text bbox
      const insideBbox = textBboxes.some(
        (b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1
      );
      if (insideBbox) continue;

      colors.push(getPixel(data, width, x, y));
    }
  }

  if (colors.length === 0) {
    return "#ffffff";
  }

  // Pass 1: find the medoid (cluster center of the background)
  const center = medoidColor(colors);
  const centerLab = rgbToLab(center);

  // Pass 2: average only pixels close to the medoid (Delta-E < 15)
  const OUTLIER_THRESHOLD = 15;
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (const c of colors) {
    if (deltaE(centerLab, rgbToLab(c)) < OUTLIER_THRESHOLD) {
      rSum += c.r;
      gSum += c.g;
      bSum += c.b;
      count++;
    }
  }

  if (count === 0) {
    return rgbToHex(center);
  }

  return rgbToHex({
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
  });
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
