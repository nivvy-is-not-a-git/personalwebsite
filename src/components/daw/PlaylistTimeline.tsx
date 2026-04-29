"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { timelineItems } from "@/lib/data/careerData";
import { useUIStore } from "@/lib/store/uiStore";
import { motion } from "framer-motion";

const TOTAL_COLS = 16;       // Jan 2025 → Apr 2026, one column per month
const BEATS_PER_COL = 4;
const TOTAL_BEATS = TOTAL_COLS * BEATS_PER_COL;
const TRACK_ROW_HEIGHT = 72;
const FUTURE_TRACK_ROWS = 0;
const FUTURE_COLS = 3;        // May, Jun, Jul 2026
const TOTAL_GRID_COLS = TOTAL_COLS + FUTURE_COLS; // 19
const PLAYABLE_GRID_RATIO = TOTAL_COLS / TOTAL_GRID_COLS;
const MAX_SCRUB_PROGRESS = TOTAL_GRID_COLS / TOTAL_COLS;
const PLAYBACK_END_COL = Math.max(...timelineItems.map((i) => i.col - 1 + i.span));
const PLAYBACK_END = PLAYBACK_END_COL / TOTAL_COLS;

// Ruler: col index 0 = Jan 2025, each step is exactly one month
function colToMonthLabel(colIndex: number): string {
  const d = new Date(2025, colIndex, 1);
  const mon = d.toLocaleString("default", { month: "short" });
  const yy = String(d.getFullYear()).slice(2);
  return `${mon} '${yy}`;
}
const MONTH_TO_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function getTimelineStartTimestamp(period: string): number {
  const match = period.match(/([A-Za-z]{3})\D*(\d{4})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const month = MONTH_TO_INDEX[match[1].toLowerCase()] ?? 0;
  const year = Number.parseInt(match[2], 10);
  return Date.UTC(year, month, 1);
}

export default function PlaylistTimeline() {
  const selectedItemId = useUIStore((s) => s.selectedItemId);
  const selectItem = useUIStore((s) => s.selectItem);
  const transportState = useUIStore((s) => s.transportState);
  const playheadProgress = useUIStore((s) => s.playheadProgress);
  const setPlayheadProgress = useUIStore((s) => s.setPlayheadProgress);
  const setActiveItemIds = useUIStore((s) => s.setActiveItemIds);
  const mutedTracks = useUIStore((s) => s.mutedTracks);
  const bpm = useUIStore((s) => s.bpm);
  const stop = useUIStore((s) => s.stop);
  const pause = useUIStore((s) => s.pause);
  const activeItemIds = useUIStore((s) => s.activeItemIds);
  const crossfaderValue = useUIStore((s) => s.crossfaderValue);
  const setLedActiveTech = useUIStore((s) => s.setLedActiveTech);

  const sortedTimelineItems = useMemo(
    () =>
      [...timelineItems].sort((a, b) => {
        if (a.track !== b.track) {
          const order = { "experience": 0, "design-team": 1, "projects": 2 };
          return order[a.track] - order[b.track];
        }
        const aStart = getTimelineStartTimestamp(a.period);
        const bStart = getTimelineStartTimestamp(b.period);
        if (aStart !== bStart) return bStart - aStart;
        return b.col - a.col;
      }),
    []
  );

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startProgressRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const gridSurfaceRef = useRef<HTMLDivElement>(null);
  const labelsScrollRef = useRef<HTMLDivElement>(null);
  const resolveRef = useRef<(progress: number) => string[]>(null!);

  // Auto-scroll state for drag-past-edge
  const autoScrollRafRef = useRef<number | null>(null);
  const lastClientXRef = useRef(0);
  const EDGE_ZONE = 48; // px from viewport edge to start scrolling
  const MAX_SCROLL_SPEED = 12; // px per frame at full depth

  const resolveActiveItems = useCallback(
    (progress: number) => {
      const col = progress * TOTAL_COLS;
      const active: string[] = [];
      for (const item of timelineItems) {
        const start = item.col - 1;
        const end = start + item.span;
        if (col >= start && col < end && !mutedTracks[item.id]) {
          active.push(item.id);
        }
      }
      return active;
    },
    [mutedTracks]
  );
  resolveRef.current = resolveActiveItems;

  // Derive LED tech: crossfader-selected item while active, selected block otherwise
  const prevTechKeyRef = useRef("");
  useEffect(() => {
    const techSet = new Set<string>();

    const n = activeItemIds.length;
    if (n > 0) {
      const displayedIdx = n > 1 ? Math.min(Math.floor(crossfaderValue * n), n - 1) : 0;
      const displayedId = activeItemIds[displayedIdx];
      const item = timelineItems.find((t) => t.id === displayedId);
      if (item) for (const tech of item.techStack) techSet.add(tech);
    } else if (selectedItemId) {
      const sel = timelineItems.find((t) => t.id === selectedItemId);
      if (sel) for (const tech of sel.techStack) techSet.add(tech);
    }

    const key = Array.from(techSet).sort().join(",");
    if (key !== prevTechKeyRef.current) {
      prevTechKeyRef.current = key;
      setLedActiveTech(Array.from(techSet));
    }
  }, [activeItemIds, crossfaderValue, selectedItemId, setLedActiveTech]);

  // Refresh active items immediately when mute state changes during playback
  useEffect(() => {
    if (transportState === "playing" || transportState === "paused") {
      setActiveItemIds(resolveRef.current(playheadProgress));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutedTracks]);

  // Playback loop
  useEffect(() => {
    if (transportState !== "playing") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const baseBpm = 130;
    const speedMultiplier = Math.pow(bpm / baseBpm, 2);
    const secondsPerBeat = 60 / (baseBpm * speedMultiplier);
    const totalDuration = TOTAL_BEATS * secondsPerBeat * PLAYBACK_END;

    startTimeRef.current = performance.now();
    startProgressRef.current = playheadProgress;

    const tick = () => {
      if (isDraggingRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const progressDelta = (elapsed / totalDuration) * PLAYBACK_END;
      const newProgress = startProgressRef.current + progressDelta;

      if (newProgress >= PLAYBACK_END) {
        setPlayheadProgress(PLAYBACK_END);
        setActiveItemIds(resolveRef.current(PLAYBACK_END));
        stop();
        return;
      }

      setPlayheadProgress(newProgress);
      setActiveItemIds(resolveRef.current(newProgress));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transportState, bpm]);

  // --- Scrub helpers ---
  const progressFromClientX = useCallback((clientX: number) => {
    const scrollEl = timelineScrollRef.current;
    if (!scrollEl) return 0;
    const rect = scrollEl.getBoundingClientRect();
    const xInGrid = clientX - rect.left + scrollEl.scrollLeft;
    const playableWidth = scrollEl.scrollWidth * PLAYABLE_GRID_RATIO;
    return Math.max(0, Math.min(MAX_SCRUB_PROGRESS, xInGrid / playableWidth));
  }, []);

  const scrubTo = useCallback(
    (progress: number) => {
      setPlayheadProgress(progress);
      setActiveItemIds(resolveActiveItems(progress));
    },
    [setPlayheadProgress, setActiveItemIds, resolveActiveItems]
  );

  const scrubFromRef = useCallback(() => {
    const scrollEl = timelineScrollRef.current;
    if (!scrollEl) return;
    const rect = scrollEl.getBoundingClientRect();
    const xInGrid = lastClientXRef.current - rect.left + scrollEl.scrollLeft;
    const playableWidth = scrollEl.scrollWidth * PLAYABLE_GRID_RATIO;
    const p = Math.max(0, Math.min(MAX_SCRUB_PROGRESS, xInGrid / playableWidth));
    setPlayheadProgress(p);
    setActiveItemIds(resolveRef.current(p));
  }, [setPlayheadProgress, setActiveItemIds]);

  const startAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current !== null) return;
    const tick = () => {
      const scrollEl = timelineScrollRef.current;
      if (!scrollEl || !isDraggingRef.current) {
        autoScrollRafRef.current = null;
        return;
      }
      const rect = scrollEl.getBoundingClientRect();
      const x = lastClientXRef.current;
      let delta = 0;
      if (x < rect.left + EDGE_ZONE) {
        const depth = Math.max(0, (rect.left + EDGE_ZONE - x) / EDGE_ZONE);
        delta = -MAX_SCROLL_SPEED * depth;
      } else if (x > rect.right - EDGE_ZONE) {
        const depth = Math.max(0, (x - (rect.right - EDGE_ZONE)) / EDGE_ZONE);
        delta = MAX_SCROLL_SPEED * depth;
      }
      if (delta !== 0) {
        scrollEl.scrollLeft = Math.max(
          0,
          Math.min(scrollEl.scrollLeft + delta, scrollEl.scrollWidth - scrollEl.clientWidth)
        );
        scrubFromRef();
      }
      autoScrollRafRef.current = requestAnimationFrame(tick);
    };
    autoScrollRafRef.current = requestAnimationFrame(tick);
  }, [scrubFromRef]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current !== null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  // --- Ruler pointer handlers ---
  const handleRulerPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      lastClientXRef.current = e.clientX;
      selectItem(null);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      scrubTo(progressFromClientX(e.clientX));
      startAutoScroll();
      if (transportState === "playing") pause();
    },
    [progressFromClientX, scrubTo, transportState, pause, startAutoScroll, selectItem]
  );

  const handleRulerPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      lastClientXRef.current = e.clientX;
      scrubTo(progressFromClientX(e.clientX));
    },
    [progressFromClientX, scrubTo]
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    stopAutoScroll();
  }, [stopAutoScroll]);

  // --- Playhead drag handlers ---
  const handlePlayheadPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      isDraggingRef.current = true;
      lastClientXRef.current = e.clientX;
      selectItem(null);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      startAutoScroll();
      if (transportState === "playing") pause();
    },
    [transportState, pause, startAutoScroll, selectItem]
  );

  const handlePlayheadPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      lastClientXRef.current = e.clientX;
      scrubTo(progressFromClientX(e.clientX));
    },
    [progressFromClientX, scrubTo]
  );

  const syncFromTimeline = useCallback(() => {
    const labelsEl = labelsScrollRef.current;
    const timelineEl = timelineScrollRef.current;
    if (!labelsEl || !timelineEl) return;
    labelsEl.scrollTop = timelineEl.scrollTop;
  }, []);

  const handleLabelsWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const timelineEl = timelineScrollRef.current;
    if (!timelineEl) return;
    timelineEl.scrollTop += e.deltaY;
    timelineEl.scrollLeft += e.deltaX;
    e.preventDefault();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Two-column layout: gutter (track labels) | grid content */}
      {/* The grid content column is the shared coordinate space for ruler + tracks + playhead */}
      <div className="flex-1 flex min-h-0">
        {/* Left gutter: ruler spacer + track labels */}
        <div className="shrink-0 w-max flex flex-col border-r border-grid" style={{ background: "#020204" }}>
          {/* Ruler gutter */}
          <div className="h-6 shrink-0 border-b border-grid flex items-center px-2">
            <span className="text-[8px] font-mono text-white/50 uppercase tracking-widest whitespace-nowrap">Experience</span>
          </div>

          {/* Track labels — one per item, grouped by deck */}
          <div
            ref={labelsScrollRef}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
            onWheel={handleLabelsWheel}
          >
            {sortedTimelineItems.map((item) => (
              <TrackLabel
                key={item.id}
                label={item.track === "projects" ? item.title : item.subtitle}
                trackKey={item.id}
                color={item.color}
                track={item.track}
              />
            ))}
            {Array.from({ length: FUTURE_TRACK_ROWS }).map((_, i) => (
              <FutureTrackLabelSpacer key={`future-label-${i}`} />
            ))}
          </div>
        </div>

        {/* Right: one unified scroll surface (uniform grid in both axes) */}
        <div
          ref={timelineScrollRef}
          className="flex-1 min-w-0 min-h-0 overflow-auto"
          onScroll={syncFromTimeline}
        >
          <div
            ref={gridSurfaceRef}
            className="min-h-full flex flex-col relative"
            style={{ width: `${(TOTAL_GRID_COLS / TOTAL_COLS) * 100}%` }}
          >
            {/* Ruler bar — scrub target */}
            <div
              className="h-6 flex shrink-0 border-b border-grid sticky top-0 z-20"
              style={{ cursor: "col-resize", background: "#06060a" }}
              onPointerDown={handleRulerPointerDown}
              onPointerMove={handleRulerPointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {Array.from({ length: TOTAL_GRID_COLS }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-grid flex items-center justify-center"
                >
                  <span className="text-[9px] font-mono text-white tabular-nums select-none">
                    {colToMonthLabel(i)}
                  </span>
                </div>
              ))}
            </div>

            {/* Track content rows */}
            <div className="flex-1 flex flex-col min-h-0">
              {sortedTimelineItems.map((item) => (
                <TrackContent
                  key={item.id}
                  items={[item]}
                  trackKey={item.id}
                  selectedItemId={selectedItemId}
                  isWaveform={item.track === "projects"}
                  gridCols={TOTAL_GRID_COLS}
                />
              ))}
              {Array.from({ length: FUTURE_TRACK_ROWS }).map((_, i) => (
                <FutureTrackContent key={`future-track-${i}`} gridCols={TOTAL_GRID_COLS} />
              ))}
            </div>

            {/* === Single playhead line spanning ruler + all tracks === */}
            {playheadProgress > 0 && (
              <>
                {/* Visible line */}
                <div
                  className="absolute top-0 bottom-0 z-30 pointer-events-none"
                  style={{
                    left: `${playheadProgress * PLAYABLE_GRID_RATIO * 100}%`,
                    width: 2,
                    background: "rgba(255,50,50,0.9)",
                    boxShadow:
                      "0 0 8px rgba(255,50,50,0.5), 0 0 2px rgba(255,50,50,0.8)",
                  }}
                >
                  {/* Triangle at top of ruler */}
                  <div
                    className="absolute -top-0.5 -left-[3px]"
                    style={{
                      borderLeft: "4px solid transparent",
                      borderRight: "4px solid transparent",
                      borderTop: "5px solid rgba(255,50,50,0.9)",
                    }}
                  />
                </div>

                {/* Invisible wider drag handle — ruler area only so track clips stay clickable */}
                <div
                  className="absolute top-0 z-40"
                  style={{
                    left: `calc(${playheadProgress * PLAYABLE_GRID_RATIO * 100}% - 6px)`,
                    width: 14,
                    height: 24,
                    cursor: "col-resize",
                    pointerEvents: "auto",
                  }}
                  onPointerDown={handlePlayheadPointerDown}
                  onPointerMove={handlePlayheadPointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Track label + mute button in the left gutter */
function TrackLabel({
  label,
  trackKey,
  color,
  track,
}: {
  label: string;
  trackKey: string;
  color?: string;
  track: "experience" | "projects" | "design-team";
}) {
  const mutedTracks = useUIStore((s) => s.mutedTracks);
  const toggleMuteTrack = useUIStore((s) => s.toggleMuteTrack);
  const isMuted = !!mutedTracks[trackKey];
  const typeLabel = track === "projects" ? "project" : track === "design-team" ? "design team" : "internship";

  return (
    <div
      className="px-2 text-xs font-mono text-white border-b border-grid flex flex-col items-start justify-center gap-1 shrink-0"
      style={{
        height: TRACK_ROW_HEIGHT,
        opacity: isMuted ? 0.35 : 1,
        transition: "opacity 0.3s",
      }}
    >
      <span className="whitespace-nowrap" style={color ? { color } : undefined}>
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => toggleMuteTrack(trackKey)}
          className={`px-1 py-0.5 text-[8px] font-bold rounded border transition-colors ${
            isMuted
              ? "bg-led-red/20 border-led-red/50 text-led-red"
              : "bg-transparent border-grid text-white hover:text-white hover:border-white"
          }`}
          aria-label={`${isMuted ? "Unmute" : "Mute"} ${label}`}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
        <span className="text-[7px] font-mono text-white whitespace-nowrap uppercase tracking-wide">
          {typeLabel}
        </span>
      </div>
    </div>
  );
}

/** Track content (blocks) without its own label — sits in the grid column */
function TrackContent({
  items,
  trackKey,
  selectedItemId,
  isWaveform,
  gridCols,
}: {
  items: typeof timelineItems;
  trackKey: string;
  selectedItemId: string | null;
  isWaveform: boolean;
  gridCols: number;
}) {
  const mutedTracks = useUIStore((s) => s.mutedTracks);
  const selectItemWithView = useUIStore((s) => s.selectItemWithView);
  const activeItemIds = useUIStore((s) => s.activeItemIds);
  const crossfaderValue = useUIStore((s) => s.crossfaderValue);
  const isMuted = !!mutedTracks[trackKey];

  const itemId = items[0]?.id;
  const n = activeItemIds.length;
  const displayedIdx = n > 1 ? Math.min(Math.floor(crossfaderValue * n), n - 1) : 0;
  const isDisplayed = n > 0 && activeItemIds[displayedIdx] === itemId;

  return (
    <div
      className="relative border-b border-grid shrink-0"
      style={{
        height: TRACK_ROW_HEIGHT,
        opacity: isMuted ? 0.35 : 1,
        filter: isMuted ? "saturate(0)" : "none",
        transition: "opacity 0.3s, filter 0.3s",
      }}
    >
      <GridLines cols={gridCols} />

      {items.map((item) => {
        const isSelected = selectedItemId === item.id;
        const isActive = isSelected || (activeItemIds.includes(item.id) && selectedItemId === null);
        const leftPct = ((item.col - 1) / TOTAL_GRID_COLS) * 100;
        const widthPct = (item.span / TOTAL_GRID_COLS) * 100;

        return (
          <motion.button
            key={item.id}
            onClick={() => {
              selectItemWithView(item.id, false);
            }}
            className={`absolute top-2 bottom-2 rounded cursor-pointer border transition-colors ${
              isWaveform ? "waveform-texture" : ""
            } ${isSelected ? item.selectedGlowClass : ""}`}
            style={{
              left: `${leftPct}%`,
              width: `${widthPct}%`,
              minWidth: "max-content",
              backgroundColor: isActive ? `${item.color}28` : isSelected ? `${item.color}30` : `${item.color}18`,
              borderColor: isActive ? `${item.color}cc` : isSelected ? `${item.color}80` : `${item.color}40`,
              boxShadow: isActive ? `0 0 10px ${item.color}60, inset 0 0 6px ${item.color}30` : "none",
              transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.2s",
            }}
            whileHover={{
              backgroundColor: `${item.color}28`,
              borderColor: `${item.color}60`,
            }}
            animate={{ scale: isDisplayed ? 1.05 : 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            whileTap={{ scale: 0.98 }}
            aria-label={`${item.title} at ${item.subtitle}`}
          >
            <div className="px-2 py-1 overflow-hidden h-full flex flex-col justify-center">
              <div className="text-[10px] md:text-[11px] font-mono font-bold truncate">
                {item.primaryUrl ? (
                  <span
                    className="hover:underline underline-offset-2 cursor-pointer"
                    style={{ color: item.color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(item.primaryUrl!, "_blank", "noopener,noreferrer");
                    }}
                  >
                    {item.title}
                  </span>
                ) : (
                  <span style={{ color: item.color }}>{item.title}</span>
                )}
              </div>
              <div
                className="text-[9px] font-mono truncate"
                style={{ color: item.color, opacity: 0.8 }}
              >
                {item.subtitle} &middot; {item.period}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function GridLines({ cols }: { cols: number }) {
  return (
    <div className="absolute inset-0 flex pointer-events-none">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-1 border-r border-grid/50" />
      ))}
    </div>
  );
}

function FutureTrackLabelSpacer() {
  return (
    <div
      aria-hidden
      className="border-b border-grid shrink-0"
      style={{ height: TRACK_ROW_HEIGHT }}
    />
  );
}

function FutureTrackContent({ gridCols }: { gridCols: number }) {
  return (
    <div
      aria-hidden
      className="relative border-b border-grid shrink-0"
      style={{ height: TRACK_ROW_HEIGHT }}
    >
      <GridLines cols={gridCols} />
    </div>
  );
}
