"use client";

interface Props {
  progress: number;
}

export default function OcrProgress({ progress }: Props) {
  const percent = Math.round(progress * 100);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto">
      {/* Animated rings */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-sand-200 animate-pulse-ring" />
        <div className="absolute inset-2 rounded-full border-2 border-sand-300 animate-pulse-ring [animation-delay:0.4s]" />
        <div className="absolute inset-4 rounded-full bg-ink flex items-center justify-center">
          <span className="text-sand-50 text-xs font-mono font-medium">
            {percent}%
          </span>
        </div>
      </div>

      <div className="text-center">
        <h2 className="font-display text-xl text-ink">Recognizing text</h2>
        <p className="text-sm text-sand-400 mt-1">
          Downloading language data & running OCR
        </p>
      </div>

      {/* Progress track */}
      <div className="w-full">
        <div className="w-full h-1 bg-sand-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-ink rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[11px] text-sand-400 font-mono">eng + jpn</span>
          <span className="text-[11px] text-sand-400 font-mono">{percent}%</span>
        </div>
      </div>
    </div>
  );
}
