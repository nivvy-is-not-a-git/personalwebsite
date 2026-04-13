"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import TopToolbar from "./TopToolbar";
import PluginsSidebar from "./PluginsSidebar";
import PlaylistTimeline from "./PlaylistTimeline";
import BottomMixer from "./BottomMixer";

gsap.registerPlugin(useGSAP);

export default function DAWWorkspace() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      gsap.from(containerRef.current, {
        opacity: 0,
        duration: reducedMotion ? 0.01 : 0.4,
        ease: "power2.out",
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col bg-monitor text-primary"
    >
      {/* Top Toolbar */}
      <TopToolbar />

      {/* Main area: sidebar + timeline */}
      <div className="flex flex-1 min-h-0">
        <PluginsSidebar />
        <PlaylistTimeline />
      </div>

      {/* Bottom Mixer */}
      <BottomMixer />
    </div>
  );
}
