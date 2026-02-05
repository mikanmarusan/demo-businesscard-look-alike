"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  onImageLoaded: (dataUrl: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function ImageUploader({ onImageLoaded }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > MAX_FILE_SIZE) {
        alert("File is too large. Please upload an image under 10 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        onImageLoaded(dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [onImageLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="max-w-xl mx-auto animate-fade-up-delay-1">
      <div
        className={`relative group rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-300 ${
          dragOver
            ? "border-accent bg-accent-muted scale-[1.01]"
            : "border-sand-300 hover:border-sand-400 bg-white/60 hover:bg-white/80"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          {/* Upload icon */}
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
              dragOver
                ? "bg-accent/10"
                : "bg-sand-100 group-hover:bg-sand-200"
            }`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className={`transition-all duration-300 ${
                dragOver
                  ? "text-accent -translate-y-0.5"
                  : "text-sand-500 group-hover:text-sand-700 group-hover:-translate-y-0.5"
              }`}
            >
              <path
                d="M12 16V4m0 0L8 8m4-4l4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <p className="font-medium text-ink text-[15px]">
              Drop your image here
            </p>
            <p className="text-sand-400 text-sm mt-1">
              or click to browse &middot; JPG, PNG up to 10 MB
            </p>
          </div>
        </div>
      </div>

      {preview && (
        <div className="mt-6 animate-fade-up">
          <div className="rounded-xl overflow-hidden border border-sand-200 shadow-sm">
            <img
              src={preview}
              alt="Uploaded business card preview"
              className="w-full block"
            />
          </div>
        </div>
      )}
    </div>
  );
}
