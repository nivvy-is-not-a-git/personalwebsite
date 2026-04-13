"use client";

import { useUIStore } from "@/lib/store/uiStore";
import PowerButton from "./PowerButton";
import ScanlineOverlay from "./ScanlineOverlay";
import BootSequence from "../boot/BootSequence";
import DAWWorkspace from "../daw/DAWWorkspace";
import HomeScreen from "../daw/HomeScreen";

/** Layered CSS backgrounds: fine vertical striations + warm wash over beige/brown base */
const woodBezelBg = [
  "repeating-linear-gradient(90deg, transparent 0 2px, rgba(55,40,28,0.07) 2px 3px)",
  "repeating-linear-gradient(90deg, rgba(90,65,45,0.06) 0 1px, transparent 1px 11px, rgba(45,32,22,0.09) 11px 12px, transparent 12px 24px)",
  "linear-gradient(95deg, rgba(245,230,210,0.35) 0%, transparent 42%, rgba(70,48,32,0.18) 100%)",
  "linear-gradient(180deg, #e6d4bc 0%, #cfa882 26%, #b0895e 55%, #8f6b45 82%, #6b4e36 100%)",
].join(", ");

const woodNeckBg = [
  "repeating-linear-gradient(90deg, transparent 0 1px, rgba(40,28,20,0.08) 1px 2px)",
  "linear-gradient(180deg, #b0895e 0%, #8f6b45 55%, #6b4e36 100%)",
].join(", ");

const woodBaseBg = [
  "repeating-linear-gradient(90deg, transparent 0 3px, rgba(50,35,24,0.08) 3px 4px)",
  "linear-gradient(180deg, #d4bc9a 0%, #b0895e 45%, #8f6b45 100%)",
].join(", ");

export default function MonitorShell() {
  const powerState = useUIStore((s) => s.powerState);
  const screenView = useUIStore((s) => s.screenView);
  const isOn = powerState === "on";

  return (
    <div className="relative flex items-center justify-end flex-col h-screen w-screen bg-black select-none overflow-hidden">
      {/* ── Wall backlight glow ── */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          isOn ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: [
            "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(180,220,255,0.12) 0%, rgba(140,200,255,0.05) 30%, transparent 60%)",
            "radial-gradient(ellipse 60% 40% at 50% 38%, rgba(255,255,255,0.06) 0%, transparent 50%)",
          ].join(", "),
        }}
      />

      {/* ── Monitor unit (display + stand) ── */}
      <div className="relative w-full max-w-[1500px] flex flex-col items-center mb-0"
        style={{ height: "min(92vh, 980px)" }}
      >
        {/* ── Bezel ── */}
        <div
          className={`relative flex-1 w-full flex flex-col rounded-2xl overflow-hidden transition-shadow duration-700`}
          style={{
            background: woodBezelBg,
            border: "1px solid #5c4030",
            boxShadow: isOn
              ? "0 0 0 1px #3d2818, 0 20px 60px rgba(0,0,0,0.55), 0 2px 3px rgba(255,255,255,0.2) inset, 0 0 80px 20px rgba(180,220,255,0.10), 0 0 160px 60px rgba(180,220,255,0.06), 0 0 320px 120px rgba(180,220,255,0.03)"
              : "0 0 0 1px #3d2818, 0 20px 60px rgba(0,0,0,0.55), 0 2px 3px rgba(255,255,255,0.2) inset",
          }}
        >
          {/* ── Screen Inset ── */}
          <div
            className="relative flex-1 m-2 md:m-3 rounded-lg overflow-hidden border-2 border-[#3d2818]"
            style={{
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1px #2a1a12, 0 2px 8px rgba(0,0,0,0.65)",
            }}
          >
            <div className="relative w-full h-full bg-[#020202]">
              {powerState === "off" && (
                <div className="absolute inset-0 bg-[#050505]" />
              )}
              {powerState === "booting" && <BootSequence />}
              {isOn && screenView === "home" && <HomeScreen />}
              {isOn && screenView === "workspace" && <DAWWorkspace />}
              <ScanlineOverlay />
            </div>
          </div>

          {/* ── Chin ── */}
          <div className="flex items-center justify-between px-4 md:px-6 pb-1.5 pt-0.5">
            <span className="text-[8px] md:text-[9px] font-mono tracking-[0.25em] uppercase" style={{ color: "#3d2818" }}>
              Studio Monitor
            </span>
            <PowerButton />
          </div>
        </div>

        {/* ── Stand Neck ── */}
        <div
          className="relative z-10 mx-auto shrink-0"
          style={{
            width: 80,
            height: 50,
            background: woodNeckBg,
            clipPath: "polygon(10% 0%, 90% 0%, 95% 100%, 5% 100%)",
            boxShadow: "inset 1px 0 0 rgba(255,255,255,0.1), inset -1px 0 0 rgba(0,0,0,0.25)",
          }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 h-full pointer-events-none"
            style={{
              width: 20,
              background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)",
            }}
          />
        </div>

        {/* ── Pedestal Base ── */}
        <div className="relative z-10 mx-auto shrink-0">
          <div
            style={{
              width: 280,
              height: 12,
              background: woodBaseBg,
              borderRadius: "50% / 100%",
              border: "1px solid #5c4030",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 3px rgba(0,0,0,0.45)",
            }}
          />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{
              width: 180,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(255,245,230,0.25), transparent)",
            }}
          />
        </div>

        {/* ── Desk surface glow (screen light on desk) ── */}
        <div
          className={`absolute pointer-events-none transition-opacity duration-1000 ${
            isOn ? "opacity-100" : "opacity-0"
          }`}
          style={{
            bottom: -40,
            left: "10%",
            right: "10%",
            height: 80,
            background: "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(180,220,255,0.14) 0%, rgba(140,200,255,0.06) 40%, transparent 80%)",
          }}
        />

        {/* ── Base reflection line ── */}
        <div
          className={`absolute pointer-events-none transition-opacity duration-1000 ${
            isOn ? "opacity-100" : "opacity-0"
          }`}
          style={{
            bottom: -4,
            left: "50%",
            transform: "translateX(-50%)",
            width: 200,
            height: 3,
            background: "radial-gradient(ellipse 100% 100% at 50% 50%, rgba(200,230,255,0.15) 0%, transparent 70%)",
            filter: "blur(2px)",
          }}
        />

        {/* ── Drop shadow from base onto desk ── */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            bottom: -8,
            width: 320,
            height: 16,
            background: "rgba(0,0,0,0.4)",
            filter: "blur(12px)",
          }}
        />
      </div>
    </div>
  );
}
