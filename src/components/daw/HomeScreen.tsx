"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/store/uiStore";

gsap.registerPlugin(useGSAP);

const TRACK_COLORS = [
  "#00e5ff",
  "#ff00ff",
  "#76ff03",
  "#b388ff",
  "#ff9100",
  "#ff4081",
  "#ffea00",
];

const LOADING_PHRASES = [
  "loading life...",
  "generating passions...",
  "trying something new...",
  "compiling late nights...",
  "rendering caffeine...",
  "importing curiosity...",
  "building the future.flp...",
  "sampling memories...",
  "mixing ambitions...",
  "exporting dreams...",
  "patching creativity...",
  "quantizing existence...",
  "debugging myself...",
  "defragging the heart...",
  "git push origin main...",
];

const DURATION_MS = 5000;
const PHRASE_INTERVAL_MS = 1200;

export default function HomeScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const openWorkspace = useUIStore((s) => s.openWorkspaceFromHome);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      gsap.from(containerRef.current, {
        opacity: 0,
        duration: reducedMotion ? 0.01 : 0.35,
        ease: "power2.out",
      });
    },
    { scope: containerRef },
  );

  useEffect(() => {
    if (!loading) return;

    setPhraseIdx(Math.floor(Math.random() * LOADING_PHRASES.length));
    setProgress(0);

    const phraseTimer = setInterval(() => {
      setPhraseIdx((i) => (i + 1) % LOADING_PHRASES.length);
    }, PHRASE_INTERVAL_MS);

    const start = Date.now();
    const progressTimer = setInterval(() => {
      const p = Math.min((Date.now() - start) / DURATION_MS, 1);
      setProgress(p);
      if (p >= 1) {
        clearInterval(progressTimer);
        clearInterval(phraseTimer);
        openWorkspace();
      }
    }, 40);

    return () => {
      clearInterval(phraseTimer);
      clearInterval(progressTimer);
    };
  }, [loading, openWorkspace]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-monitor flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between h-11 px-4 bg-surface/60 border-b border-grid shrink-0">
        <button
          onClick={() => setProfileOpen((o) => !o)}
          className="flex items-center gap-2.5 cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
        >
          <div className="relative w-7 h-7 rounded-full overflow-hidden bg-elevated shrink-0">
            <Image
              src="/profile.jpg"
              alt="Avin Shetty"
              fill
              className="object-cover"
              sizes="28px"
            />
          </div>
          <span className="text-xs font-mono text-white font-medium tracking-wide">
            Avin Shetty
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-white/70 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <LiveClock />
      </div>

      {/* Profile bio modal */}
      <AnimatePresence>
        {profileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-30 bg-black/50"
              onClick={() => setProfileOpen(false)}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            >
              <div
                className="pointer-events-auto flex flex-col items-center gap-6 px-16 py-12 rounded-xl border border-grid bg-surface"
                style={{
                  boxShadow:
                    "0 0 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,229,255,0.12)",
                }}
              >
                <div
                  className="relative w-56 h-56 rounded-lg overflow-hidden border-[3px] border-cyan/50"
                  style={{
                    boxShadow:
                      "0 0 24px rgba(0,229,255,0.25), 0 0 48px rgba(0,229,255,0.1)",
                  }}
                >
                  <Image
                    src="/profile.jpg"
                    alt="Avin Shetty"
                    fill
                    className="object-cover"
                    sizes="224px"
                  />
                </div>
                <h2 className="text-2xl font-mono font-bold text-primary tracking-wide">
                  Avin Shetty
                </h2>
                <a
                  href="mailto:a26shett@uwaterloo.ca"
                  className="text-sm font-mono text-cyan hover:underline"
                >
                  a26shett@uwaterloo.ca
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop area */}
      <div
        ref={desktopRef}
        className="flex-1 relative overflow-hidden"
      >
        <motion.button
          drag
          dragConstraints={desktopRef}
          dragMomentum={false}
          dragElastic={0}
          onDoubleClick={() => { if (!loading) setLoading(true); }}
          animate={{ scale: 1 }}

          className="absolute flex flex-col items-center gap-3 p-3 rounded-xl focus:outline-none hover:bg-elevated/50 transition-colors"
          style={{ top: 24, left: 24, cursor: "grab", touchAction: "none" }}
        >
          {/* Project icon thumbnail */}
          <div className="relative w-28 h-20 md:w-36 md:h-24 rounded-lg overflow-hidden border border-white/10">
            <Image
              src="/daw-icon.png"
              alt="avin_shetty.portfolio"
              fill
              className="object-cover"
              sizes="144px"
            />
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs md:text-sm font-mono text-white tracking-wide">
              avin_shetty.portfolio
            </span>
            <FileDate />
          </div>
        </motion.button>
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center h-7 px-4 bg-surface/40 border-t border-grid shrink-0">
        <span className="text-[9px] font-mono text-dim">
          1 item &middot; Double-click to open
        </span>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-0"
            style={{ background: "rgba(6, 6, 10, 0.96)" }}
          >
            {/* Animated equalizer bars */}
            <div className="flex items-end gap-0.75 mb-10" style={{ height: 44 }}>
              {[35, 60, 48, 80, 55, 40, 70, 45, 62, 75, 42, 58].map((h, i) => {
                const color = TRACK_COLORS[i % TRACK_COLORS.length];
                return (
                  <motion.div
                    key={i}
                    className="w-0.75 rounded-sm"
                    animate={{
                      scaleY: [0.2, 1, 0.4, 0.9, 0.3, 1, 0.5],
                      opacity: [0.6, 1, 0.65, 1, 0.55, 1, 0.7],
                    }}
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      delay: i * 0.08,
                      ease: "easeInOut",
                    }}
                    style={{
                      height: `${h}%`,
                      transformOrigin: "bottom",
                      backgroundColor: color,
                      boxShadow: `0 0 6px ${color}88`,
                    }}
                  />
                );
              })}
            </div>

            {/* Cycling phrase */}
            <div className="h-7 flex items-center justify-center mb-8">
              <AnimatePresence mode="wait">
                <motion.span
                  key={phraseIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="text-sm font-mono tracking-widest"
                  style={{ color: "rgba(0,229,255,0.85)" }}
                >
                  {LOADING_PHRASES[phraseIdx]}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div
              className="rounded-full overflow-hidden"
              style={{
                width: 240,
                height: 2,
                background: "rgba(0,229,255,0.12)",
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress * 100}%`,
                  background: "rgba(0,229,255,0.8)",
                  boxShadow: "0 0 8px rgba(0,229,255,0.6)",
                  transition: "width 0.04s linear",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <span className="text-[10px] font-mono text-white tabular-nums">
      {time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
    </span>
  );
}

function FileDate() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  const formatted = time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <span className="text-[10px] font-mono text-white/60 tabular-nums">
      Today, {formatted}
    </span>
  );
}
