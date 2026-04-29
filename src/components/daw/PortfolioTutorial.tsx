"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/store/uiStore";

const SKILL_FOLDER_IDS = ["languages", "frameworks", "devtools"];

// Rotates through clip colors from the timeline palette
const STEP_COLORS = ["#00e5ff", "#ff00ff", "#76ff03", "#b388ff", "#ff9100"];

interface TutorialStep {
  target: string;
  title: string;
  tooltip: string;
  side: "right" | "top" | "bottom";
  animateLeds?: boolean;
}

const STEPS: TutorialStep[] = [
  {
    target: "plugins-panel",
    title: "Skills Panel",
    tooltip: "These tags show the tools and skills used in each track.",
    side: "right",
    animateLeds: true,
  },
  {
    // Targets the entire bottom panel so the whole mixer is highlighted
    target: "bottom-panel",
    title: "EQ Rack",
    tooltip:
      "This displays the track description — hover the playhead or select a clip to see details here.",
    side: "top",
  },
  {
    target: "play-button",
    title: "Play",
    tooltip: "Hit play to preview the track.",
    side: "bottom",
  },
  {
    target: "record-button",
    title: "Export",
    tooltip: "Use this to export and download the track.",
    side: "bottom",
  },
  {
    target: "crossfader-zone",
    title: "Crossfader",
    tooltip:
      "Drag the crossfader to switch between parallel clips — the EQ rack updates to reflect whichever track is in focus.",
    side: "top",
  },
];

const TOOLTIP_W = 288;
const TOOLTIP_H = 190;
const PAD = 10;

function computeTooltipPos(
  spotRect: { x: number; y: number; w: number; h: number },
  side: TutorialStep["side"],
  vw: number,
  vh: number
): { left: number; top: number } {
  const clampX = (v: number) => Math.max(8, Math.min(v, vw - TOOLTIP_W - 8));
  const clampY = (v: number) => Math.max(8, Math.min(v, vh - TOOLTIP_H - 8));

  if (side === "right") {
    return {
      left: clampX(spotRect.x + spotRect.w + 16),
      top: clampY(spotRect.y + spotRect.h / 2 - TOOLTIP_H / 2),
    };
  }
  if (side === "bottom") {
    return {
      left: clampX(spotRect.x + spotRect.w / 2 - TOOLTIP_W / 2),
      top: clampY(spotRect.y + spotRect.h + 16),
    };
  }
  // top
  return {
    left: clampX(spotRect.x + spotRect.w / 2 - TOOLTIP_W / 2),
    top: clampY(spotRect.y - TOOLTIP_H - 16),
  };
}

function ArrowButton({
  direction,
  onClick,
  disabled,
  label,
  hoverColor = "#00e5ff",
}: {
  direction: "left" | "right";
  onClick: () => void;
  disabled?: boolean;
  label: string;
  hoverColor?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-center justify-center p-1 ${
        disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
      }`}
      style={{
        color: disabled
          ? "var(--color-muted)"
          : hovered
            ? hoverColor
            : "var(--color-muted)",
        transition: "color 0.15s",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {direction === "left" ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 18 15 12 9 6" />
        )}
      </svg>
    </button>
  );
}

export default function PortfolioTutorial() {
  // step -1 = welcome screen; 0–4 = tutorial steps
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(-1);
  const [targetRectState, setTargetRectState] = useState<{ rect: DOMRect; step: number } | null>(null);

  const tutorialTrigger = useUIStore((s) => s.tutorialTrigger);
  const expandedFolders = useUIStore((s) => s.expandedFolders);
  const toggleFolder = useUIStore((s) => s.toggleFolder);
  const setCrossfaderValue = useUIStore((s) => s.setCrossfaderValue);
  const setTutorialCrossfaderForced = useUIStore(
    (s) => s.setTutorialCrossfaderForced
  );

  // First-visit check
  useEffect(() => {
    if (!sessionStorage.getItem("portfolioTutorialSeen")) {
      setVisible(true);
      setStep(-1);
    }
  }, []);

  // Reopen when ? button increments tutorialTrigger
  const prevTriggerRef = useRef(tutorialTrigger);
  useEffect(() => {
    if (tutorialTrigger > 0 && tutorialTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = tutorialTrigger;
      setVisible(true);
      setStep(-1);
    }
  }, [tutorialTrigger]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem("portfolioTutorialSeen", "1");
    document.body.classList.remove("tutorial-led-active");
    setTutorialCrossfaderForced(false);
    setVisible(false);
  }, [setTutorialCrossfaderForced]);

  const goNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  const goBack = useCallback(() => {
    setStep((s) => s - 1);
  }, []);

  // Measure target element + manage per-step side effects
  useEffect(() => {
    if (!visible || step < 0) return;

    const currentStep = STEPS[step];

    // Step 0: open skill folders + flash LEDs
    if (step === 0) {
      SKILL_FOLDER_IDS.forEach((id) => {
        if (!expandedFolders[id]) toggleFolder(id);
      });
      document.body.classList.add("tutorial-led-active");
    } else {
      document.body.classList.remove("tutorial-led-active");
    }

    const measure = () => {
      const el = document.querySelector(
        `[data-tutorial="${currentStep.target}"]`
      );
      if (el) setTargetRectState({ rect: el.getBoundingClientRect(), step });
    };

    const t = setTimeout(measure, step === 0 ? 120 : 0);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, visible]);

  // Step 4: force real crossfader visible + animate its value
  useEffect(() => {
    if (!visible || step !== 4) {
      setTutorialCrossfaderForced(false);
      return;
    }

    const savedValue = useUIStore.getState().crossfaderValue;
    setTutorialCrossfaderForced(true);

    let raf: number;
    let startTime = 0;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const t = ((time - startTime) / 2500) % 1;
      setCrossfaderValue(t < 0.5 ? t * 2 : (1 - t) * 2);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      setTutorialCrossfaderForced(false);
      setCrossfaderValue(savedValue);
    };
  }, [step, visible, setCrossfaderValue, setTutorialCrossfaderForced]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove("tutorial-led-active");
      setTutorialCrossfaderForced(false);
    };
  }, [setTutorialCrossfaderForced]);

  if (!visible) return null;

  // ── Welcome screen ──────────────────────────────────────────────────
  if (step === -1) {
    return (
      <>
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 49,
            background: "rgba(0,0,0,0.72)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 52,
            width: 340,
            boxShadow:
              "0 0 0 1px rgba(0,229,255,0.08), 0 16px 48px rgba(0,0,0,0.7), 0 0 60px rgba(0,229,255,0.1)",
          }}
          className="bg-surface border border-cyan/40 rounded-xl p-6 font-mono"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] tracking-widest text-cyan/60 uppercase font-bold">
              Tutorial
            </span>
            <div className="flex-1 h-px bg-cyan/20" />
            <button
              onClick={dismiss}
              aria-label="Skip tutorial"
              className="text-muted hover:text-white transition-colors text-[11px]"
            >
              ✕
            </button>
          </div>

          <h2 className="text-sm font-bold text-white mb-2 leading-snug">
            Welcome to my portfolio!
          </h2>
          <p className="text-[11px] text-white/65 leading-relaxed">
            This is built like a DAW — a music production workspace. Hit the
            arrow for a quick intro to each section.
          </p>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={dismiss}
              className="text-[10px] text-muted hover:text-white transition-colors"
            >
              Skip
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted">{STEPS.length} steps</span>
              <ArrowButton
                direction="right"
                onClick={goNext}
                label="Start tutorial"
                hoverColor={STEP_COLORS[0]}
              />
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // ── Tutorial steps ──────────────────────────────────────────────────
  // Treat rect as valid only if it was measured for the current step —
  // avoids a stale-rect render when step changes before the effect fires.
  const targetRect = targetRectState?.step === step ? targetRectState.rect : null;

  // Keep the backdrop visible while measuring so the DAW doesn't flash through
  if (!targetRect) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "rgba(0,0,0,0.72)",
        }}
        aria-hidden="true"
      />
    );
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Clamp the spotlight rect to viewport bounds so all four edges are always visible
  const rawX = targetRect.left - PAD;
  const rawY = targetRect.top - PAD;
  const rawRight = targetRect.right + PAD;
  const rawBottom = targetRect.bottom + PAD;
  const clampedX = Math.max(0, rawX);
  const clampedY = Math.max(0, rawY);
  const spotRect = {
    x: clampedX,
    y: clampedY,
    w: Math.min(rawRight, vw) - clampedX,
    h: Math.min(rawBottom, vh) - clampedY,
  };
  const currentStep = STEPS[step];
  const color = STEP_COLORS[step % STEP_COLORS.length];
  const tooltipPos = computeTooltipPos(spotRect, currentStep.side, vw, vh);

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 49 }}
        aria-hidden="true"
      />

      {/* SVG dimming overlay with spotlight hole */}
      <svg
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <defs>
          <mask id="tut-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={spotRect.x}
              y={spotRect.y}
              width={spotRect.w}
              height={spotRect.h}
              rx="6"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.72)"
          mask="url(#tut-mask)"
        />
      </svg>

      {/* Pulsing highlight ring */}
      <motion.div
        key={`ring-${step}`}
        style={{
          position: "fixed",
          left: spotRect.x,
          top: spotRect.y,
          width: spotRect.w,
          height: spotRect.h,
          zIndex: 51,
          borderRadius: 6,
          border: `2px solid ${color}d9`,
          boxShadow: `0 0 18px ${color}59, inset 0 0 8px ${color}1a`,
          pointerEvents: "none",
        }}
        animate={{ opacity: [1, 0.45, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`tooltip-${step}`}
          style={{
            position: "fixed",
            left: tooltipPos.left,
            top: tooltipPos.top,
            width: TOOLTIP_W,
            zIndex: 52,
            boxShadow: `0 0 0 1px ${color}14, 0 8px 32px rgba(0,0,0,0.6), 0 0 40px ${color}1e`,
            border: `1px solid ${color}66`,
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-surface rounded-lg p-4 font-mono"
        >
          <div className="text-[9px] text-muted mb-1 tracking-wider">
            {step + 1} / {STEPS.length}
          </div>

          <div className="text-xs font-bold mb-2 tracking-wide uppercase" style={{ color }}>
            {currentStep.title}
          </div>

          <p className="text-[11px] text-white/80 leading-relaxed">
            {currentStep.tooltip}
          </p>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={dismiss}
              className="text-[10px] text-muted hover:text-white transition-colors"
            >
              Skip
            </button>
            <div className="flex items-center gap-2">
              <ArrowButton
                direction="left"
                onClick={goBack}
                label="Previous step"
                hoverColor={color}
              />
              <ArrowButton
                direction="right"
                onClick={goNext}
                label={step < STEPS.length - 1 ? "Next step" : "Finish tutorial"}
                hoverColor={color}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
