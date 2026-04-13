"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/store/uiStore";

gsap.registerPlugin(useGSAP);

export default function HomeScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const openWorkspace = useUIStore((s) => s.openWorkspaceFromHome);
  const [profileOpen, setProfileOpen] = useState(false);

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

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-monitor flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between h-11 px-4 bg-surface/60 border-b border-grid shrink-0">
        <button
          onClick={() => setProfileOpen((o) => !o)}
          className="flex items-center gap-2.5 px-2.5 py-1 -ml-1.5 rounded border border-cyan/30 bg-cyan/10 hover:bg-cyan/20 hover:border-cyan/50 transition-all cursor-pointer"
          style={{ boxShadow: "0 0 8px rgba(0,229,255,0.1)" }}
        >
          <div
            className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-cyan/70 bg-elevated shrink-0"
            style={{ boxShadow: "0 0 10px rgba(0,229,255,0.2)" }}
          >
            <Image
              src="/profile.jpg"
              alt="Avin Shetty"
              fill
              className="object-cover"
              sizes="28px"
            />
          </div>
          <span className="text-xs font-mono text-cyan font-bold tracking-wider">
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
            className={`text-cyan transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
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
      <div className="flex-1 flex items-center justify-center p-8">
        {/* File icon */}
        <motion.button
          onClick={openWorkspace}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-3 p-6 rounded-xl cursor-pointer
                     hover:bg-elevated/50 transition-colors focus:outline-none
                     focus-visible:ring-1 focus-visible:ring-cyan/50"
        >
          {/* FL-style file icon */}
          <div
            className="relative w-16 h-20 md:w-20 md:h-24 rounded-lg border border-cyan/30 flex flex-col items-center justify-center"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,229,255,0.08) 0%, rgba(0,229,255,0.02) 100%)",
              boxShadow:
                "0 0 20px rgba(0,229,255,0.08), inset 0 1px 0 rgba(0,229,255,0.1)",
            }}
          >
            {/* Waveform decoration inside icon */}
            <div className="flex items-end gap-[2px] h-6 mb-1">
              {[40, 70, 55, 85, 60, 45, 75, 50].map((h, i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-t-sm bg-cyan/50"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            {/* File extension badge */}
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-cyan/20 border border-cyan/30 rounded text-[7px] font-mono text-cyan font-bold">
              .flp
            </div>
          </div>

          {/* Filename */}
          <span className="text-xs md:text-sm font-mono text-cyan tracking-wide">
            avin_shetty.portfolio
          </span>
        </motion.button>
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center h-7 px-4 bg-surface/40 border-t border-grid shrink-0">
        <span className="text-[9px] font-mono text-dim">
          1 item &middot; Double-click to open
        </span>
      </div>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-[10px] font-mono text-muted tabular-nums">
      {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}
