"use client";

interface TextProperties {
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  fontWeight: string;
}

interface Props {
  selected: TextProperties | null;
  onChange: (props: Partial<TextProperties>) => void;
  onDelete?: () => void;
}

const FONT_OPTIONS = [
  "Noto Sans JP",
  "Noto Serif JP",
  "sans-serif",
  "serif",
  "monospace",
];

export default function TextPropertyPanel({ selected, onChange, onDelete }: Props) {
  if (!selected) {
    return (
      <div className="rounded-xl border border-sand-200 bg-white/60 p-5">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-sand-300">
            <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
            <path d="M7 10h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-sand-400">
            Select a text element to edit
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sand-200 bg-white/80 backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-sand-100 bg-sand-50/50">
        <h3 className="text-xs font-semibold text-sand-600 uppercase tracking-wider">
          Properties
        </h3>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Text */}
        <div>
          <label className="block text-[11px] font-medium text-sand-500 uppercase tracking-wider mb-1.5">
            Text
          </label>
          <input
            type="text"
            value={selected.text}
            onChange={(e) => onChange({ text: e.target.value })}
            className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-sand-300 focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-sand-400 transition-all"
          />
        </div>

        {/* Font */}
        <div>
          <label className="block text-[11px] font-medium text-sand-500 uppercase tracking-wider mb-1.5">
            Font
          </label>
          <select
            value={selected.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value })}
            className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-sand-400 transition-all appearance-none"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Size */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-sand-500 uppercase tracking-wider">
              Size
            </label>
            <span className="text-[11px] font-mono text-sand-400">
              {Math.round(selected.fontSize)}px
            </span>
          </div>
          <input
            type="range"
            min={8}
            max={72}
            value={selected.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className="w-full accent-ink h-1"
          />
        </div>

        {/* Color + Bold row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-medium text-sand-500 uppercase tracking-wider mb-1.5">
              Color
            </label>
            <div className="flex items-center gap-2">
              <label className="relative w-8 h-8 rounded-lg border border-sand-200 overflow-hidden cursor-pointer shrink-0 hover:border-sand-400 transition-colors">
                <input
                  type="color"
                  value={selected.fill}
                  onChange={(e) => onChange({ fill: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: selected.fill }}
                />
              </label>
              <input
                type="text"
                value={selected.fill}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                    onChange({ fill: v });
                  }
                }}
                className="flex-1 min-w-0 rounded-lg border border-sand-200 bg-white px-2 py-1.5 text-xs font-mono text-ink focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-sand-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-sand-500 uppercase tracking-wider mb-1.5">
              Bold
            </label>
            <button
              onClick={() =>
                onChange({
                  fontWeight:
                    selected.fontWeight === "bold" ? "normal" : "bold",
                })
              }
              className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                selected.fontWeight === "bold"
                  ? "bg-ink text-sand-50 shadow-sm"
                  : "bg-white border border-sand-200 text-sand-400 hover:border-sand-400 hover:text-sand-600"
              }`}
            >
              B
            </button>
          </div>
        </div>

        {/* Delete */}
        {onDelete && (
          <div className="pt-2 border-t border-sand-100">
            <button
              onClick={onDelete}
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-300 transition-all"
            >
              Delete text
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
