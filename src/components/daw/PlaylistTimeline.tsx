"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { timelineItems } from "@/lib/data/careerData";
import { useUIStore } from "@/lib/store/uiStore";
import { motion } from "framer-motion";

const TOTAL_COLS = 12;
const BEATS_PER_COL = 4;
const TOTAL_BEATS = TOTAL_COLS * BEATS_PER_COL;
const TRACK_ROW_HEIGHT = 72;
const FUTURE_TRACK_ROWS = 0;
const FUTURE_COLS = Math.ceil(TOTAL_COLS / 2);
const TOTAL_GRID_COLS = TOTAL_COLS + FUTURE_COLS;
const PLAYABLE_GRID_RATIO = TOTAL_COLS / TOTAL_GRID_COLS;
const MAX_SCRUB_PROGRESS = TOTAL_GRID_COLS / TOTAL_COLS;
const PLAYBACK_END_COL = Math.max(...timelineItems.map((i) => i.col - 1 + i.span));
const PLAYBACK_END = PLAYBACK_END_COL / TOTAL_COLS;
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
  const setLedActiveTech = useUIStore((s) => s.setLedActiveTech);

  const sortedTimelineItems = useMemo(
    () =>
      [...timelineItems].sort((a, b) => {
        if (a.track !== b.track)
          return a.track === "experience" ? -1 : 1;
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

  // Derive LED tech: playhead items while playing, selected block when paused/stopped
  const prevTechKeyRef = useRef("");
  useEffect(() => {
    const techSet = new Set<string>();

    if (transportState === "playing") {
      for (const id of activeItemIds) {
        const item = timelineItems.find((t) => t.id === id);
        if (item) for (const tech of item.techStack) techSet.add(tech);
      }
    } else if (selectedItemId) {
      const sel = timelineItems.find((t) => t.id === selectedItemId);
      if (sel) for (const tech of sel.techStack) techSet.add(tech);
    } else if (activeItemIds.length > 0) {
      for (const id of activeItemIds) {
        const item = timelineItems.find((t) => t.id === id);
        if (item) for (const tech of item.techStack) techSet.add(tech);
      }
    }

    const key = Array.from(techSet).sort().join(",");
    if (key !== prevTechKeyRef.current) {
      prevTechKeyRef.current = key;
      setLedActiveTech(Array.from(techSet));
    }
  }, [activeItemIds, selectedItemId, transportState, setLedActiveTech]);

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

    const secondsPerBeat = 60 / bpm;
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
        <div className="w-20 md:w-24 shrink-0 flex flex-col border-r border-grid">
          {/* Ruler gutter */}
          <div className="h-6 shrink-0 border-b border-grid" />

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
              className="h-6 flex shrink-0 border-b border-grid relative"
              style={{ cursor: "col-resize" }}
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
                    {i + 1}
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
}: {
  label: string;
  trackKey: string;
  color?: string;
}) {
  const mutedTracks = useUIStore((s) => s.mutedTracks);
  const toggleMuteTrack = useUIStore((s) => s.toggleMuteTrack);
  const isMuted = !!mutedTracks[trackKey];

  return (
    <div
      className="px-2 text-[10px] font-mono text-white border-b border-grid flex flex-col items-start justify-center gap-1 shrink-0"
      style={{
        height: TRACK_ROW_HEIGHT,
        opacity: isMuted ? 0.35 : 1,
        transition: "opacity 0.3s",
      }}
    >
      <span className="truncate w-full" style={color ? { color } : undefined}>
        {label}
      </span>
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
  const activeItemIds = useUIStore((s) => s.activeItemIds);
  const crossfaderValue = useUIStore((s) => s.crossfaderValue);
  const selectItemWithView = useUIStore((s) => s.selectItemWithView);
  const isMuted = !!mutedTracks[trackKey];

  const hasActiveOverlap = activeItemIds.length > 1;

  const itemId = items[0]?.id;
  const itemIdx = activeItemIds.indexOf(itemId ?? "");
  const n = activeItemIds.length;

  let crossfaderFavor = 0;
  if (itemIdx >= 0 && n > 1) {
    const segWidth = 1 / n;
    const segCenter = (itemIdx + 0.5) * segWidth;
    const dist = Math.abs(crossfaderValue - segCenter);
    crossfaderFavor = Math.max(0, 1 - dist / segWidth);
  } else if (itemIdx >= 0) {
    crossfaderFavor = 1;
  }

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
        const isActive = activeItemIds.includes(item.id);
        const leftPct = ((item.col - 1) / TOTAL_GRID_COLS) * 100;
        const widthPct = (item.span / TOTAL_GRID_COLS) * 100;

        const glowIntensity =
          isActive && hasActiveOverlap
            ? Math.pow(crossfaderFavor, 1.8)
            : isActive ? 1 : 0;

        const bgAlpha = Math.round(10 + glowIntensity * 55).toString(16).padStart(2, "0");
        const borderAlpha = Math.round(35 + glowIntensity * 130).toString(16).padStart(2, "0");
        const glowOuterAlpha = Math.round(glowIntensity * 70).toString(16).padStart(2, "0");
        const glowInnerAlpha = Math.round(glowIntensity * 30).toString(16).padStart(2, "0");
        const glowSpread = Math.round(4 + glowIntensity * 20);
        const insetSpread = Math.round(2 + glowIntensity * 12);

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
              backgroundColor: isActive
                ? `${item.color}${bgAlpha}`
                : isSelected
                  ? `${item.color}30`
                  : `${item.color}18`,
              borderColor: isActive
                ? `${item.color}${borderAlpha}`
                : isSelected
                  ? `${item.color}80`
                  : `${item.color}40`,
              boxShadow: isActive
                ? `0 0 ${glowSpread}px ${item.color}${glowOuterAlpha}, inset 0 0 ${insetSpread}px ${item.color}${glowInnerAlpha}`
                : "none",
              transition:
                "background-color 0.15s, border-color 0.15s, box-shadow 0.2s, opacity 0.15s",
            }}
            whileHover={{
              backgroundColor: `${item.color}28`,
              borderColor: `${item.color}60`,
            }}
            whileTap={{ scale: 0.98 }}
            aria-label={`${item.title} at ${item.subtitle}`}
          >
            <div className="px-2 py-1 overflow-hidden h-full flex flex-col justify-center">
              <div
                className="text-[10px] md:text-[11px] font-mono font-bold truncate"
                style={{
                  opacity: isActive && hasActiveOverlap ? 0.4 + glowIntensity * 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
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
                style={{
                  color: item.color,
                  opacity: isActive && hasActiveOverlap ? 0.2 + glowIntensity * 0.6 : 0.8,
                  transition: "opacity 0.15s",
                }}
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
