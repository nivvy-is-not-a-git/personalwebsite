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
    <div className="h-44 md:h-52 shrink-0 bg-surface border-t border-grid flex flex-col">
      <div className="flex flex-1 min-h-0">
        {/* EQ Rack */}
        <div className="w-1/2 md:w-2/5 border-r border-grid p-3 flex flex-col">
          <div className="text-[10px] font-mono text-muted mb-2 tracking-wider uppercase">
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
                onChange={(e) =>
                  setCrossfaderValue(parseFloat(e.target.value))
                }
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
            className="text-[7px] md:text-[8px] font-mono mt-1.5 truncate w-full text-center"
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
    return <PatchNotesContent key={displayItem.id} item={displayItem} opacity={1} />;
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
          <PatchNotesContent key={displayItem.id} item={displayItem} opacity={1} />
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
  const hasDetail = item.track === "experience" && !!item.shortDescription && !!item.summary;
  const view = hasDetail ? patchNotesView : "main";

  return (
    <div className="flex-1 min-h-0 relative overflow-hidden" style={{ opacity }}>
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
            <div className="text-[10px] font-mono text-muted mb-2 tracking-wider uppercase">
              Patch Notes
            </div>
            <div>
              {item.primaryUrl ? (
                <a
                  href={item.primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono font-bold hover:underline underline-offset-2"
                  style={{ color: item.color }}
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
              <p className="text-[11px] font-mono text-secondary">
                {item.subtitle}
                {item.shortDescription && (
                  <> &middot; <span style={{ color: item.color, opacity: 0.75 }}>{item.shortDescription}</span></>
                )}
                {" "}&middot; {item.period}
              </p>
            </div>

            <div className="flex flex-wrap gap-1">
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
              <p className="text-[10px] md:text-[11px] font-mono text-secondary/60 italic">
                {item.summary}
              </p>
            )}

            <ul className="space-y-1">
              {item.achievements.map((ach, i) => (
                <li
                  key={i}
                  className="text-[10px] md:text-[11px] font-mono text-secondary leading-relaxed flex gap-1.5"
                >
                  <span className="text-muted shrink-0">&rsaquo;</span>
                  <span>{ach}</span>
                </li>
              ))}
            </ul>

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
              className="flex items-center gap-1 text-[9px] font-mono text-muted hover:text-secondary transition-colors self-start"
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
            <p className="text-[10px] md:text-[11px] font-mono text-secondary/70 leading-relaxed">
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
          (k) => k.toLowerCase() === part.toLowerCase()
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
