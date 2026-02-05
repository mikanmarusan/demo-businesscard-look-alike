"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import ImageUploader from "@/components/ImageUploader";
import OcrProgress from "@/components/OcrProgress";
import { recognizeCard } from "@/lib/ocr";
import {
  sampleTextAndBgColor,
  getImageDataFromImage,
} from "@/lib/colorSampler";
import { DetectedText, AppStep } from "@/lib/types";

const CardEditor = dynamic(() => import("@/components/CardEditor"), {
  ssr: false,
});

const STEPS = [
  { key: "upload", label: "Upload" },
  { key: "processing", label: "Recognize" },
  { key: "editor", label: "Edit" },
] as const;

export default function Home() {
  const [step, setStep] = useState<AppStep>("upload");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [detectedTexts, setDetectedTexts] = useState<DetectedText[]>([]);

  const processImage = useCallback(async (dataUrl: string) => {
    setImageUrl(dataUrl);
    setStep("processing");
    setProgress(0);

    try {
      const data = await recognizeCard(dataUrl, (p) => setProgress(p));

      const img = await loadImage(dataUrl);
      const imageData = getImageDataFromImage(img);

      const texts: DetectedText[] = (data.lines || [])
        .filter((line) => line.text.trim().length > 0)
        .map((line, i) => {
          const bbox = {
            x0: line.bbox.x0,
            y0: line.bbox.y0,
            x1: line.bbox.x1,
            y1: line.bbox.y1,
          };

          const { textColor, bgColor } = sampleTextAndBgColor(
            imageData,
            bbox
          );

          const fontSize = (bbox.y1 - bbox.y0) * 0.85;

          return {
            id: `text-${i}`,
            text: line.text.trim(),
            bbox,
            fontSize,
            textColor,
            bgColor,
            fontFamily: "sans-serif",
            confidence: line.confidence,
          };
        });

      setDetectedTexts(texts);
      setStep("editor");
    } catch (err) {
      console.error("OCR failed:", err);
      setStep("upload");
    }
  }, []);

  const handleReset = useCallback(() => {
    setStep("upload");
    setImageUrl("");
    setDetectedTexts([]);
    setProgress(0);
  }, []);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-sand-200 bg-sand-50/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="#faf9f7" strokeWidth="1.5" />
                <path d="M5 6h6M5 8h4M5 10h5" stroke="#faf9f7" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-lg leading-none tracking-tight text-ink">
                Card to SVG
              </h1>
              <p className="text-[11px] text-sand-500 mt-0.5 tracking-wide uppercase font-medium">
                Text Extractor
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <nav className="hidden sm:flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center">
                {i > 0 && (
                  <div
                    className={`w-8 h-px mx-1 transition-colors duration-500 ${
                      i <= stepIndex ? "bg-accent" : "bg-sand-200"
                    }`}
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center transition-all duration-500 ${
                      i < stepIndex
                        ? "bg-accent text-white"
                        : i === stepIndex
                          ? "bg-ink text-sand-50"
                          : "bg-sand-200 text-sand-400"
                    }`}
                  >
                    {i < stepIndex ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2.5 5L4.5 7L7.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors duration-500 ${
                      i <= stepIndex ? "text-ink" : "text-sand-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6">
        {step === "upload" && (
          <div className="py-16 md:py-24 animate-fade-up">
            <div className="max-w-xl mx-auto text-center mb-10">
              <h2 className="font-display text-3xl md:text-4xl text-ink tracking-tight">
                Upload your business card
              </h2>
              <p className="text-sand-500 mt-3 text-[15px] leading-relaxed">
                We&apos;ll extract the text using OCR, then let you edit each
                element and export as a clean SVG.
              </p>
            </div>
            <ImageUploader onImageLoaded={processImage} />
          </div>
        )}

        {step === "processing" && (
          <div className="py-24 md:py-32 animate-fade-up">
            <OcrProgress progress={progress} />
          </div>
        )}

        {step === "editor" && (
          <div className="py-6 animate-fade-up">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-sand-500">
                Click any text on the canvas to edit it
              </p>
              <button
                onClick={handleReset}
                className="text-xs text-sand-400 hover:text-accent transition-colors flex items-center gap-1 group"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform group-hover:-rotate-45">
                  <path d="M1.5 6.5a4.5 4.5 0 1 1 1.1 2.95" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M1.5 3.5v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Start over
              </button>
            </div>
            <CardEditor imageUrl={imageUrl} detectedTexts={detectedTexts} />
          </div>
        )}
      </div>
    </main>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
