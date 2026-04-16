"use client";

import { useRef, useCallback, useState } from "react";
import { useUIStore } from "@/lib/store/uiStore";
import { motion, AnimatePresence } from "framer-motion";

export default function TopToolbar() {
  const transportState = useUIStore((s) => s.transportState);
  const play = useUIStore((s) => s.play);
  const pause = useUIStore((s) => s.pause);
  const stop = useUIStore((s) => s.stop);

  const closeWorkspace = useUIStore((s) => s.closeWorkspace);

  const recordState = useUIStore((s) => s.recordState);
  const recordProgress = useUIStore((s) => s.recordProgress);
  const setRecordState = useUIStore((s) => s.setRecordState);
  const setRecordProgress = useUIStore((s) => s.setRecordProgress);

  const renderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const handleRecord = useCallback(() => {
    if (recordState !== "idle") return;
    setRecordState("rendering");
    setRecordProgress(0);

    const start = performance.now();
    const duration = 500;

    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(elapsed / duration, 1);
      setRecordProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    renderTimerRef.current = setTimeout(() => {
      setRecordProgress(1);
      setRecordState("done");

      window.open("/AS_Software_Resume.pdf", "_blank", "noopener,noreferrer");

      setTimeout(() => {
        setRecordState("idle");
        setRecordProgress(0);
      }, 300);
    }, duration);
  }, [recordState, setRecordState, setRecordProgress]);

  const handlePlay = useCallback(() => {
    if (transportState === "playing") {
      pause();
    } else {
      play();
    }
  }, [transportState, play, pause]);

  return (
    <div className="flex items-center justify-between h-10 px-3 bg-surface border-b border-grid shrink-0">
      {/* Left: Close project + Transport position readout */}
      <div className="flex items-center gap-3 font-mono text-[10px] md:text-xs">
        <button
          onClick={closeWorkspace}
          className="flex items-center gap-1.5 px-2.5 py-1 -ml-1 rounded border border-cyan/40 bg-cyan/10 text-cyan hover:bg-cyan/20 hover:border-cyan/60 transition-all cursor-pointer"
          aria-label="Close project"
          title="Close Project"
          style={{ boxShadow: "0 0 8px rgba(0,229,255,0.15)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-[10px] tracking-wider font-bold">FILE</span>
        </button>
        <div className="w-px h-5 bg-grid" />
        <div className="flex items-center gap-2 px-2.5 py-1 bg-elevated rounded border border-grid">
          <span className="text-muted">
            {transportState === "playing"
              ? "PLAYING"
              : transportState === "paused"
                ? "PAUSED"
                : "STOPPED"}
          </span>
          <span className="text-grid-light">|</span>
          <PlayheadReadout />
        </div>
      </div>

      {/* Center: Transport controls + render progress */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <TransportButton icon="stop" onClick={stop} active={transportState === "stopped"} />
          <TransportButton icon={transportState === "playing" ? "pause" : "play"} onClick={handlePlay} active={transportState === "playing" || transportState === "paused"} />
          <RecordButton onClick={handleRecord} recordState={recordState} />
        </div>

        <AnimatePresence>
          {recordState === "rendering" && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 160 }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 px-2.5 py-1 bg-elevated rounded border border-grid overflow-hidden"
            >
              <span className="text-[10px] font-mono text-led-red whitespace-nowrap">
                Rendering Session...
              </span>
              <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden min-w-[40px]">
                <motion.div
                  className="h-full bg-led-red rounded-full"
                  style={{ width: `${recordProgress * 100}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Editable BPM display */}
      <BPMDisplay />
    </div>
  );
}

function BPMDisplay() {
  const bpm = useUIStore((s) => s.bpm);
  const setBpm = useUIStore((s) => s.setBpm);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(String(bpm));
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const commit = () => {
    const val = parseFloat(draft);
    if (!isNaN(val)) setBpm(val);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-0 rounded border border-grid overflow-hidden font-mono">
      <span className="text-[10px] font-bold tracking-wider text-white bg-surface px-2 py-1.5 border-r border-grid select-none">
        BPM
      </span>
      <div
        className="px-2.5 py-1 bg-deep"
        style={{
          boxShadow: "inset 0 1px 4px rgba(0,0,0,0.6)",
        }}
      >
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            min={60}
            max={999}
            step={0.1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-14 bg-transparent text-orange tabular-nums font-bold text-sm text-right outline-none"
            autoFocus
          />
        ) : (
          <button
            onClick={startEdit}
            className="group flex items-center gap-1.5 text-orange tabular-nums font-bold text-sm cursor-text hover:text-orange/80 transition-colors"
            style={{
              textShadow: "0 0 8px rgba(255,145,0,0.5)",
            }}
            title="Click to edit BPM"
          >
            {bpm.toFixed(1)}
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-70 group-hover:opacity-100 transition-opacity"
            >
              <path d="M17 3l4 4L7 21H3v-4L17 3z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// One column = one month; col 0 = Jan 2025, col 15 = Apr 2026
const TIMELINE_START_YEAR = 2025;
const TIMELINE_START_MONTH = 0; // January
const TIMELINE_TOTAL_MONTHS = 16; // 16 playable months (Jan 2025 → Apr 2026)

function PlayheadReadout() {
  const progress = useUIStore((s) => s.playheadProgress);
  const monthOffset = Math.floor(progress * TIMELINE_TOTAL_MONTHS);
  const date = new Date(TIMELINE_START_YEAR, TIMELINE_START_MONTH + monthOffset, 1);
  const label = date.toLocaleString("default", { month: "short", year: "numeric" });
  return (
    <span className="text-lime tabular-nums font-bold tracking-wide">
      {label}
    </span>
  );
}

function TransportButton({
  icon,
  onClick,
  active,
}: {
  icon: string;
  onClick: () => void;
  active: boolean;
}) {
  const paths: Record<string, React.ReactNode> = {
    stop: <rect x="6" y="6" width="12" height="12" fill="currentColor" />,
    play: <polygon points="8,5 20,12 8,19" fill="currentColor" />,
    pause: (
      <>
        <rect x="6" y="5" width="4" height="14" fill="currentColor" />
        <rect x="14" y="5" width="4" height="14" fill="currentColor" />
      </>
    ),
  };

  const colorMap: Record<string, { idle: string; active: string }> = {
    stop: { idle: "text-muted hover:text-white", active: "text-white" },
    play: { idle: "text-muted hover:text-lime", active: "text-lime" },
    pause: { idle: "text-muted hover:text-white", active: "text-cyan" },
  };

  const colors = colorMap[icon];

  return (
    <button
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        active ? colors.active : colors.idle
      }`}
      onClick={onClick}
      aria-label={icon}
    >
      <svg width="16" height="16" viewBox="0 0 24 24">
        {paths[icon]}
      </svg>
    </button>
  );
}

function RecordButton({
  onClick,
  recordState,
}: {
  onClick: () => void;
  recordState: string;
}) {
  const isActive = recordState !== "idle";

  return (
    <button
      className={`w-7 h-7 flex items-center justify-center rounded transition-all ${
        isActive
          ? "text-led-red"
          : "text-muted hover:text-led-red"
      }`}
      onClick={onClick}
      aria-label="record"
      style={
        isActive
          ? { filter: "drop-shadow(0 0 6px rgba(255,50,50,0.7))" }
          : undefined
      }
    >
      <svg width="16" height="16" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="6" fill="currentColor" />
      </svg>
    </button>
  );
}
