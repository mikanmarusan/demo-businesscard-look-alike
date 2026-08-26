# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**look-alike** — Business card image → editable SVG converter demo.
Upload a business card JPG, extract text via Tesseract.js OCR, and edit text elements on a Fabric.js canvas. Export as SVG.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **OCR**: Tesseract.js v5 (browser-only, eng+jpn)
- **Editor**: Fabric.js v6 (canvas-based interactive text editing)
- **Fonts**: Google Fonts (Noto Sans JP, Noto Serif JP)
- **Styling**: Tailwind CSS v4

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — ESLint

## Architecture

Single-page app with 3-step flow: Upload → OCR Processing → Editor.
All processing is client-side (no server API needed).

### Key files

- `src/app/page.tsx` — Main page orchestrating the 3-step flow
- `src/components/CardEditor.tsx` — Fabric.js canvas editor (dynamic import, ssr:false)
- `src/components/TextPropertyPanel.tsx` — Text property editing sidebar
- `src/components/ImageUploader.tsx` — Drag & drop file upload
- `src/components/OcrProgress.tsx` — OCR progress bar
- `src/lib/ocr.ts` — Tesseract.js wrapper
- `src/lib/colorSampler.ts` — Background/text color sampling via Canvas API
- `src/lib/types.ts` — TypeScript type definitions

## Lessons

- Node helper/verification scripts must be robust: anchor file paths to the script's own location (`fileURLToPath(import.meta.url)`) so they run from any cwd, pin `tsc` emit with `--rootDir`, and clean up `mkdtemp` dirs in a `try/finally` (defer `process.exit` until after it). Resolve the project's own `tsc` via `require.resolve("typescript/bin/tsc")`, never `npx tsc`.
- Keep new scripts eslint-clean: use `if/else`, not expression-statement ternaries (`cond ? a() : b();`), which trip `no-unused-expressions`.
- When removing a field or return value, also remove its now-orphaned producers (arrays populated only to compute it, upstream accumulation loops). A write-only array mutated via `.push()` is not flagged by eslint `no-unused-vars`, so it survives as silent dead code; trace and delete the whole cascade.
- Before committing a fix, check whether running the production build regenerated an auto-generated declaration file (for example the Next.js type-reference file) to match a locally installed dependency version that differs from the version pinned in package.json. Revert any such drifted file so only the intended source change remains in the diff.
- When an acceptance criterion checks an exact literal count of some identifier or string (via a line-counting search), keep explanatory comments near that code from repeating the same literal text — an added comment line can silently push a line-count check past its expected exact value even though the underlying logic is unchanged.
