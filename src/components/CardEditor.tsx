"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import { DetectedText } from "@/lib/types";
import TextPropertyPanel from "./TextPropertyPanel";

interface TextProperties {
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  fontWeight: string;
}

interface Props {
  imageUrl: string;
  detectedTexts: DetectedText[];
}

const INPAINT_MARGIN = 4;

const ALLOWED_FONTS = new Set([
  "Noto Sans JP",
  "Noto Serif JP",
  "sans-serif",
  "serif",
  "monospace",
]);

function isValidCssColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export default function CardEditor({ imageUrl, detectedTexts }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedProps, setSelectedProps] = useState<TextProperties | null>(
    null
  );
  const [scale, setScale] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const updateSelectedProps = useCallback((canvas: fabric.Canvas) => {
    const active = canvas.getActiveObject();
    if (active && active instanceof fabric.IText) {
      setSelectedProps({
        text: active.text || "",
        fontFamily: active.fontFamily || "sans-serif",
        fontSize: active.fontSize || 16,
        fill: (active.fill as string) || "#000000",
        fontWeight: (active.fontWeight as string) || "normal",
      });
    } else {
      setSelectedProps(null);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    let cancelled = false;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled || !canvasRef.current) return;

      // Dispose any existing Fabric canvas before creating a new one
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: img.naturalWidth,
        height: img.naturalHeight,
        selection: true,
      });
      fabricRef.current = canvas;

      const containerWidth = containerRef.current?.clientWidth || 800;
      const s = Math.min(1, (containerWidth - 16) / img.naturalWidth);
      setScale(s);
      setCanvasSize({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });

      // Create cleaned background: original image with text areas inpainted
      const offscreen = document.createElement("canvas");
      offscreen.width = img.naturalWidth;
      offscreen.height = img.naturalHeight;
      const offCtx = offscreen.getContext("2d")!;
      offCtx.drawImage(img, 0, 0);

      // Inpaint each text bbox by stretching a nearby background strip
      const stripH = 2;
      detectedTexts.forEach((dt) => {
        const x = Math.max(0, dt.bbox.x0 - INPAINT_MARGIN);
        const right = Math.min(img.naturalWidth, dt.bbox.x1 + INPAINT_MARGIN);
        const y = Math.max(0, dt.bbox.y0 - INPAINT_MARGIN);
        const bottom = Math.min(img.naturalHeight, dt.bbox.y1 + INPAINT_MARGIN);
        const w = right - x;
        const h = bottom - y;

        // Pick a strip from above or below the bbox
        let srcY: number;
        if (y >= stripH) {
          srcY = y - stripH;
        } else {
          srcY = Math.min(bottom, img.naturalHeight - stripH);
        }

        offCtx.drawImage(img, x, srcY, w, stripH, x, y, w, h);
      });

      const fabricImg = new fabric.FabricImage(offscreen, {
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
      });
      canvas.add(fabricImg);

      detectedTexts.forEach((dt) => {
        const text = new fabric.IText(dt.text, {
          left: dt.bbox.x0,
          top: dt.bbox.y0,
          fontSize: dt.fontSize,
          fill: dt.textColor,
          fontFamily: dt.fontFamily,
          fontWeight: dt.fontWeight || "normal",
        });
        canvas.add(text);
      });

      canvas.renderAll();

      canvas.on("selection:created", () => updateSelectedProps(canvas));
      canvas.on("selection:updated", () => updateSelectedProps(canvas));
      canvas.on("selection:cleared", () => setSelectedProps(null));
      canvas.on("object:modified", () => updateSelectedProps(canvas));
      canvas.on("text:changed", () => updateSelectedProps(canvas));
    };
    img.src = imageUrl;

    return () => {
      cancelled = true;
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, [imageUrl, detectedTexts, updateSelectedProps]);

  const handleDeleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || !(active instanceof fabric.IText)) return;

    canvas.remove(active);
    canvas.discardActiveObject();
    canvas.renderAll();
    setSelectedProps(null);
  }, []);

  // Keyboard shortcut: Delete/Backspace removes selected IText (when not editing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const canvas = fabricRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (active instanceof fabric.IText && !active.isEditing) {
        e.preventDefault();
        handleDeleteSelected();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteSelected]);

  const handlePropertyChange = useCallback(
    (props: Partial<TextProperties>) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (!active || !(active instanceof fabric.IText)) return;

      if (props.text !== undefined) active.set("text", props.text);
      if (props.fontFamily !== undefined && ALLOWED_FONTS.has(props.fontFamily))
        active.set("fontFamily", props.fontFamily);
      if (props.fontSize !== undefined)
        active.set("fontSize", props.fontSize);
      if (props.fill !== undefined && isValidCssColor(props.fill))
        active.set("fill", props.fill);
      if (props.fontWeight !== undefined)
        active.set("fontWeight", props.fontWeight);

      canvas.renderAll();
      updateSelectedProps(canvas);
    },
    [updateSelectedProps]
  );

  const handleExportSVG = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const svg = canvas.toSVG();
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "business-card.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-5 w-full">
      {/* Canvas area */}
      <div className="flex-1 min-w-0">
        <div
          ref={containerRef}
          className="rounded-xl border border-sand-200 bg-sand-100/50 p-2 overflow-auto"
        >
          <div
            style={{
              width: canvasSize.width * scale,
              height: canvasSize.height * scale,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>

        {/* Export bar */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px] text-sand-400 font-mono">
            {detectedTexts.length} text element{detectedTexts.length !== 1 && "s"} detected
          </p>
          <button
            onClick={handleExportSVG}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-sand-50 rounded-lg text-sm font-medium hover:bg-ink-light transition-colors shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v7m0 0L4.5 6.5M7 9l2.5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2.5 11h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Download SVG
          </button>
        </div>
      </div>

      {/* Property panel */}
      <div className="w-full lg:w-64 shrink-0">
        <TextPropertyPanel
          selected={selectedProps}
          onChange={handlePropertyChange}
          onDelete={handleDeleteSelected}
        />
      </div>
    </div>
  );
}
