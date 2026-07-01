# demo-businesscard-look-alike

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Verification

This project is verified autonomously, with no browser or manual step. Run the full gate with:

```bash
npm run verify
```

which runs, in order:

- `npm run build` — production build (`next build`)
- `npm run lint` — ESLint
- `tsc --noEmit` — TypeScript type check
- `npm run verify:colors` — a headless behavior-parity check that compiles `src/lib/colorSampler.ts` in isolation, feeds it a fixed synthetic `ImageData` (no DOM, no OCR), and asserts the extracted `textColor` is byte-stable at `#141414`

The `verify:colors` check is the parity gate for the dead-code removal batch (#4-#7): because the removed fields (`DetectedText.confidence`, `DetectedText.bgColor`) and helpers (`sampleCardBackgroundColor`, the `bgColor` half of `sampleTextAndBgColor`) never fed the live text-color path, that path stays byte-for-byte identical, proving the removal introduced zero observable behavior change.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
