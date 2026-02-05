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
