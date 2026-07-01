// Headless behavior-parity check for the live text-color extraction path.
// Compiles src/lib/colorSampler.ts in isolation, feeds it a fixed synthetic
// ImageData (no browser / no OCR), and asserts the extracted textColor is
// byte-stable. This is the invariant the dead-code removal must not disturb.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tscBin = require.resolve("typescript/bin/tsc"); // the project's own tsc

// Anchor paths to this script's location so the harness works from any cwd.
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcFile = join(projectRoot, "src/lib/colorSampler.ts");
const out = mkdtempSync(join(tmpdir(), "verify-colors-"));

let textColor;
try {
  // Compile only colorSampler.ts (DOM lib for ImageData; skipLibCheck for speed).
  // --rootDir pins the emitted path to <out>/colorSampler.js.
  execFileSync(process.execPath, [tscBin, srcFile,
    "--outDir", out, "--rootDir", dirname(srcFile),
    "--lib", "es2020,dom", "--target", "es2020",
    "--module", "es2020", "--moduleResolution", "node", "--skipLibCheck"],
    { stdio: "inherit" });

  const { sampleTextAndBgColor } = await import(
    pathToFileURL(join(out, "colorSampler.js")).href
  );

  // Fixed synthetic card: 60x40, light-gray bg, dark vertical text strokes.
  const W = 60, H = 40;
  const data = new Uint8ClampedArray(W * H * 4);
  const set = (x, y, r, g, b) => {
    const i = (y * W + x) * 4;
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const isTextStroke = y >= 12 && y < 28 && x >= 8 && x < 52 && x % 3 === 0;
      const v = isTextStroke ? 20 : 235; // dark stroke vs light background
      set(x, y, v, v, v);
    }
  }

  ({ textColor } = sampleTextAndBgColor(
    { width: W, height: H, data },
    { x0: 8, y0: 12, x1: 52, y1: 28 }
  ));
} finally {
  // Clean up the compiled artifact on both the PASS and FAIL paths.
  rmSync(out, { recursive: true, force: true });
}

const EXPECTED = "#141414";
if (textColor !== EXPECTED) {
  console.error(`FAIL: textColor=${textColor}, expected ${EXPECTED}`);
  process.exit(1);
}
console.log(`PASS: text-color extraction stable (textColor=${textColor})`);
