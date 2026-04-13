"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useUIStore } from "@/lib/store/uiStore";

const BOOT_LINES = [
  "STUDIO MONITOR BIOS v2.0.26",
  "",
  "Initializing system...",
  "Detecting plugins............. OK",
  "Loading workspace............. OK",
  "Memory: 16384 MB ............. OK",
  "Mounting timeline engine...... OK",
  "",
  "All systems nominal.",
];

const LINE_DELAY = 120; // ms between lines
const PROGRESS_DURATION = 0.6; // seconds
const FLASH_DURATION = 0.15;

export default function BootSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const setPowerState = useUIStore((s) => s.setPowerState);
  const setScreenView = useUIStore((s) => s.setScreenView);
  const bootTarget = useUIStore((s) => s.bootTarget);
  const [visibleLines, setVisibleLines] = useState(0);

  const finishBoot = () => {
    setPowerState("on");
    setScreenView(bootTarget);
  };

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      setVisibleLines(BOOT_LINES.length);
      finishBoot();
      return;
    }

    // Flicker the screen on
    const el = containerRef.current;
    if (!el) return;

    const tl = gsap.timeline();

    // Initial flicker
    tl.fromTo(
      el,
      { opacity: 0 },
      { opacity: 1, duration: 0.08, ease: "power1.in" }
    )
      .to(el, { opacity: 0.3, duration: 0.05 })
      .to(el, { opacity: 1, duration: 0.06 })
      .to(el, { opacity: 0.6, duration: 0.04 })
      .to(el, { opacity: 1, duration: 0.08 });

    // Type out BIOS lines
    const lineTimers: ReturnType<typeof setTimeout>[] = [];
    const flickerEnd = 300; // approx ms after flicker completes

    BOOT_LINES.forEach((_, i) => {
      const timer = setTimeout(() => {
        setVisibleLines(i + 1);
      }, flickerEnd + i * LINE_DELAY);
      lineTimers.push(timer);
    });

    // Progress bar + transition
    const totalLineTime = flickerEnd + BOOT_LINES.length * LINE_DELAY;

    const progressTimer = setTimeout(() => {
      if (progressRef.current) {
        gsap.to(progressRef.current, {
          width: "100%",
          duration: PROGRESS_DURATION,
          ease: "power2.out",
          onComplete: () => {
            // Quick flash then reveal DAW
            if (el) {
              gsap.to(el, {
                opacity: 0,
                duration: FLASH_DURATION,
                ease: "power2.in",
                onComplete: finishBoot,
              });
            }
          },
        });
      }
    }, totalLineTime + 200);

    return () => {
      tl.kill();
      lineTimers.forEach(clearTimeout);
      clearTimeout(progressTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-[#0a0a0a] flex flex-col justify-center px-6 md:px-12 font-mono text-xs md:text-sm"
      style={{ opacity: 0 }}
    >
      {/* BIOS text */}
      <div className="space-y-1 text-lime mb-6">
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={
              i === 0
                ? "text-cyan font-bold text-sm md:text-base mb-2"
                : "text-lime/80"
            }
          >
            {line || "\u00A0"}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {visibleLines >= BOOT_LINES.length && (
        <div className="w-full max-w-md h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            ref={progressRef}
            className="h-full bg-cyan rounded-full"
            style={{ width: "0%" }}
          />
        </div>
      )}
    </div>
  );
}
