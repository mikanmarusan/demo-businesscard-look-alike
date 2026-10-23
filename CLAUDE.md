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
- (2026-10-22) `eslint-config-next` was removed and replaced by a hand-rolled flat config in `eslint.config.mjs` (plugins: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `typescript-eslint`) because `@next/eslint-plugin-next` depends on `fast-glob` → `micromatch` → `braces`, and `braces` has a high-severity advisory (GHSA-vfj7-8cjw-p6xm, stack-exhaustion DoS) with no upstream fix in any published version, including `eslint-config-next`'s latest `16.4.2` (verified by actually installing it and re-running `npm audit`). The replacement config's rule set was copied from `eslint-config-next`'s actual source rather than each plugin's own "recommended" preset — the Next.js config enables only 6 specific `jsx-a11y` rules at `warn` (`alt-text`, `aria-props`, `aria-proptypes`, `aria-unsupported-elements`, `role-has-required-aria-props`, `role-supports-aria-props`), not the plugin's full recommended set. There is no more Next.js-specific lint coverage (`no-img-element`, `no-html-link-for-pages`, etc.) — the stale `eslint-disable-next-line @next/next/no-img-element` comment in `src/components/ImageUploader.tsx` was removed since that rule no longer exists. If `braces` ships an upstream fix, prefer reverting to `eslint-config-next` over maintaining this by hand.
- (2026-10-22) Re-confirmed, on a fresh branch cut from `main`, that three devDependency majors remain blocked from the same findings recorded 2026-10-22 on a since-abandoned branch: `eslint` stays `^9` (`eslint-plugin-react@7.37.5` still calls the removed `context.getFilename()` under ESLint 10), `typescript` stays `^5` (`typescript-eslint@8.72.0` still refuses to load against TypeScript 7.0, typescript-eslint#10940), and `tesseract.js` stays `^5.1.1` (6.x/7.x still drop `Page.lines`, which `src/app/page.tsx` reads directly). Re-attempt each independently next time dependencies are swept.
