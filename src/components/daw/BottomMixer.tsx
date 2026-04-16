"use client";

import { useRef, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useUIStore } from "@/lib/store/uiStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  timelineItems,
  getSkillProficiency,
  type TimelineItem,
} from "@/lib/data/careerData";

gsap.registerPlugin(useGSAP);

function useResolvedMixerItems(): {
  items: TimelineItem[];
  hasOverlap: boolean;
} {
  const selectedItemId = useUIStore((s) => s.selectedItemId);
  const activeItemIds = useUIStore((s) => s.activeItemIds);
  const transportState = useUIStore((s) => s.transportState);

  return useMemo(() => {
    // When paused, prefer manually selected item so any clicked track is inspectable
    if (transportState === "paused" && selectedItemId) {
      const sel = timelineItems.find((i) => i.id === selectedItemId) ?? null;
      return { items: sel ? [sel] : [], hasOverlap: false };
    }

    if (activeItemIds.length > 0) {
      const items = activeItemIds
        .map((id) => timelineItems.find((t) => t.id === id))
        .filter(Boolean) as TimelineItem[];
      return { items, hasOverlap: items.length > 1 };
    }

    const sel = timelineItems.find((i) => i.id === selectedItemId) ?? null;
    return { items: sel ? [sel] : [], hasOverlap: false };
  }, [selectedItemId, activeItemIds, transportState]);
}

function getActiveSegment(value: number, count: number): number {
  if (count <= 1) return 0;
  return Math.min(Math.floor(value * count), count - 1);
}

function getItemLabel(item: TimelineItem): string {
  return item.track === "projects" ? item.title : item.subtitle;
}

export default function BottomMixer() {
  const { items, hasOverlap } = useResolvedMixerItems();
  const crossfaderValue = useUIStore((s) => s.crossfaderValue);
  const setCrossfaderValue = useUIStore((s) => s.setCrossfaderValue);
  const height = useUIStore((s) => s.mixerHeight);
  const setHeight = useUIStore((s) => s.setMixerHeight);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height;
    const maxH = window.innerHeight - 48;
    const onMove = (ev: MouseEvent) => {
      setHeight(Math.max(96, Math.min(maxH, startHeight - (ev.clientY - startY))));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const activeSegment = getActiveSegment(crossfaderValue, items.length);
  const displayItem = items[activeSegment] ?? null;

  const bands = useMemo(() => {
    if (!displayItem) return [];
    return displayItem.techStack.map((name) => ({
      name,
      eq: getSkillProficiency(name) || 50,
      color: displayItem.color,
    }));
  }, [displayItem]);

  const trackGradient = useMemo(() => {
    if (items.length < 2) return "var(--color-grid)";
    const stops = items.flatMap((item, i) => {
      const start = (i / items.length) * 100;
      const end = ((i + 1) / items.length) * 100;
      const c = `color-mix(in srgb, ${item.color} 25%, var(--color-grid))`;
      return [`${c} ${start}%`, `${c} ${end}%`];
    });
    return `linear-gradient(to right, ${stops.join(", ")})`;
  }, [items]);

  return (
    <div className="shrink-0 bg-surface border-t border-grid flex flex-col relative" style={{ height }}>
      {/* Vertical resize handle */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-10 cursor-row-resize group"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="absolute inset-0 group-hover:bg-cyan/30 transition-colors" />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* EQ Rack */}
        <div className="w-1/2 md:w-2/5 border-r border-grid p-3 flex flex-col">
          <div className="text-[10px] font-mono text-white mb-2 tracking-wider uppercase">
            EQ Rack
          </div>
          <EQRack bands={bands} />
        </div>

        {/* Patch Notes */}
        <div className="flex-1 p-3 flex flex-col overflow-hidden">
          <PatchNotes
            items={items}
            activeSegment={activeSegment}
            hasOverlap={hasOverlap}
          />
        </div>
      </div>

      {/* Crossfader — only visible during overlap */}
      <AnimatePresence>
        {hasOverlap && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 52, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-grid px-4 flex flex-col justify-center gap-1 overflow-hidden shrink-0"
          >
            <div className="relative flex items-center">
              {/* Segment boundary tick marks */}
              {items.slice(1).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-px h-3 bg-muted/40 pointer-events-none z-20"
                  style={{ left: `${((i + 1) / items.length) * 100}%` }}
                />
              ))}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={crossfaderValue}
                onChange={(e) => setCrossfaderValue(parseFloat(e.target.value))}
                className="crossfader-slider w-full relative z-10"
                aria-label="Crossfader"
                style={
                  {
                    "--crossfader-gradient": trackGradient,
                  } as React.CSSProperties
                }
              />
            </div>
            {/* Segment labels */}
            <div className="flex">
              {items.map((item, i) => {
                const isActive = i === activeSegment;
                return (
                  <div key={item.id} className="flex-1 text-center min-w-0">
                    <span
                      className="text-[8px] font-mono font-bold truncate block"
                      style={{
                        color: item.color,
                        opacity: isActive ? 1 : 0.35,
                        textShadow: isActive
                          ? `0 0 6px ${item.color}50`
                          : "none",
                        transition: "opacity 0.15s, text-shadow 0.15s",
                      }}
                    >
                      {getItemLabel(item)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EQRack({
  bands,
}: {
  bands: { name: string; eq: number; color: string }[];
}) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    barsRef.current.forEach((bar, i) => {
      if (!bar || !bands[i]) return;
      gsap.killTweensOf(bar);
      gsap.to(bar, {
        height: `${bands[i].eq}%`,
        duration: 0.4,
        ease: "back.out(1.2)",
        delay: i * 0.03,
      });
    });
  }, [bands]);

  if (bands.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs font-mono text-dim">
        Select a block from the timeline
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-end gap-1.5 md:gap-2">
      {bands.map((band, i) => (
        <div
          key={band.name}
          className="flex-1 flex flex-col items-center justify-end h-full max-w-[60px]"
        >
          <div className="w-full flex-1 flex items-end">
            <div
              ref={(el) => {
                barsRef.current[i] = el;
              }}
              className="w-full rounded-t-sm"
              style={{
                height: "0%",
                backgroundColor: band.color,
                opacity: 0.85,
                boxShadow: `0 0 6px ${band.color}40`,
              }}
            />
          </div>
          <div
            className="text-[9px] md:text-[10px] font-mono mt-1.5 truncate w-full text-center"
            style={{ color: band.color }}
          >
            {band.name}
          </div>
        </div>
      ))}
    </div>
  );
}

function PatchNotes({
  items,
  activeSegment,
  hasOverlap,
}: {
  items: TimelineItem[];
  activeSegment: number;
  hasOverlap: boolean;
}) {
  const displayItem = items[activeSegment] ?? null;

  if (!displayItem) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs font-mono text-dim">
        Select a block from the timeline
      </div>
    );
  }

  if (!hasOverlap) {
    return (
      <PatchNotesContent key={displayItem.id} item={displayItem} opacity={1} />
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={displayItem.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 overflow-y-auto flex flex-col"
        >
          <PatchNotesContent
            key={displayItem.id}
            item={displayItem}
            opacity={1}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PatchNotesContent({
  item,
  opacity,
}: {
  item: TimelineItem;
  opacity: number;
}) {
  const patchNotesView = useUIStore((s) => s.patchNotesView);
  const setPatchNotesView = useUIStore((s) => s.setPatchNotesView);
  const hasDetail =
    item.track === "experience" && !!item.shortDescription && !!item.summary;
  const view = hasDetail ? patchNotesView : "main";

  return (
    <div
      className="flex-1 min-h-0 relative overflow-hidden"
      style={{ opacity }}
    >
      <AnimatePresence initial={false} mode="wait">
        {view === "main" ? (
          <motion.div
            key="main"
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 overflow-y-auto space-y-2"
          >
            <div
              role={hasDetail ? "button" : undefined}
              tabIndex={hasDetail ? 0 : undefined}
              aria-label={
                hasDetail
                  ? `View details for ${item.title} at ${item.subtitle}`
                  : undefined
              }
              onClick={
                hasDetail ? () => setPatchNotesView("detail") : undefined
              }
              onKeyDown={
                hasDetail
                  ? (e: React.KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setPatchNotesView("detail");
                      }
                    }
                  : undefined
              }
              className={
                hasDetail
                  ? "cursor-pointer group min-h-full rounded-md border px-2 py-1.5 transition-all duration-150 shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.45)] active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-0"
                  : "min-h-full"
              }
              style={
                hasDetail
                  ? {
                      outline: "none",
                      borderColor: `${item.color}55`,
                      backgroundColor: `${item.color}0d`,
                      boxShadow: `0 2px 8px rgba(0,0,0,0.35), inset 0 0 0 1px ${item.color}22`,
                    }
                  : undefined
              }
            >
              {hasDetail && (
                <div className="mb-2">
                  <span
                    className="opacity-80 group-hover:opacity-100 group-focus:opacity-100 transition-opacity text-[9px] font-mono uppercase tracking-wider"
                    style={{ color: item.color }}
                  >
                    Click for details →
                  </span>
                </div>
              )}
              <div>
                {item.primaryUrl ? (
                  <a
                    href={item.primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono font-bold hover:underline underline-offset-2"
                    style={{ color: item.color }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {item.title}
                  </a>
                ) : (
                  <h3
                    className="text-sm font-mono font-bold"
                    style={{ color: item.color }}
                  >
                    {item.title}
                  </h3>
                )}
                <p className="text-[11px] font-mono text-white mt-1">
                  {item.subtitle}
                  {item.shortDescription && (
                    <>
                      {" "}
                      &middot;{" "}
                      <span style={{ color: item.color, opacity: 0.75 }}>
                        {item.shortDescription}
                      </span>
                    </>
                  )}{" "}
                  &middot; {item.period}
                </p>
              </div>

              <div className="flex flex-wrap gap-1 mt-1.5">
                {item.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-1.5 py-0.5 text-[9px] font-mono rounded border"
                    style={{
                      color: item.color,
                      borderColor: `${item.color}40`,
                      backgroundColor: `${item.color}10`,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {!hasDetail && item.summary && item.achievements.length === 0 && (
                <p className="text-[10px] md:text-[11px] font-mono text-white/60 italic mt-1.5">
                  {item.summary}
                </p>
              )}

              <ul className="space-y-1 mt-1.5">
                {item.achievements.map((ach, i) => (
                  <li
                    key={i}
                    className="text-[10px] md:text-[11px] font-mono text-white leading-relaxed flex gap-1.5"
                  >
                    <span className="text-muted shrink-0">&rsaquo;</span>
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 overflow-y-auto flex flex-col gap-2"
          >
            {/* Back button */}
            <button
              onClick={() => setPatchNotesView("main")}
              className="flex items-center gap-1 text-[9px] font-mono text-muted hover:text-white transition-colors self-start"
            >
              <span>←</span>
              <span>{item.subtitle}</span>
            </button>

            {/* Detail title */}
            <h3
              className="text-sm font-mono font-bold"
              style={{ color: item.color }}
            >
              {item.shortDescription}
            </h3>

            {/* Full description */}
            <p className="text-[10px] md:text-[11px] font-mono text-white/70 leading-relaxed">
              <HighlightedText
                text={item.summary ?? ""}
                keywords={item.techStack}
                color={item.color}
              />
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HighlightedText({
  text,
  keywords,
  color,
}: {
  text: string;
  keywords: string[];
  color: string;
}) {
  if (keywords.length === 0) return <>{text}</>;

  const escaped = [...keywords]
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isKeyword = keywords.some(
          (k) => k.toLowerCase() === part.toLowerCase(),
        );
        return isKeyword ? (
          <span key={i} style={{ color, fontWeight: 600 }}>
            {part}
          </span>
        ) : (
          part
        );
      })}
    </>
  );
}
